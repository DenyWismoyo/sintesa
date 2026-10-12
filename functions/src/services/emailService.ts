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

/**
 * Service pengirim email Solo Technopark.
 * Menggunakan Nodemailer dengan fallback Dev/Mock jika SMTP belum dikonfigurasi.
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = port === 465;

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
        console.log(`[EmailService] Transporter SMTP terinisialisasi untuk host: ${host}`);
      } catch (err) {
        console.error('[EmailService] Gagal menginisialisasi SMTP transporter:', err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      console.log('[EmailService] SMTP credentials belum diset. Berjalan dalam mode SIMULASI (Dev/Staging).');
      this.isConfigured = false;
    }
  }

  /**
   * Mengirim email dengan header From resmi dan Reply-To ke helpdesk.
   */
  async sendEmail(opts: SendMailOptions): Promise<SendMailResult> {
    const fromAddress = process.env.SMTP_FROM || 'noreply@solotechnopark.id';
    const fromName = opts.fromName || 'Solo Technopark';
    const replyTo = opts.replyTo || process.env.SMTP_REPLY_TO || 'info@solotechnopark.id';

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
