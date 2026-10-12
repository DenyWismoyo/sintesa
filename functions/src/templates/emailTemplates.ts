// Lokasi file: functions/src/templates/emailTemplates.ts

/**
 * Base layout pembungkus email resmi Solo Technopark.
 * Menjamin kompatibilitas lintas email client (Gmail, Outlook, Apple Mail, Yahoo).
 */
function wrapBaseTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 3px solid #dc2626;
    }
    .content-area {
      padding: 32px 28px;
    }
    .card-detail {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .btn-cta {
      display: inline-block;
      background: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      margin-top: 10px;
    }
    .footer-area {
      background: #f1f5f9;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <div class="email-container">
          
          <!-- HEADER RESMI STP -->
          <div class="header-banner">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
              SOLO TECHNOPARK
            </h1>
            <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
              Kawasan Inovasi & Layanan Terpadu
            </p>
          </div>

          <!-- KONTEN UTAMA -->
          <div class="content-area">
            ${bodyContent}
          </div>

          <!-- FOOTER RESMI NO-REPLY -->
          <div class="footer-area">
            <p style="margin: 0 0 8px; font-weight: 700; color: #475569;">
              Solo Technopark • Kawasan Sains & Teknologi Kota Surakarta
            </p>
            <p style="margin: 0 0 12px; line-height: 1.5;">
              Jl. Ki Hajar Dewantara No.19, Jebres, Kota Surakarta, Jawa Tengah 57126<br/>
              Website: <a href="https://solotechnopark.id" style="color: #2563eb; text-decoration: none;">solotechnopark.id</a> • Bantuan: <a href="mailto:info@solotechnopark.id" style="color: #2563eb; text-decoration: none;">info@solotechnopark.id</a>
            </p>
            <div style="background: #e2e8f0; height: 1px; width: 100%; margin: 12px 0;"></div>
            <p style="margin: 0; font-size: 10px; color: #94a3b8; line-height: 1.4;">
              ⚠️ <strong>Pemberitahuan Otomatis (No-Reply):</strong> Email ini dibuat secara otomatis oleh sistem. Mohon tidak membalas email ini secara langsung. Jika Anda membutuhkan informasi atau bantuan, silakan kirim email ke <a href="mailto:info@solotechnopark.id" style="color: #64748b;">info@solotechnopark.id</a> atau hubungi WhatsApp resmi kami.
            </p>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Template Konfirmasi Pendaftaran Pelatihan / Diklat
 */
export function renderTrainingRegistrationEmail(data: {
  userName: string;
  trainingTitle: string;
  scheduleDate?: string;
  scheduleTime?: string;
  location?: string;
  registrationId: string;
  whatsappGroupUrl?: string;
}): string {
  const portalUrl = process.env.PUBLIC_PORTAL_URL || 'https://katalog.solotechnopark.id/portal';

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0;">
        Pendaftaran Berhasil
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Konfirmasi Registrasi Pelatihan
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Halo <strong>${data.userName}</strong>, pendaftaran Anda pada program pelatihan Solo Technopark telah kami terima.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="35%" style="color: #64748b; font-weight: 600;">ID Registrasi</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${data.registrationId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Nama Program</td>
          <td style="font-weight: 700; color: #0f172a;">${data.trainingTitle}</td>
        </tr>
        ${data.scheduleDate ? `
        <tr>
          <td style="color: #64748b; font-weight: 600;">Jadwal Mulai</td>
          <td style="font-weight: 700; color: #0f172a;">${data.scheduleDate} ${data.scheduleTime ? `(${data.scheduleTime})` : ''}</td>
        </tr>` : ''}
        ${data.location ? `
        <tr>
          <td style="color: #64748b; font-weight: 600;">Lokasi Pelaksanaan</td>
          <td style="font-weight: 700; color: #0f172a;">${data.location}</td>
        </tr>` : ''}
      </table>
    </div>

    ${data.whatsappGroupUrl ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #166534;">
        Bergabunglah ke Grup Peserta untuk Info Koordinasi:
      </p>
      <a href="${data.whatsappGroupUrl}" style="display: inline-block; background: #16a34a; color: #ffffff !important; padding: 8px 18px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;">
        Gabung Grup WhatsApp
      </a>
    </div>` : ''}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${portalUrl}" class="btn-cta">
        Buka Portal Personal Saya
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
        Pantau progres modul, presensi, dan e-sertifikat melalui Portal Saya.
      </p>
    </div>
  `;

  return wrapBaseTemplate('Konfirmasi Pendaftaran Pelatihan - Solo Technopark', body);
}

/**
 * 2. Template Konfirmasi Peminjaman / Reservasi Fasilitas
 */
export function renderBookingConfirmationEmail(data: {
  userName: string;
  assetName: string;
  bookingId: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalPrice?: number;
  status: string;
}): string {
  const portalUrl = process.env.PUBLIC_PORTAL_URL || 'https://katalog.solotechnopark.id/portal';

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #bfdbfe;">
        Pengajuan Reservasi Diterima
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Detail Peminjaman Fasilitas
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Halo <strong>${data.userName}</strong>, permohonan reservasi sarana dan prasarana Solo Technopark telah tercatat.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="35%" style="color: #64748b; font-weight: 600;">Nomor Referensi</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${data.bookingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Fasilitas / Ruangan</td>
          <td style="font-weight: 700; color: #0f172a;">${data.assetName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Tanggal Pemakaian</td>
          <td style="font-weight: 700; color: #0f172a;">${data.startDate} ${data.endDate && data.endDate !== data.startDate ? `s/d ${data.endDate}` : ''}</td>
        </tr>
        ${data.startTime ? `
        <tr>
          <td style="color: #64748b; font-weight: 600;">Waktu Sewa</td>
          <td style="font-weight: 700; color: #0f172a;">${data.startTime} - ${data.endTime || 'Selesai'}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #64748b; font-weight: 600;">Status Permohonan</td>
          <td style="font-weight: 800; color: #2563eb;">${data.status.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${portalUrl}" class="btn-cta">
        Pantau Status Reservasi di Portal
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
        Tim pengelola kawasan akan memverifikasi kesiapan ruangan dalam 1x24 jam kerja.
      </p>
    </div>
  `;

  return wrapBaseTemplate('Konfirmasi Reservasi Fasilitas - Solo Technopark', body);
}

/**
 * 3. Template Notifikasi Invoice E-Katalog
 */
export function renderInvoiceEmail(data: {
  userName: string;
  invoiceNumber: string;
  amount: number;
  productName: string;
  dueDate: string;
  paymentUrl?: string;
}): string {
  const portalUrl = process.env.PUBLIC_PORTAL_URL || 'https://katalog.solotechnopark.id/portal';
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.amount);

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #fef3c7; color: #b45309; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #fde68a;">
        Menunggu Pembayaran
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Tagihan Layanan & E-Katalog
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Halo <strong>${data.userName}</strong>, berikut adalah rincian tagihan pesanan Anda di Solo Technopark.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="35%" style="color: #64748b; font-weight: 600;">Nomor Invoice</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Layanan / Produk</td>
          <td style="font-weight: 700; color: #0f172a;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Total Tagihan</td>
          <td style="font-weight: 900; font-size: 16px; color: #0f172a;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Batas Pembayaran</td>
          <td style="font-weight: 700; color: #dc2626;">${data.dueDate}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.paymentUrl || portalUrl}" class="btn-cta">
        Lihat Instruksi Pembayaran & Bayar
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
        Layanan Anda akan otomatis aktif setelah pembayaran terverifikasi oleh bendahara BLUD.
      </p>
    </div>
  `;

  return wrapBaseTemplate(`Tagihan ${data.invoiceNumber} - Solo Technopark`, body);
}

/**
 * 4. Template Kuitansi Pembayaran Berhasil (Lunas)
 */
export function renderPaymentReceiptEmail(data: {
  userName: string;
  invoiceNumber: string;
  receiptNumber: string;
  amount: number;
  productName: string;
  paidAt: string;
  paymentMethod: string;
}): string {
  const portalUrl = process.env.PUBLIC_PORTAL_URL || 'https://katalog.solotechnopark.id/portal';
  const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.amount);

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0;">
        Pembayaran Lunas
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Bukti Kuitansi Pembayaran Resmi
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Terima kasih <strong>${data.userName}</strong>, transaksi Anda telah sukses diverifikasi oleh Solo Technopark.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="35%" style="color: #64748b; font-weight: 600;">Nomor Kuitansi</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${data.receiptNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Nomor Invoice</td>
          <td style="font-weight: 700; color: #0f172a;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Uraian Layanan</td>
          <td style="font-weight: 700; color: #0f172a;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Jumlah Dibayar</td>
          <td style="font-weight: 900; font-size: 16px; color: #047857;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Metode Bayar</td>
          <td style="font-weight: 700; color: #0f172a;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Tanggal Lunas</td>
          <td style="font-weight: 700; color: #0f172a;">${data.paidAt}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${portalUrl}" class="btn-cta">
        Buka Portal Personal & Akses Layanan
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
        Bukti kuitansi digital ini merupakan dokumen pembayaran sah yang diterbitkan oleh sistem BLUD Solo Technopark.
      </p>
    </div>
  `;

  return wrapBaseTemplate(`Kuitansi Pembayaran ${data.receiptNumber} - Solo Technopark`, body);
}
