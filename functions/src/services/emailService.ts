// Lokasi file: functions/src/services/emailService.ts
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export interface SmtpDiagnostics {
  configured: boolean;
  verified: boolean;
  host: string;
  port: number;
  user: string;
  fromAddress: string;
  error?: string;
}

/**
 * Service pengirim email resmi Solo Technopark (Hostinger SMTP SSL/TLS).
 * Menggunakan lazy initialization agar proses Cloud Functions discovery tetap cepat
 * dan variabel environment runtime dari functions/.env selalu terbaca akurat.
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private initialized: boolean = false;

  private ensureTransporter(): void {
    if (this.initialized && this.transporter) {
      return;
    }

    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
    const pass = process.env.SMTP_PASS || '';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = port === 465;

    this.initialized = true;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        this.isConfigured = true;
        console.log(`[EmailService] Transporter SMTP siap (${host}:${port}, secure=${secure}) sebagai ${user}`);
      } catch (err) {
        console.error('[EmailService] Gagal menginisialisasi SMTP transporter:', err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      console.log('[EmailService] Kredensial SMTP belum lengkap. Berjalan dalam mode SIMULASI.');
      this.transporter = null;
      this.isConfigured = false;
    }
  }

  /**
   * Memeriksa kesehatan koneksi autentikasi ke server SMTP (untuk panel Admin).
   */
  async verifyConnection(): Promise<SmtpDiagnostics> {
    this.initialized = false; // Paksa evaluasi ulang env terbaru saat diagnostik
    this.ensureTransporter();

    const host = (process.env.SMTP_HOST || 'smtp.hostinger.com').trim();
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = (process.env.SMTP_USER || '').trim();
    const fromAddress = (process.env.SMTP_FROM || user || 'marketing@solotechnopark.id').trim();

    if (!this.isConfigured || !this.transporter) {
      return {
        configured: false,
        verified: false,
        host,
        port,
        user,
        fromAddress,
        error: 'Variabel environment SMTP_HOST / SMTP_USER / SMTP_PASS belum terkonfigurasi.',
      };
    }

    try {
      await (this.transporter as any).verify();
      return {
        configured: true,
        verified: true,
        host,
        port,
        user,
        fromAddress,
      };
    } catch (err: any) {
      return {
        configured: true,
        verified: false,
        host,
        port,
        user,
        fromAddress,
        error: err?.message || 'Verifikasi koneksi SMTP gagal.',
      };
    }
  }

  /**
   * Mengirim email dengan header From resmi Solo Technopark dan Reply-To resmi.
   */
  async sendEmail(opts: SendMailOptions): Promise<SendMailResult> {
    this.ensureTransporter();

    const fromAddress = (process.env.SMTP_FROM || process.env.SMTP_USER || 'marketing@solotechnopark.id').trim();
    const fromName = opts.fromName || 'Solo Technopark';
    const replyTo = (opts.replyTo || process.env.SMTP_REPLY_TO || fromAddress).trim();

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: opts.to,
      replyTo: replyTo,
      subject: opts.subject,
      html: opts.html,
    };

    // JIKA SMTP SUDAH DIKONFIGURASI
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email berhasil terkirim ke ${opts.to}. MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          simulated: false,
        };
      } catch (error: any) {
        console.error(`[EmailService] Gagal mengirim email ke ${opts.to}:`, error);
        return {
          success: false,
          error: error.message || 'SMTP send failure',
        };
      }
    }

    // JIKA DALAM MASA TUNGGU SMTP (SIMULASI / MOCK)
    console.log(`==================== [SIMULASI EMAIL NO-REPLY] ====================`);
    console.log(`KEPADA     : ${opts.to}`);
    console.log(`DARI       : "${fromName}" <${fromAddress}>`);
    console.log(`REPLY-TO   : ${replyTo}`);
    console.log(`SUBJEK     : ${opts.subject}`);
    console.log(`STATUS     : Berhasil disimulasikan (Menunggu kredensial SMTP)`);
    console.log(`===================================================================`);

    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      simulated: true,
    };
  }
}

export const emailService = new EmailService();
