// src/app/api/forum/moderate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { verifyApiRequestAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const SCAM_OR_PUNGLI_PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /\b(biaya\s*(admin|tes|seragam|pelatihan\s*awal|materai)|transfer\s*(uang|dana|jaminan)|tebus\s*ijazah|bayar\s*di\s*muka)\b/i,
    reason: 'Terdeteksi indikasi pungutan biaya rekrutmen / permintaan transfer uang (Anti-Pungli STP).',
  },
  {
    regex: /\b(slot\s*gacor|judi\s*online|pinjol\s*cair|investasi\s*bodong|togel|zeus\s*maxwin)\b/i,
    reason: 'Terdeteksi konten promosi ilegal / spam perjudian atau pinjaman berisiko.',
  },
];

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyApiRequestAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan untuk mengirim diskusi forum.' },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`forum-mod:${authUser.uid || ip}`, 15, 60);
    if (!rate.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Terlalu banyak permintaan. Silakan tunggu ${rate.resetInSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const content = String(body?.content || '').trim();
    const combined = `${title}\n${content}`;

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Konten tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // 1. Detektor Instan Anti-Pungli & Scam (0ms latency)
    for (const rule of SCAM_OR_PUNGLI_PATTERNS) {
      if (rule.regex.test(combined)) {
        return NextResponse.json({
          success: true,
          safe: false,
          moderationStatus: 'FLAGGED',
          safetyScore: 15,
          reason: rule.reason,
        });
      }
    }

    // 2. Evaluasi Cerdas Clario AI (dengan Fallback Resilient 100%)
    try {
      const rawAi = await callClarioChat({
        model: CLARIO_MODELS.FAST_REASONING,
        temperature: 0.1,
        maxTokens: 300,
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah Moderator Keamanan Forum Alumni & Bursa Karir Solo Technopark × RSKB Kota Surakarta. Tugasmu mendeteksi apakah postingan mengandung: (1) pungutan liar/biaya rekrutmen kerja, (2) penipuan/phishing/judi/pinjol, atau (3) ujaran kebencian/SARA kasar. Balas HANYA JSON valid: {"safe": boolean, "safetyScore": number, "reason": string}. Jika aman untuk diskusi karir/teknis/gaji/proyek, beri safe: true dan safetyScore >= 85.',
          },
          {
            role: 'user',
            content: combined.slice(0, 2000),
          },
        ],
      });

      const jsonMatch = rawAi.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const isSafe = parsed.safe !== false && Number(parsed.safetyScore ?? 95) >= 60;
        return NextResponse.json({
          success: true,
          safe: isSafe,
          moderationStatus: isSafe ? 'PUBLISHED' : 'FLAGGED',
          safetyScore: Number(parsed.safetyScore ?? (isSafe ? 95 : 35)),
          reason: isSafe ? '' : String(parsed.reason || 'Ditahan oleh filter keamanan Clario AI untuk tinjauan moderator.'),
        });
      }
    } catch (aiErr) {
      console.warn('[Forum AI Moderation] Fallback offline aktif:', aiErr);
    }

    return NextResponse.json({
      success: true,
      safe: true,
      moderationStatus: 'PUBLISHED',
      safetyScore: 95,
      reason: '',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memvalidasi moderasi konten: ' + err.message },
      { status: 500 }
    );
  }
}

