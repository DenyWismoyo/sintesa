import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { POST as ocrPost } from '@/app/api/ai/ocr-receipt/route';

describe('Security & Penetration Test Hardening Suite (VULN-01 to VULN-05)', () => {
  describe('VULN-02: Edge Proxy Cookie Role Spoofing Shield', () => {
    it('harus memblokir penyerang yang memalsukan cookie userRole mentah tanpa __session JWT valid', () => {
      const req = new NextRequest(new URL('http://localhost:3000/dashboard', 'http://localhost:3000'), {
        headers: {
          cookie: 'userRole=super_admin; path=/',
        },
      });

      const res = proxy(req);
      expect(res.status).toBe(307);
      const redirectLocation = res.headers.get('location');
      expect(redirectLocation).toContain('/login?redirect=%2Fdashboard');
    });

    it('harus memblokir jika token __session kedaluwarsa atau cacat meskipun userRole disetel admin', () => {
      const expiredPayload = btoa(JSON.stringify({ role: 'super_admin', exp: Math.floor(Date.now() / 1000) - 100 }));
      const forgedToken = `header.${expiredPayload}.sig`;

      const req = new NextRequest(new URL('http://localhost:3000/billing', 'http://localhost:3000'), {
        headers: {
          cookie: `__session=${forgedToken}; userRole=super_admin; path=/`,
        },
      });

      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login?redirect=%2Fbilling');
    });
  });

  describe('VULN-05: AI OCR Vision SSRF & Ingestion Guard', () => {
    it('harus menolak request dengan URL eksternal berbahaya atau arbitrary domain (SSRF protection)', async () => {
      const maliciousReq = new NextRequest(new URL('http://localhost:3000/api/ai/ocr-receipt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: 'http://169.254.169.254/computeMetadata/v1/',
        }),
      });

      const res = await ocrPost(maliciousReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Format permintaan tidak valid');
    });

    it('harus menolak request dengan URL http sembarang bukan Firebase Storage', async () => {
      const untrustedReq = new NextRequest(new URL('http://localhost:3000/api/ai/ocr-receipt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: 'https://attacker-controlled-site.com/exploit.jpg',
        }),
      });

      const res = await ocrPost(untrustedReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('harus menerima format Base64 Data URI gambar yang valid dalam validasi skema', async () => {
      // Data URI valid 1x1 png pixel
      const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const safeReq = new NextRequest(new URL('http://localhost:3000/api/ai/ocr-receipt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: validBase64,
        }),
      });

      // Response status will be 200 or 500/ai error depending on Clario mock, but NOT 400 validation error
      const res = await ocrPost(safeReq);
      expect(res.status).not.toBe(400);
    });
  });
});
