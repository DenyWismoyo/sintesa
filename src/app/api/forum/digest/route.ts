// src/app/api/forum/digest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CLARIO_MODELS, callClarioChat } from '@/lib/clario';
import { verifyApiRequestAuth } from '@/lib/firebaseAdmin';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyApiRequestAuth(request);
    if (!authUser || !canPerformAction(authUser.role, PERMISSIONS.MODERATE_FORUM)) {
      return NextResponse.json(
        { success: false, message: 'Hanya Moderator / Admin STP yang dapat membuat buletin mingguan AI.' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`forum-digest:${authUser.uid || ip}`, 8, 60);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, message: 'Batas pembuatan ringkasan AI tercapai. Coba sesaat lagi.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const topThreads: { title: string; channelId: string; upvoteCount?: number; replyCount?: number }[] =
      Array.isArray(body?.threads) ? body.threads.slice(0, 8) : [];
    const activeJobsCount = Number(body?.activeJobsCount || 0);
    const hiredCount = Number(body?.hiredCount || 0);

    const fallbackSummary = [
      `📢 *SOROTAN MINGGUAN EKOSISTEM ALUMNI STP × RSKB SURAKARTA*`,
      `• Lowongan Mitra Aktif: *${activeJobsCount} Posisi Terbuka*`,
      `• Serapan Alumni Tercatat: *${hiredCount} Talenta Diterima Kerja*`,
      topThreads.length > 0
        ? `\n🔥 *Topik Terhangat Minggu Ini:*\n` +
          topThreads
            .slice(0, 5)
            .map((t, i) => `${i + 1}. ${t.title} (${t.replyCount || 0} diskusi)`)
            .join('\n')
        : `\nMari ramaikan diskusi teknis, bedah CV, dan bursa proyek mikro di Portal Forum Alumni!`,
      `\n🔗 Akses langsung: /alumni-portal & /karir`,
    ].join('\n');

    try {
      const aiText = await callClarioChat({
        model: CLARIO_MODELS.INDONESIAN_PRO,
        temperature: 0.4,
        maxTokens: 600,
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah Koordinator Ekosistem Karir Solo Technopark & Rumah Siap Kerja Bersama (RSKB) Kota Surakarta. Susun buletin ringkas berbahasa Indonesia profesional, hangat, dan siap dibagikan ke grup WhatsApp maupun Papan Pengumuman Alumni (maksimal 160 kata, gunakan bullet points rapi).',
          },
          {
            role: 'user',
            content: JSON.stringify({
              activeJobsCount,
              hiredCount,
              topThreads,
            }),
          },
        ],
      });

      return NextResponse.json({
        success: true,
        digestText: aiText.trim() || fallbackSummary,
      });
    } catch {
      return NextResponse.json({
        success: true,
        digestText: fallbackSummary,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menyusun buletin AI: ' + err.message },
      { status: 500 }
    );
  }
}

