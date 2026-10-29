import { describe, it, expect } from 'vitest';
import {
  hasAccess,
  canPerformAction,
  canAccessAlumniForum,
  canAccessForumZoneA,
  PERMISSIONS,
  APP_ROLES,
} from '@/config/roles';
import { AlumniSchema, ALUMNI_ORIGIN_LABELS } from '@/types/ecosystem.types';
import { PartnerProfileSchema, TalentInvitationSchema } from '@/types/partnership.types';
import {
  DEFAULT_FORUM_CHANNELS,
  ForumThreadSchema,
  ForumReplySchema,
  JobApplicationSchema,
  EcosystemNotificationSchema,
} from '@/types/alumniForum.types';
import { filterAndSortJobs } from '@/services/job.service';
import { JobListing } from '@/types/job.types';

describe('Sprint 1 & Sprint 2 — Alumni RSKB, Partner Portal (/mitra) & Startup Talent Bridge', () => {
  describe('RBAC Matrix for Official Partner & Tenant Talent Bridge', () => {
    it('allows industri role to access /mitra/dashboard and submit partner job drafts', () => {
      expect(hasAccess(APP_ROLES.INDUSTRI, '/mitra')).toBe(true);
      expect(hasAccess(APP_ROLES.INDUSTRI, '/mitra/dashboard')).toBe(true);
      expect(canPerformAction(APP_ROLES.INDUSTRI, PERMISSIONS.SUBMIT_PARTNER_JOB)).toBe(true);
      expect(canPerformAction(APP_ROLES.INDUSTRI, PERMISSIONS.MANAGE_CAREER)).toBe(false);
    });

    it('allows tenant role to access /tenant/talent and submit startup job/internship drafts', () => {
      expect(hasAccess(APP_ROLES.TENANT, '/tenant/talent')).toBe(true);
      expect(hasAccess(APP_ROLES.TENANT, '/mitra/dashboard')).toBe(false);
      expect(canPerformAction(APP_ROLES.TENANT, PERMISSIONS.SUBMIT_PARTNER_JOB)).toBe(true);
    });

    it('restricts partnership onboarding management to authorized admins', () => {
      expect(canPerformAction(APP_ROLES.ADMIN, PERMISSIONS.MANAGE_PARTNERSHIP)).toBe(true);
      expect(canPerformAction(APP_ROLES.ADMIN_PELATIHAN, PERMISSIONS.MANAGE_PARTNERSHIP)).toBe(true);
      expect(canPerformAction(APP_ROLES.ADMIN_TENANT, PERMISSIONS.MANAGE_PARTNERSHIP)).toBe(true);
      expect(canPerformAction(APP_ROLES.PUBLIC, PERMISSIONS.MANAGE_PARTNERSHIP)).toBe(false);
      expect(canPerformAction(APP_ROLES.ALUMNI, PERMISSIONS.MANAGE_PARTNERSHIP)).toBe(false);
    });
  });

  describe('RSKB Kota Surakarta & Multi-Origin Alumni Schema', () => {
    it('validates RSKB_SURAKARTA alumni record with district and institution metadata', () => {
      const parsed = AlumniSchema.safeParse({
        name: 'Budi Santoso',
        email: 'budi.rskb@gmail.com',
        originSource: 'RSKB_SURAKARTA',
        originInstitution: 'Disnaker Kota Surakarta',
        district: 'Jebres',
        programTaken: 'Pelatihan Barista & Wirausaha Kuliner',
        registrationCode: 'RSKB-2026-AB12CD',
        status: 'CLAIMED',
        isLookingForJob: true,
        internalStatus: 'ENTREPRENEUR',
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.originSource).toBe('RSKB_SURAKARTA');
        expect(ALUMNI_ORIGIN_LABELS[parsed.data.originSource!]).toContain('RSKB');
      }
    });
  });

  describe('PartnerProfileSchema & TalentInvitationSchema Validation', () => {
    it('validates official PartnerProfile and TalentInvitation payloads', () => {
      const partnerRes = PartnerProfileSchema.safeParse({
        companyName: 'PT Manufaktur Presisi Solo',
        picName: 'Rina Wijaya',
        picEmail: 'hrd@manufaktursolo.co.id',
        picPhone: '081234567890',
        tier: 'MOU_OFFICIAL',
      });
      expect(partnerRes.success).toBe(true);

      const inviteRes = TalentInvitationSchema.safeParse({
        alumniId: 'alm-001',
        alumniName: 'Siti Rahma',
        senderType: 'PARTNER',
        senderEntityId: 'prt-001',
        senderCompanyName: 'PT Manufaktur Presisi Solo',
        senderPicName: 'Rina Wijaya',
        senderPicContact: 'hrd@manufaktursolo.co.id',
        senderUid: 'uid-pic-001',
        roleOffered: 'Junior CNC Programmer',
        workType: 'Full-time',
        message: 'Kami mengundang Anda untuk wawancara teknis hari Kamis pukul 10.00 WIB.',
      });
      expect(inviteRes.success).toBe(true);
    });
  });

  describe('Partner & Tenant Job Curation Filtering', () => {
    const sampleJobs: JobListing[] = [
      {
        id: 'job-approved',
        title: 'Frontend Engineer',
        company: 'Mitra Resmi A',
        companyType: 'Mitra Industri STP',
        category: 'IT & Rekayasa Perangkat Lunak',
        location: 'Surakarta',
        city: 'Surakarta',
        workType: 'Full-time',
        workSetup: 'Hybrid',
        experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
        salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: false },
        description: 'Approved job',
        responsibilities: [],
        requirements: [],
        benefits: [],
        skills: ['React'],
        relevantTrainingPrograms: [],
        isStpPartner: true,
        isFeatured: false,
        postedAt: 1000,
        viewsCount: 0,
        applicantCount: 0,
        isActive: true,
        partnerId: 'partner-1',
        approvalStatus: 'APPROVED',
      },
      {
        id: 'job-pending',
        title: 'Intern Mobile Dev',
        company: 'Startup Tenant B',
        companyType: 'Tenant Inkubasi Startup STP',
        category: 'IT & Rekayasa Perangkat Lunak',
        location: 'Solo Technopark',
        city: 'Surakarta',
        workType: 'Internship / Magang',
        workSetup: 'On-site (Solo Technopark)',
        experienceLevel: 'Fresh Graduate / Alumni Pelatihan',
        salary: { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: false },
        description: 'Pending draft job',
        responsibilities: [],
        requirements: [],
        benefits: [],
        skills: ['Flutter'],
        relevantTrainingPrograms: [],
        isStpPartner: true,
        isFeatured: false,
        postedAt: 2000,
        viewsCount: 0,
        applicantCount: 0,
        isActive: false,
        tenantId: 'tenant-1',
        approvalStatus: 'PENDING_APPROVAL',
      },
    ];

    it('hides PENDING_APPROVAL drafts from the Alumni Career Board (/karir)', () => {
      const publicView = filterAndSortJobs(sampleJobs, {});
      expect(publicView.jobs.map((j) => j.id)).toEqual(['job-approved']);
    });

    it('exposes PENDING_APPROVAL drafts to the owning Startup Tenant and Admin Career Panel', () => {
      const tenantView = filterAndSortJobs(sampleJobs, {
        tenantId: 'tenant-1',
        includeInactive: true,
        approvalStatus: 'all',
      });
      expect(tenantView.jobs.map((j) => j.id)).toEqual(['job-pending']);

      const adminPendingQueue = filterAndSortJobs(sampleJobs, {
        includeInactive: true,
        approvalStatus: 'PENDING_APPROVAL',
      });
      expect(adminPendingQueue.jobs.map((j) => j.id)).toEqual(['job-pending']);
    });
  });
});

describe('Sprint 3, 4 & 5 — Dual-Zone Alumni Forum (/alumni-portal), Closed-Loop Apply & AI Moderation', () => {
  describe('Dual-Zone Forum Isolation (Zone A vs Zone B)', () => {
    it('grants /alumni-portal access to alumni, industri, tenant, and internal staff, while blocking public', () => {
      expect(canAccessAlumniForum(APP_ROLES.ALUMNI)).toBe(true);
      expect(canAccessAlumniForum(APP_ROLES.INDUSTRI)).toBe(true);
      expect(canAccessAlumniForum(APP_ROLES.TENANT)).toBe(true);
      expect(canAccessAlumniForum(APP_ROLES.ADMIN_PELATIHAN)).toBe(true);
      expect(hasAccess(APP_ROLES.ALUMNI, '/alumni-portal')).toBe(true);
      expect(hasAccess(APP_ROLES.INDUSTRI, '/alumni-portal')).toBe(true);

      expect(canAccessAlumniForum(APP_ROLES.PUBLIC)).toBe(false);
      expect(canAccessAlumniForum(null)).toBe(false);
      expect(hasAccess(APP_ROLES.PUBLIC, '/alumni-portal')).toBe(false);
    });

    it('strictly isolates Zone A (Alumni-Only) away from industri and tenant roles', () => {
      expect(canAccessForumZoneA(APP_ROLES.ALUMNI)).toBe(true);
      expect(canAccessForumZoneA(APP_ROLES.SUPER_ADMIN)).toBe(true);
      expect(canAccessForumZoneA(APP_ROLES.ADMIN_PELATIHAN)).toBe(true);

      // Mitra Industri & Startup Tenant HANYA boleh melihat Zona B (3 kanal)
      expect(canAccessForumZoneA(APP_ROLES.INDUSTRI)).toBe(false);
      expect(canAccessForumZoneA(APP_ROLES.TENANT)).toBe(false);

      const alumniChannels = DEFAULT_FORUM_CHANNELS.filter((c) =>
        canAccessForumZoneA(APP_ROLES.ALUMNI) ? true : c.zone === 'ZONE_B_INDUSTRY_BRIDGE'
      );
      const partnerChannels = DEFAULT_FORUM_CHANNELS.filter((c) =>
        canAccessForumZoneA(APP_ROLES.INDUSTRI) ? true : c.zone === 'ZONE_B_INDUSTRY_BRIDGE'
      );

      expect(alumniChannels).toHaveLength(7);
      expect(partnerChannels).toHaveLength(3);
      expect(partnerChannels.every((c) => c.zone === 'ZONE_B_INDUSTRY_BRIDGE')).toBe(true);
    });
  });

  describe('Rich Actionable Embeds, Closed-Loop Job Applications & Ecosystem Notifications', () => {
    it('validates ForumThread with Micro-Project Brief & AMA Event RSVP embeds', () => {
      const threadParse = ForumThreadSchema.safeParse({
        channelId: 'bursa-proyek-dan-wirausaha',
        zone: 'ZONE_B_INDUSTRY_BRIDGE',
        threadKind: 'MICRO_PROJECT',
        vocationalTrack: 'IT & Perangkat Lunak',
        title: 'Butuh 2 Alumni Frontend untuk Landing Page Produk Tenant',
        content: 'Kami dari Startup Tenant STP membuka proyek mikro 2 minggu pembuatan landing page.',
        authorUid: 'uid-tenant-1',
        authorName: 'Founder Startup A',
        authorActorType: 'TENANT_STP',
        authorBadgeLabel: 'Startup Tenant STP',
        microProjectBrief: {
          budgetRange: 'Rp 3.500.000',
          deadline: '15 November 2026',
          requiredSkills: ['Next.js', 'Tailwind CSS'],
          teamQuota: 2,
        },
        createdAt: Date.now(),
      });
      expect(threadParse.success).toBe(true);

      const replyParse = ForumReplySchema.safeParse({
        threadId: 'thr-001',
        zone: 'ZONE_B_INDUSTRY_BRIDGE',
        content: 'Solusi untuk setting G-Code 5-Axis dapat menggunakan kompensasi tool G43.',
        authorUid: 'uid-alm-1',
        authorName: 'Agus Prasetyo',
        authorActorType: 'ALUMNI_STP',
        authorBadgeLabel: 'Alumni Vokasi STP',
        isAcceptedSolution: true,
        endorsedByMentor: true,
        createdAt: Date.now(),
      });
      expect(replyParse.success).toBe(true);
    });

    it('validates Closed-Loop JobApplication & EcosystemNotification schemas', () => {
      const appParse = JobApplicationSchema.safeParse({
        jobId: 'job-001',
        jobTitle: 'Operator CNC Milling',
        companyName: 'PT Manufaktur Presisi Solo',
        partnerId: 'prt-001',
        applicantUid: 'uid-alm-01',
        alumniId: 'alm-01',
        applicantName: 'Dimas Pratama',
        applicantEmail: 'dimas@alumni.stp.id',
        originSource: 'RSKB_SURAKARTA',
        programTaken: 'Pelatihan CNC & Mekanik RSKB',
        skills: ['CNC Milling', 'CAD/CAM'],
        forumReputationScore: 45,
        aiMatchScore: 88,
        status: 'HIRED',
        createdAt: Date.now(),
      });
      expect(appParse.success).toBe(true);

      const notifParse = EcosystemNotificationSchema.safeParse({
        recipientUid: 'BROADCAST_ALUMNI',
        targetTrack: 'Manufaktur CNC & Mekanik',
        title: 'Walk-In Interview Khusus Alumni CNC',
        message: 'Hadir Kamis pukul 09.00 WIB di Gedung Utama Solo Technopark.',
        linkUrl: '/alumni-portal',
        category: 'BROADCAST_ALERT',
        createdAt: Date.now(),
      });
      expect(notifParse.success).toBe(true);
    });
  });
});

