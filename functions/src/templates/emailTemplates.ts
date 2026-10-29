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
              Website: <a href="https://katalog.solotechnopark.id" style="color: #2563eb; text-decoration: none;">katalog.solotechnopark.id</a> • Kontak Resmi: <a href="mailto:marketing@solotechnopark.id" style="color: #2563eb; text-decoration: none;">marketing@solotechnopark.id</a>
            </p>
            <div style="background: #e2e8f0; height: 1px; width: 100%; margin: 12px 0;"></div>
            <p style="margin: 0; font-size: 10px; color: #94a3b8; line-height: 1.4;">
              📧 <strong>Pemberitahuan Layanan Resmi:</strong> Email ini dikirimkan oleh Sistem Terpadu Solo Technopark. Jika Anda memerlukan bantuan lebih lanjut, silakan hubungi <a href="mailto:marketing@solotechnopark.id" style="color: #64748b;">marketing@solotechnopark.id</a> atau kanal WhatsApp layanan pelanggan kami.
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

function getBaseOrigin(): string {
  const raw = (process.env.PUBLIC_PORTAL_URL || 'https://katalog.solotechnopark.id').trim();
  return raw.replace(/\/portal\/?$/, '').replace(/\/$/, '');
}

/**
 * 5. Template Selamat Datang & Verifikasi Email Pendaftaran Pengguna Baru
 */
export function renderWelcomeVerificationEmail(data: {
  userName: string;
  email: string;
  verificationUrl?: string;
  roleLabel?: string;
  isGoogleAuth?: boolean;
}): string {
  const baseOrigin = getBaseOrigin();
  const ctaUrl = data.verificationUrl || `${baseOrigin}/portal`;
  const ctaLabel = data.verificationUrl
    ? 'Konfirmasi & Verifikasi Email Saya'
    : 'Buka Portal Personal Saya';

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #bfdbfe;">
        ${data.isGoogleAuth ? 'Akun Aktif & Terhubung' : 'Konfirmasi Akun Baru'}
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Selamat Datang di Ekosistem Solo Technopark!
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Halo <strong>${data.userName}</strong>, akun Anda dengan email <strong>${data.email}</strong> telah terdaftar sebagai <strong>${data.roleLabel || 'Pengguna Umum'}</strong>.
      </p>
    </div>

    ${data.verificationUrl ? `
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 12px; font-size: 13px; color: #0c4a6e; font-weight: 600; line-height: 1.5;">
        Klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan perlindungan penuh akun:
      </p>
      <a href="${ctaUrl}" class="btn-cta" style="background: #dc2626;">
        ${ctaLabel}
      </a>
    </div>` : ''}

    <div class="card-detail">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
        Apa saja yang dapat Anda akses dengan akun ini?
      </p>
      <table width="100%" cellspacing="0" cellpadding="5" style="font-size: 13px; color: #334155;">
        <tr>
          <td width="24" valign="top">✅</td>
          <td><strong>Layanan & E-Katalog:</strong> Pemesanan jasa produksi manufaktur, sewa ruangan, dan event kawasan.</td>
        </tr>
        <tr>
          <td valign="top">✅</td>
          <td><strong>Diklat & Akademi (LMS):</strong> Pendaftaran pelatihan vokasi, akses materi belajar, dan e-sertifikat.</td>
        </tr>
        <tr>
          <td valign="top">🎓</td>
          <td><strong>Jalur Klaim Alumni STP / RSKB:</strong> Punya kode lulusan diklat? Klaim di menu <em>Profil Saya</em> untuk membuka Bursa Karir & Forum Alumni Eksklusif.</td>
        </tr>
        <tr>
          <td valign="top">🤝</td>
          <td><strong>Kemitraan Industri:</strong> Ajukan kolaborasi rekrutmen talenta atau riset industri melalui halaman Kemitraan.</td>
        </tr>
      </table>
    </div>

    ${!data.verificationUrl ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="${ctaUrl}" class="btn-cta">
        ${ctaLabel}
      </a>
    </div>` : `
    <p style="margin: 16px 0 0; font-size: 11px; color: #94a3b8; text-align: center; word-break: break-all;">
      Jika tombol di atas tidak berfungsi, salin tautan berikut ke peramban Anda:<br/>
      <a href="${ctaUrl}" style="color: #2563eb;">${ctaUrl}</a>
    </p>`}
  `;

  return wrapBaseTemplate('Selamat Datang di Portal Solo Technopark', body);
}

/**
 * 6. Template Instruksi Atur Ulang Kata Sandi (Forgot Password)
 */
export function renderPasswordResetEmail(data: {
  userName: string;
  email: string;
  resetUrl: string;
}): string {
  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #fef3c7; color: #b45309; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #fde68a;">
        Keamanan Akun
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Atur Ulang Kata Sandi Anda
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Halo <strong>${data.userName}</strong>, kami menerima permintaan pengaturan ulang kata sandi untuk akun <strong>${data.email}</strong>.
      </p>
    </div>

    <div class="card-detail" style="text-align: center;">
      <p style="margin: 0 0 14px; font-size: 13px; color: #334155; line-height: 1.6;">
        Klik tombol di bawah ini untuk membuat kata sandi baru. Tautan keamanan ini hanya berlaku dalam waktu terbatas demi melindungi akun Anda.
      </p>
      <a href="${data.resetUrl}" class="btn-cta" style="background: #0f172a;">
        Buat Kata Sandi Baru
      </a>
    </div>

    <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
      Apabila Anda tidak merasa melakukan permintaan ini, abaikan saja email ini. Kata sandi akun Anda tidak akan berubah.
    </p>
  `;

  return wrapBaseTemplate('Atur Ulang Kata Sandi - Solo Technopark', body);
}

/**
 * 7. Template Konfirmasi Klaim Status Alumni Terverifikasi (STP / RSKB Surakarta)
 */
export function renderAlumniClaimedEmail(data: {
  userName: string;
  programTaken: string;
  originLabel: string;
  registrationCode: string;
}): string {
  const baseOrigin = getBaseOrigin();

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0;">
        Status Alumni Terverifikasi
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Selamat! Akses Eksklusif Alumni Anda Telah Aktif
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Halo <strong>${data.userName}</strong>, akun Anda kini resmi terhubung dengan basis data talenta terverifikasi Solo Technopark.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="38%" style="color: #64748b; font-weight: 600;">Jalur Kelulusan</td>
          <td style="font-weight: 800; color: #047857;">${data.originLabel}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Program / Kejuruan</td>
          <td style="font-weight: 700; color: #0f172a;">${data.programTaken || 'Program Pelatihan Vokasi'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Kode Registrasi</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${data.registrationCode}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${baseOrigin}/alumni-portal" class="btn-cta" style="background: #059669; margin-right: 6px;">
        Buka Forum Eksklusif Alumni
      </a>
      <a href="${baseOrigin}/karir" class="btn-cta" style="background: #0f172a;">
        Eksplorasi Bursa Karir
      </a>
      <p style="margin: 14px 0 0; font-size: 12px; color: #64748b;">
        Lengkapi juga CV & portofolio Anda di menu <strong>Profil Saya → Profil Alumni</strong> agar mudah direkrut oleh Mitra Industri Resmi.
      </p>
    </div>
  `;

  return wrapBaseTemplate('Aktivasi Status Alumni Terverifikasi - Solo Technopark', body);
}

/**
 * 8. Template Aktivasi Akun Mitra Industri Resmi (/mitra/dashboard)
 */
export function renderPartnerOnboardedEmail(data: {
  picName: string;
  companyName: string;
  tierLabel: string;
  picEmail: string;
  tempPassword?: string | null;
  isNewAccount: boolean;
}): string {
  const baseOrigin = getBaseOrigin();

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #ecfdf5; color: #0f766e; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #99f6e4;">
        Kemitraan Industri Disetujui
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Akun Portal Mitra Resmi Telah Aktif
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Yth. <strong>${data.picName}</strong> (${data.companyName}), pengajuan kemitraan instansi Anda telah diverifikasi oleh Manajemen Solo Technopark.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="38%" style="color: #64748b; font-weight: 600;">Nama Instansi / Mitra</td>
          <td style="font-weight: 800; color: #0f172a;">${data.companyName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Kategori Kemitraan</td>
          <td style="font-weight: 700; color: #0f766e;">${data.tierLabel}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Email Login PIC</td>
          <td style="font-weight: 700; color: #0f172a;">${data.picEmail}</td>
        </tr>
        ${data.isNewAccount && data.tempPassword ? `
        <tr>
          <td style="color: #64748b; font-weight: 600;">Kata Sandi Sementara</td>
          <td>
            <span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: 900; font-size: 14px;">
              ${data.tempPassword}
            </span>
          </td>
        </tr>` : `
        <tr>
          <td style="color: #64748b; font-weight: 600;">Metode Masuk</td>
          <td style="font-weight: 600; color: #334155;">Gunakan kata sandi akun Anda saat ini atau tombol Login Google (${data.picEmail}).</td>
        </tr>`}
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${baseOrigin}/login" class="btn-cta" style="background: #0f766e;">
        Masuk ke Dashboard Mitra Industri
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
        Melalui Dashboard Mitra, Anda dapat mempublikasikan lowongan prioritas, menelusuri direktori talenta STP & RSKB, serta berdiskusi di Zona Kolaborasi Industri.
      </p>
    </div>
  `;

  return wrapBaseTemplate(`Aktivasi Akun Mitra Resmi ${data.companyName} - Solo Technopark`, body);
}

/**
 * 9. Template Pemberitahuan Pembaruan Hak Akses / Role Pengguna (Admin / Staf / Tenant)
 */
export function renderRolePromotedEmail(data: {
  userName: string;
  email: string;
  newRoleLabel: string;
  dashboardPath?: string;
}): string {
  const baseOrigin = getBaseOrigin();
  const targetUrl = `${baseOrigin}${data.dashboardPath || '/dashboard'}`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: #eef2ff; color: #4338ca; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #c7d2fe;">
        Pembaruan Otorisasi Akun
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a;">
        Hak Akses Akun Anda Telah Diperbarui
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
        Halo <strong>${data.userName}</strong>, Administrator Sistem Solo Technopark telah memperbarui peran akses akun Anda.
      </p>
    </div>

    <div class="card-detail">
      <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px;">
        <tr>
          <td width="38%" style="color: #64748b; font-weight: 600;">Email Akun</td>
          <td style="font-weight: 700; color: #0f172a;">${data.email}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Peran / Otorisasi Baru</td>
          <td style="font-weight: 900; color: #4338ca;">${data.newRoleLabel}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${targetUrl}" class="btn-cta">
        Buka Ruang Kerja Saya
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
        Jika Anda sedang login di peramban, silakan muat ulang halaman untuk menerapkan hak akses terbaru.
      </p>
    </div>
  `;

  return wrapBaseTemplate(`Pembaruan Hak Akses: ${data.newRoleLabel} - Solo Technopark`, body);
}
