// src/app/api/jobs/ai-match/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClarioChat, CLARIO_MODELS } from '@/lib/clario';
import { jobDbService } from '@/services/jobDb.service';
import { JobAiMatchRequestSchema, JobAiMatchResponse } from '@/types/job.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = JobAiMatchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payload request tidak valid.',
          errors: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { jobId, alumniName, alumniProgram, alumniSkills, alumniExperience, resumeSnippet } =
      parseResult.data;

    // Cari data lowongan dari database snapshot
    const job = await jobDbService.getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Lowongan pekerjaan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const promptText = `
Anda adalah AI Career Advisor & Talent Matcher resmi Kawasan Sains dan Teknologi Solo Technopark (STP).
Tugas Anda adalah mengevaluasi tingkat kecocokan profil alumni program pelatihan Solo Technopark dengan lowongan pekerjaan yang dipilih, serta memberikan rekomendasi persiapan lamaran.

INFORMASI LOWONGAN PEKERJAAN:
- Posisi: ${job.title}
- Perusahaan: ${job.company} (${job.companyType})
- Kategori: ${job.category}
- Tipe Kerja: ${job.workType} (${job.workSetup})
- Tingkat Pengalaman: ${job.experienceLevel}
- Persyaratan Skill: ${job.skills.join(', ')}
- Program Pelatihan Relevan STP: ${job.relevantTrainingPrograms.join(', ')}
- Kualifikasi:
${job.requirements.map((r) => `  * ${r}`).join('\n')}

PROFIL ALUMNI PELATIHAN SOLO TECHNOPARK:
- Nama: ${alumniName || 'Alumni Solo Technopark'}
- Program Pelatihan yang Pernah Diambil: ${alumniProgram || 'Pelatihan Vokasi & Digital STP'}
- Skill yang Dikuasai: ${alumniSkills.length > 0 ? alumniSkills.join(', ') : 'Dasar kurikulum pelatihan terkait'}
- Pengalaman / Catatan: ${alumniExperience || 'Lulusan pelatihan dengan proyek studi kasus'}
- Cuplikan CV / Portofolio: ${resumeSnippet || 'Telah menyelesaikan silabus pelatihan resmi STP'}

PETUNJUK OUTPUT:
Berikan penilaian jujur, mendalam, dan memotivasi.
JAWAB HANYA DALAM FORMAT JSON BERIKUT (tanpa markdown blok tambahan diluar format JSON):
{
  "matchScore": 85,
  "matchGrade": "Sangat Cocok",
  "executiveSummary": "Ringkasan analisis kecocokan profil alumni dalam 2-3 kalimat padat.",
  "matchedSkills": ["Skill A yang sudah cocok", "Skill B"],
  "missingSkills": ["Skill C yang perlu dipelajari", "Skill D"],
  "alumniAdvantages": ["Keunggulan alumni pelatihan STP yang relevan"],
  "recommendedPreparation": [
    "Saran persiapan portofolio atau tes teknis",
    "Tips interview untuk posisi ini"
  ]
}
Catatan nilai matchGrade harus salah satu dari: "Sangat Cocok", "Cocok", "Potensial", "Perlu Peningkatan Skill".
`;

    try {
      const aiResponse = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING, // DeepSeek V4 Flash untuk evaluasi cepat & presisi
        messages: [
          {
            role: 'system',
            content:
              'Anda adalah asisten AI karir profesional Solo Technopark. Format respon Anda WAJIB merupakan objek JSON murni tanpa pembungkus kode markdown.',
          },
          { role: 'user', content: promptText },
        ],
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Pembersihan JSON
      const cleanJson = aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed: JobAiMatchResponse = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch (aiErr: any) {
      console.warn('[Clario AI Matcher] Gagal memanggil AI model, menggunakan fallback heuristik:', aiErr);

      // Fallback Heuristik Cerdas Berdasarkan Overlap Skill & Program
      const targetSkillsLower = job.skills.map((s) => s.toLowerCase());
      const alumniSkillsLower = alumniSkills.map((s) => s.toLowerCase());

      const matched = job.skills.filter((s) =>
        alumniSkillsLower.some((as) => as.includes(s.toLowerCase()) || s.toLowerCase().includes(as))
      );
      const missing = job.skills.filter((s) => !matched.includes(s));

      const isProgramMatch = alumniProgram
        ? job.relevantTrainingPrograms.some((p) =>
            p.toLowerCase().includes(alumniProgram.toLowerCase()) ||
            alumniProgram.toLowerCase().includes(p.toLowerCase())
          )
        : true;

      const baseScore = isProgramMatch ? 65 : 45;
      const skillBonus = Math.min(30, (matched.length / (job.skills.length || 1)) * 35);
      const finalScore = Math.min(95, Math.round(baseScore + skillBonus));

      let grade: JobAiMatchResponse['matchGrade'] = 'Potensial';
      if (finalScore >= 85) grade = 'Sangat Cocok';
      else if (finalScore >= 70) grade = 'Cocok';
      else if (finalScore < 55) grade = 'Perlu Peningkatan Skill';

      const fallbackResult: JobAiMatchResponse = {
        matchScore: finalScore,
        matchGrade: grade,
        executiveSummary: `Profil alumni memiliki kecocokan yang baik dengan posisi ${job.title} di ${job.company}, didukung oleh kurikulum pelatihan Solo Technopark yang relevan.`,
        matchedSkills: matched.length > 0 ? matched : [job.skills[0] || 'Dasar Keahlian'],
        missingSkills: missing.length > 0 ? missing.slice(0, 3) : ['Pengalaman spesifik proyek industri'],
        alumniAdvantages: [
          `Latar belakang kurikulum pelatihan terstandarisasi industri Solo Technopark`,
          `Pengalaman praktek langsung dengan mentor profesional`,
        ],
        recommendedPreparation: [
          `Pertegas proyek akhir pelatihan STP dalam CV dan cantumkan tautan GitHub/Portofolio`,
          `Pelajari profil ${job.company} dan siapkan penjelasan tentang bagaimana keahlian Anda dapat menyelesaikan tantangan mereka`,
        ],
      };

      return NextResponse.json(fallbackResult);
    }
  } catch (error: any) {
    console.error('[API /api/jobs/ai-match] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat menganalisis lowongan: ' + error.message },
      { status: 500 }
    );
  }
}
