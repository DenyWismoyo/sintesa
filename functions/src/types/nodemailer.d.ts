declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
    [key: string]: any;
  }

  export function createTransport(options: TransportOptions): Transporter;
}
