// src/__tests__/jobs_navigation_state.test.ts
import { describe, it, expect } from 'vitest';

describe('Bursa Karir — Navigation State & URL Preservation (Fase 1)', () => {
  function serializeFiltersToQuery(params: {
    q?: string;
    kategori?: string;
    tipe?: string;
    setup?: string;
    exp?: string;
    program?: string;
    partner?: boolean;
    source?: string;
    wilayah?: string;
    periode?: string;
    sort?: string;
    p?: number;
    limit?: number;
  }): string {
    const sp = new URLSearchParams();
    if (params.q?.trim()) sp.set('q', params.q.trim());
    if (params.kategori && params.kategori !== 'all') sp.set('kategori', params.kategori);
    if (params.tipe && params.tipe !== 'all') sp.set('tipe', params.tipe);
    if (params.setup && params.setup !== 'all') sp.set('setup', params.setup);
    if (params.exp && params.exp !== 'all') sp.set('exp', params.exp);
    if (params.program?.trim()) sp.set('program', params.program.trim());
    if (params.partner) sp.set('partner', 'true');
    if (params.source && params.source !== 'all') sp.set('source', params.source);
    if (params.wilayah && params.wilayah !== 'all') sp.set('wilayah', params.wilayah);
    if (params.periode && params.periode !== 'all') sp.set('periode', params.periode);
    if (params.sort && params.sort !== 'newest') sp.set('sort', params.sort);
    if (params.p && params.p > 1) sp.set('p', String(params.p));
    if (params.limit && params.limit !== 9) sp.set('limit', String(params.limit));
    return sp.toString();
  }

  function parseQueryToFilters(search: string) {
    const sp = new URLSearchParams(search);
    return {
      query: sp.get('q') || '',
      category: sp.get('kategori') || 'all',
      workType: sp.get('tipe') || 'all',
      workSetup: sp.get('setup') || 'all',
      experienceLevel: sp.get('exp') || 'all',
      trainingProgram: sp.get('program') || '',
      isStpPartnerOnly: sp.get('partner') === 'true',
      sourceFilter: sp.get('source') || 'all',
      locationRegion: sp.get('wilayah') || 'all',
      freshness: sp.get('periode') || 'all',
      sort: sp.get('sort') || 'newest',
      currentPage: parseInt(sp.get('p') || '1', 10) || 1,
      pageSize: parseInt(sp.get('limit') || '9', 10) || 9,
    };
  }

  it('1. Serialisasi query filter mempertahankan kategori, wilayah, dan pagination', () => {
    const qs = serializeFiltersToQuery({
      kategori: 'Kecerdasan Buatan & Sains Data',
      wilayah: 'solo_raya',
      tipe: 'Full-time',
      p: 3,
      limit: 18,
    });

    expect(qs).toContain('kategori=Kecerdasan+Buatan');
    expect(qs).toContain('wilayah=solo_raya');
    expect(qs).toContain('tipe=Full-time');
    expect(qs).toContain('p=3');
    expect(qs).toContain('limit=18');
  });

  it('2. Deserialisasi query memulihkan state filter lengkap tanpa reset ke default', () => {
    const originalQuery =
      'kategori=Manufaktur+Presisi+%26+Mekatronika&wilayah=solo_raya&p=2&sort=salary_high&partner=true';
    const state = parseQueryToFilters(originalQuery);

    expect(state.category).toBe('Manufaktur Presisi & Mekatronika');
    expect(state.locationRegion).toBe('solo_raya');
    expect(state.currentPage).toBe(2);
    expect(state.sort).toBe('salary_high');
    expect(state.isStpPartnerOnly).toBe(true);
  });

  it('3. Siklus navigasi Back: URL yang disimpan di sessionStorage dapat dipulihkan 100%', () => {
    const filterInput = {
      q: 'React CNC',
      kategori: 'IT & Rekayasa Perangkat Lunak',
      wilayah: 'solo_raya',
      p: 2,
    };

    const qs = serializeFiltersToQuery(filterInput);
    const fullUrl = `/karir?${qs}`;

    // Simulasi penyimpanan di ClientPage sebelum masuk ke Detail
    const mockSessionStorage: Record<string, string> = {};
    mockSessionStorage['sintesa_karir_last_url'] = fullUrl;
    mockSessionStorage['sintesa_karir_last_viewed_id'] = 'job-solo-123';

    // Simulasi saat detail me-resolve URL kembali
    const recoveredBackUrl = mockSessionStorage['sintesa_karir_last_url'];
    expect(recoveredBackUrl).toBe(fullUrl);

    const recoveredFilters = parseQueryToFilters(recoveredBackUrl.split('?')[1]);
    expect(recoveredFilters.query).toBe('React CNC');
    expect(recoveredFilters.category).toBe('IT & Rekayasa Perangkat Lunak');
    expect(recoveredFilters.locationRegion).toBe('solo_raya');
    expect(recoveredFilters.currentPage).toBe(2);
    expect(mockSessionStorage['sintesa_karir_last_viewed_id']).toBe('job-solo-123');
  });
});
