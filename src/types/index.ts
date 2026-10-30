// Lokasi file: src/types/index.ts
// Centralized Domain Types & Schemas Re-export (Modular Domain-Driven Design)

import { formatRupiah } from '@/utils/format';
export { formatRupiah };

// 1. Asset & Facilities
export * from './asset.types';

// 2. Tenant & Startup Incubation
export * from './tenant.types';

// 3. Asset Booking & Reservations
export * from './booking.types';

// 4. Products & Catalogs
export * from './catalog.types';

// 5. Finance, Invoicing, Billing & Accounting (BLUD)
export * from './finance.types';

// 6. Training & Learning Management System (LMS)
export * from './learning.types';

// 7. Ecosystem (Events, FAQ, Alumni, Map, Krenova, Hub)
export * from './ecosystem.types';

// 8. Articles & News (Guides, Knowledge & Smart CTA)
export * from './article.types';

// 9. AI Intelligence Layer
export * from './ai';

// 10. Affiliate & Referral Marketing Program
export * from './affiliate.types';

// 11. Presensi & LKH (Techno Sign Solo Technopark)
export * from './presensi';

// 12. Career & Job Opportunities (Bursa Kerja Alumni STP)
export * from './job.types';

// 13. Strategic B2B Partnerships & Inquiries
export * from './partnership.types';

// 14. Technical Facilities & Operational Add-ons
export * from './facilityAddon.types';

// 15. Manufacturing & Production Services (Jasa Produksi STP)
export * from './production.types';

// 16. Exclusive Dual-Zone Alumni & Partner Forum + Job Application Tracker
export * from './alumniForum.types';

// 17. Facility Service Desk & Maintenance Work Order (SPK)
export * from './serviceDesk.types';

// 18. Incubation Mentoring, Virtual Deal Room & Ecosystem Subsidy
export * from './incubationMentoring.types';

// 19. Indeks Kepuasan Masyarakat (IKM PermenPAN-RB)
export * from './ikm.types';
