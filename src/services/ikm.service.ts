// src/services/ikm.service.ts
import { collection, doc, getDocs, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { IkmSurvey, IkmSurveySchema, IkmScore } from '@/types/ikm.types';

const getIkmBasePath = () =>
  `artifacts/${getAppId()}/public/data/ikm_surveys`;

export const ikmService = {
  /**
   * Menghitung nilai konversi dan predikat mutu pelayanan PermenPAN-RB No. 14/2017:
   * 88.31 - 100.00 = A (Sangat Baik)
   * 76.61 - 88.30  = B (Baik)
   * 65.00 - 76.60  = C (Kurang Baik)
   * 25.00 - 64.99  = D (Tidak Baik)
   */
  calculateIkm(scores: IkmScore): { averageScore: number; convertedScore: number; grade: 'A' | 'B' | 'C' | 'D' } {
    const values = [
      scores.u1_persyaratan,
      scores.u2_prosedur,
      scores.u3_waktu,
      scores.u4_biaya,
      scores.u5_produk,
      scores.u6_kompetensi,
      scores.u7_perilaku,
      scores.u8_sarana,
      scores.u9_pengaduan,
    ];

    const sum = values.reduce((a, b) => a + b, 0);
    const averageScore = Number((sum / values.length).toFixed(2));
    const convertedScore = Number((averageScore * 25).toFixed(2));

    let grade: 'A' | 'B' | 'C' | 'D' = 'D';
    if (convertedScore >= 88.31) grade = 'A';
    else if (convertedScore >= 76.61) grade = 'B';
    else if (convertedScore >= 65.0) grade = 'C';
    else grade = 'D';

    return { averageScore, convertedScore, grade };
  },

  /**
   * Mengirimkan kuesioner survei kepuasan masyarakat
   */
  async submitSurvey(data: Omit<IkmSurvey, 'id' | 'averageScore' | 'convertedScore' | 'grade' | 'createdAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getIkmBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();
      const calc = this.calculateIkm(data.scores);

      const payload: IkmSurvey = {
        ...data,
        id: newDocRef.id,
        averageScore: calc.averageScore,
        convertedScore: calc.convertedScore,
        grade: calc.grade,
        createdAt: now,
      };

      const parsed = IkmSurveySchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format data survei tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[ikmService] Error submitSurvey:', err);
      return { success: false, error: err.message || 'Gagal mengirimkan survei' };
    }
  },

  /**
   * Mengambil semua hasil survei untuk Admin
   */
  async getAllSurveys(maxLimit: number = 250): Promise<IkmSurvey[]> {
    try {
      const q = query(collection(db, getIkmBasePath()), orderBy('createdAt', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      const list: IkmSurvey[] = [];
      snap.docs.forEach((docSnap) => {
        const parsed = IkmSurveySchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        list.push(parsed.success ? parsed.data : ({ id: docSnap.id, ...docSnap.data() } as IkmSurvey));
      });
      return list;
    } catch (err) {
      console.warn('[ikmService] Error getAllSurveys:', err);
      return [];
    }
  },

  /**
   * Menghitung statistik komprehensif IKM
   */
  calculateSummaryStats(surveys: IkmSurvey[]) {
    if (!surveys.length) {
      return {
        totalRespondents: 0,
        overallConvertedScore: 0,
        overallGrade: 'B' as const,
        unsurAverages: {
          u1: 0, u2: 0, u3: 0, u4: 0, u5: 0, u6: 0, u7: 0, u8: 0, u9: 0
        },
      };
    }

    const total = surveys.length;
    let sumConverted = 0;
    const sums = { u1: 0, u2: 0, u3: 0, u4: 0, u5: 0, u6: 0, u7: 0, u8: 0, u9: 0 };

    surveys.forEach((s) => {
      sumConverted += s.convertedScore;
      sums.u1 += s.scores.u1_persyaratan;
      sums.u2 += s.scores.u2_prosedur;
      sums.u3 += s.scores.u3_waktu;
      sums.u4 += s.scores.u4_biaya;
      sums.u5 += s.scores.u5_produk;
      sums.u6 += s.scores.u6_kompetensi;
      sums.u7 += s.scores.u7_perilaku;
      sums.u8 += s.scores.u8_sarana;
      sums.u9 += s.scores.u9_pengaduan;
    });

    const overallConvertedScore = Number((sumConverted / total).toFixed(2));
    let overallGrade: 'A' | 'B' | 'C' | 'D' = 'D';
    if (overallConvertedScore >= 88.31) overallGrade = 'A';
    else if (overallConvertedScore >= 76.61) overallGrade = 'B';
    else if (overallConvertedScore >= 65.0) overallGrade = 'C';
    else overallGrade = 'D';

    return {
      totalRespondents: total,
      overallConvertedScore,
      overallGrade,
      unsurAverages: {
        u1: Number((sums.u1 / total).toFixed(2)),
        u2: Number((sums.u2 / total).toFixed(2)),
        u3: Number((sums.u3 / total).toFixed(2)),
        u4: Number((sums.u4 / total).toFixed(2)),
        u5: Number((sums.u5 / total).toFixed(2)),
        u6: Number((sums.u6 / total).toFixed(2)),
        u7: Number((sums.u7 / total).toFixed(2)),
        u8: Number((sums.u8 / total).toFixed(2)),
        u9: Number((sums.u9 / total).toFixed(2)),
      },
    };
  },
};

