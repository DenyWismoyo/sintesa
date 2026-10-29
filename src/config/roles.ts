// Lokasi file: src/config/roles.ts

export const APP_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  
  ADMIN_KEUANGAN: 'admin_keuangan',
  KASIR: 'kasir', 
  KASIR_PENGELUARAN: 'kasir_pengeluaran', 
  
  ADMIN_ASET: 'admin_aset',
  OPERATOR_ASET: 'operator_aset',
  
  ADMIN_TENANT: 'admin_tenant',
  OPERATOR_TENANT: 'operator_tenant',
  
  ADMIN_PELATIHAN: 'admin_pelatihan',
  OPERATOR_PELATIHAN: 'operator_pelatihan',

  // --- ROLE BARU JASA PRODUKSI & MANUFAKTUR STP ---
  ADMIN_PRODUKSI: 'admin_produksi',
  OPERATOR_PRODUKSI: 'operator_produksi',
  
  PUBLIC: 'public',
  TENANT: 'tenant',
  ALUMNI: 'alumni', 
  PEGAWAI: 'pegawai',

  // --- ROLE BARU UNTUK SMART HUB ---
  INVESTOR: 'investor',
  KAMPUS: 'kampus',
  INDUSTRI: 'industri',
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

export const ROLE_LABELS: Record<string, string> = {
  [APP_ROLES.SUPER_ADMIN]: 'Super Administrator',
  [APP_ROLES.ADMIN]: 'Administrator', 
  [APP_ROLES.ADMIN_KEUANGAN]: 'Admin Keuangan & Billing',
  [APP_ROLES.KASIR]: 'Kasir Pendapatan (POS)',
  [APP_ROLES.KASIR_PENGELUARAN]: 'Kasir Pengeluaran (AP)', 
  [APP_ROLES.ADMIN_ASET]: 'Admin Aset & Booking',
  [APP_ROLES.OPERATOR_ASET]: 'Operator Aset',
  [APP_ROLES.ADMIN_TENANT]: 'Admin Ekosistem Tenant',
  [APP_ROLES.OPERATOR_TENANT]: 'Operator Tenant',
  [APP_ROLES.ADMIN_PELATIHAN]: 'Admin Pelatihan (LMS)',
  [APP_ROLES.OPERATOR_PELATIHAN]: 'Operator Pelatihan',
  [APP_ROLES.ADMIN_PRODUKSI]: 'Admin Layanan Jasa Produksi',
  [APP_ROLES.OPERATOR_PRODUKSI]: 'Operator Bengkel & Produksi',
  [APP_ROLES.PEGAWAI]: 'Pegawai Solo Technopark',
  [APP_ROLES.PUBLIC]: 'Pengguna Umum / Instruktur',
  [APP_ROLES.TENANT]: 'Akun Tenant',
  [APP_ROLES.ALUMNI]: 'Alumni KST',
  [APP_ROLES.INVESTOR]: 'Mitra Investor / VC',
  [APP_ROLES.KAMPUS]: 'Mitra Perguruan Tinggi',
  [APP_ROLES.INDUSTRI]: 'Mitra Industri / Korporasi',
};

// 1. DAFTAR AKSES HALAMAN UMUM (ROUTE LEVEL)
export const ROLE_ACCESS_MAP: Record<string, string[]> = {
  [APP_ROLES.SUPER_ADMIN]: ['*'], 
  [APP_ROLES.ADMIN]: ['/dashboard', '/aset', '/booking', '/jasa-produksi', '/billing', '/katalog', '/afiliasi', '/tenant', '/manajemen-event', '/manajemen-krenova', '/pelatihan', '/lms', '/manajemen-faq', '/manajemen-artikel', '/karir', '/manajemen-karir'],
  [APP_ROLES.ADMIN_KEUANGAN]: ['/dashboard', '/billing', '/katalog', '/afiliasi', '/manajemen-faq', '/karir'], 
  [APP_ROLES.KASIR]: ['/dashboard', '/billing', '/karir'],
  [APP_ROLES.KASIR_PENGELUARAN]: ['/dashboard', '/billing', '/karir'],
  [APP_ROLES.ADMIN_ASET]: ['/dashboard', '/aset', '/booking', '/manajemen-faq', '/karir'],
  [APP_ROLES.OPERATOR_ASET]: ['/dashboard', '/aset', '/booking', '/karir'],
  [APP_ROLES.ADMIN_PRODUKSI]: ['/dashboard', '/jasa-produksi', '/billing', '/karir'],
  [APP_ROLES.OPERATOR_PRODUKSI]: ['/dashboard', '/jasa-produksi', '/karir'],
  [APP_ROLES.PEGAWAI]: ['/presensi', '/karir'],
  [APP_ROLES.ADMIN_TENANT]: ['/dashboard', '/tenant', '/manajemen-event', '/manajemen-krenova', '/manajemen-faq', '/manajemen-artikel', '/karir'],
  [APP_ROLES.OPERATOR_TENANT]: ['/dashboard', '/tenant', '/manajemen-event', '/karir'],
  [APP_ROLES.ADMIN_PELATIHAN]: ['/dashboard', '/pelatihan', '/lms', '/manajemen-faq', '/manajemen-artikel', '/karir', '/manajemen-karir'],
  [APP_ROLES.OPERATOR_PELATIHAN]: ['/dashboard', '/pelatihan', '/lms', '/karir', '/manajemen-karir'],
  [APP_ROLES.ALUMNI]: ['/lms', '/alumni-portal', '/karir'],
  [APP_ROLES.TENANT]: ['/tenant', '/lms', '/ekosistem'], // Tenant diberi akses ke ekosistem (hub)
  [APP_ROLES.INVESTOR]: ['/ekosistem', '/portfolio'],
  [APP_ROLES.KAMPUS]: ['/ekosistem', '/riset'],
  [APP_ROLES.INDUSTRI]: ['/mitra', '/ekosistem', '/kebutuhan'],
};

// 2. KAMUS HAK AKSES AKSI (PERMISSION LEVEL)
export const PERMISSIONS = {
  VIEW_ASSET: 'view_asset', CREATE_ASSET: 'create_asset', EDIT_ASSET: 'edit_asset', DELETE_ASSET: 'delete_asset', MANAGE_BOOKING: 'manage_booking', APPROVE_BOOKING: 'approve_booking', 
  VIEW_BILLING: 'view_billing', CREATE_INVOICE: 'create_invoice', DELETE_INVOICE: 'delete_invoice', CREATE_EXPENSE: 'create_expense', APPROVE_EXPENSE: 'approve_expense', MANAGE_CATALOG: 'manage_catalog', VIEW_FINANCE_REPORTS: 'view_finance_reports', MANAGE_CASH_TRANSFER: 'manage_cash_transfer', 
  VIEW_TENANT: 'view_tenant', MANAGE_TENANT: 'manage_tenant', APPROVE_TENANT: 'approve_tenant', VIEW_EVENT: 'view_event', MANAGE_EVENT: 'manage_event',
  
  // PERMISSIONS JASA PRODUKSI & MANUFAKTUR STP
  MANAGE_PRODUCTION: 'manage_production',
  CREATE_PRODUCTION_ORDER: 'create_production_order',
  APPROVE_PRODUCTION: 'approve_production',
  GENERATE_DELIVERY_ORDER: 'generate_delivery_order',

  MANAGE_LMS: 'manage_lms',       
  MANAGE_ALUMNI: 'manage_alumni', 
  MANAGE_TALENT: 'manage_talent', 
  MANAGE_KRENOVA: 'manage_krenova',

  ACCESS_CAREER: 'access_career',
  MANAGE_CAREER: 'manage_career',
  MANAGE_PARTNERSHIP: 'manage_partnership',
  SUBMIT_PARTNER_JOB: 'submit_partner_job',
  MODERATE_FORUM: 'moderate_forum',

  MANAGE_FAQ: 'manage_faq',
  MANAGE_ARTICLE: 'manage_article',
  MANAGE_AFFILIATE: 'manage_affiliate',
  VIEW_SETTINGS_MENU: 'view_settings_menu', EDIT_INSTITUTION_PROFILE: 'edit_institution_profile', MANAGE_FINANCE_BAS: 'manage_finance_bas', MANAGE_ROLES_USERS: 'manage_roles_users', 
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// 3. PEMETAAN PERMISSIONS KE ROLE
const ACTION_PERMISSIONS: Record<string, Permission[]> = {
  [APP_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), 
  [APP_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_ASSET, PERMISSIONS.CREATE_ASSET, PERMISSIONS.EDIT_ASSET, PERMISSIONS.DELETE_ASSET, PERMISSIONS.MANAGE_BOOKING, PERMISSIONS.APPROVE_BOOKING, 
    PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_INVOICE, PERMISSIONS.DELETE_INVOICE, PERMISSIONS.CREATE_EXPENSE, PERMISSIONS.APPROVE_EXPENSE, PERMISSIONS.MANAGE_CATALOG, PERMISSIONS.VIEW_FINANCE_REPORTS, PERMISSIONS.MANAGE_CASH_TRANSFER, 
    PERMISSIONS.VIEW_TENANT, PERMISSIONS.MANAGE_TENANT, PERMISSIONS.APPROVE_TENANT, PERMISSIONS.VIEW_EVENT, PERMISSIONS.MANAGE_EVENT, 
    PERMISSIONS.MANAGE_PRODUCTION, PERMISSIONS.CREATE_PRODUCTION_ORDER, PERMISSIONS.APPROVE_PRODUCTION, PERMISSIONS.GENERATE_DELIVERY_ORDER,
    PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT, PERMISSIONS.MANAGE_KRENOVA,
    PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_CAREER, PERMISSIONS.MANAGE_PARTNERSHIP, PERMISSIONS.MODERATE_FORUM,
    PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE, PERMISSIONS.MANAGE_AFFILIATE
  ],
  [APP_ROLES.ADMIN_ASET]: [PERMISSIONS.VIEW_ASSET, PERMISSIONS.CREATE_ASSET, PERMISSIONS.EDIT_ASSET, PERMISSIONS.DELETE_ASSET, PERMISSIONS.MANAGE_BOOKING, PERMISSIONS.APPROVE_BOOKING, PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_PARTNERSHIP, PERMISSIONS.MANAGE_FAQ],
  [APP_ROLES.OPERATOR_ASET]: [PERMISSIONS.VIEW_ASSET, PERMISSIONS.CREATE_ASSET, PERMISSIONS.EDIT_ASSET, PERMISSIONS.MANAGE_BOOKING, PERMISSIONS.ACCESS_CAREER],
  [APP_ROLES.ADMIN_PRODUKSI]: [
    PERMISSIONS.MANAGE_PRODUCTION, 
    PERMISSIONS.CREATE_PRODUCTION_ORDER, 
    PERMISSIONS.APPROVE_PRODUCTION, 
    PERMISSIONS.GENERATE_DELIVERY_ORDER, 
    PERMISSIONS.VIEW_BILLING, 
    PERMISSIONS.CREATE_INVOICE, 
    PERMISSIONS.ACCESS_CAREER
  ],
  [APP_ROLES.OPERATOR_PRODUKSI]: [
    PERMISSIONS.MANAGE_PRODUCTION, 
    PERMISSIONS.ACCESS_CAREER
  ],
  [APP_ROLES.ADMIN_KEUANGAN]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_INVOICE, PERMISSIONS.DELETE_INVOICE, PERMISSIONS.CREATE_EXPENSE, PERMISSIONS.APPROVE_EXPENSE, PERMISSIONS.MANAGE_CATALOG, PERMISSIONS.VIEW_FINANCE_REPORTS, PERMISSIONS.MANAGE_CASH_TRANSFER, PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_AFFILIATE],
  [APP_ROLES.KASIR]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_INVOICE, PERMISSIONS.ACCESS_CAREER],
  [APP_ROLES.KASIR_PENGELUARAN]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_EXPENSE, PERMISSIONS.ACCESS_CAREER],
  [APP_ROLES.ADMIN_TENANT]: [PERMISSIONS.VIEW_TENANT, PERMISSIONS.MANAGE_TENANT, PERMISSIONS.APPROVE_TENANT, PERMISSIONS.VIEW_EVENT, PERMISSIONS.MANAGE_EVENT, PERMISSIONS.MANAGE_KRENOVA, PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_PARTNERSHIP, PERMISSIONS.MODERATE_FORUM, PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE],
  [APP_ROLES.OPERATOR_TENANT]: [PERMISSIONS.VIEW_TENANT, PERMISSIONS.MANAGE_TENANT, PERMISSIONS.VIEW_EVENT, PERMISSIONS.MANAGE_EVENT, PERMISSIONS.ACCESS_CAREER],
  [APP_ROLES.ADMIN_PELATIHAN]: [PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT, PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_CAREER, PERMISSIONS.MANAGE_PARTNERSHIP, PERMISSIONS.MODERATE_FORUM, PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE],
  [APP_ROLES.OPERATOR_PELATIHAN]: [PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT, PERMISSIONS.ACCESS_CAREER, PERMISSIONS.MANAGE_CAREER, PERMISSIONS.MODERATE_FORUM],
  [APP_ROLES.ALUMNI]: [PERMISSIONS.ACCESS_CAREER],
  [APP_ROLES.INDUSTRI]: [PERMISSIONS.SUBMIT_PARTNER_JOB],
  [APP_ROLES.TENANT]: [PERMISSIONS.SUBMIT_PARTNER_JOB],
};

/**
 * Cek apakah user berhak mengakses fitur eksklusif Bursa Karir
 * Khusus untuk Alumni Solo Technopark & seluruh Staff Internal / Admin
 */
export const canAccessCareer = (role: string | null): boolean => {
  if (!role) return false;
  return role === APP_ROLES.ALUMNI || isInternalStaff(role);
};

export const canAccessAlumniForum = (role: string | null): boolean => {
  if (!role) return false;
  return (
    role === APP_ROLES.ALUMNI ||
    role === APP_ROLES.INDUSTRI ||
    role === APP_ROLES.TENANT ||
    isInternalStaff(role)
  );
};

export const canAccessForumZoneA = (role: string | null): boolean => {
  if (!role) return false;
  return role === APP_ROLES.ALUMNI || isInternalStaff(role);
};

// 4. FUNGSI CEK ROUTE (MENGATASI AKSES TERLARANG)
export const hasAccess = (role: string | null, pathname: string): boolean => {
  if (!role) return false;
  
  // Rute Presensi Pegawai STP (Techno Sign) hanya terbuka untuk staf internal & admin BLUD Solo Technopark
  if (pathname === '/presensi' || pathname.startsWith('/presensi/')) {
    return isInternalStaff(role);
  }

  // Fitur rute bursa karir bersifat eksklusif bagi Alumni dan seluruh Administrator
  if (pathname === '/karir' || pathname.startsWith('/karir/')) {
    return canAccessCareer(role);
  }

  if (pathname === '/alumni-portal' || pathname.startsWith('/alumni-portal/')) {
    return canAccessAlumniForum(role);
  }

  // Lanjut pengecekan role lainnya
  if (false) {
    return canAccessCareer(role);
  }

  if (role === APP_ROLES.PUBLIC) {
    if (pathname.startsWith('/lms')) return true;
    if (pathname.startsWith('/pelatihan/builder')) return true;
    if (pathname.includes('/peserta')) return true;
    return false;
  }

  if (role === APP_ROLES.TENANT) {
    // Tenant biasa hanya boleh ke portal tenant (/tenant/...) bukan root admin (/tenant)
    if (pathname === '/tenant') return false;
    return pathname.startsWith('/tenant/') || pathname.startsWith('/lms') || pathname.startsWith('/ekosistem'); 
  }
  if (role === APP_ROLES.ALUMNI) return pathname.startsWith('/lms') || pathname.startsWith('/alumni-portal') || pathname.startsWith('/karir'); 
  if (role === APP_ROLES.INVESTOR) return pathname.startsWith('/ekosistem') || pathname.startsWith('/portfolio');
  if (role === APP_ROLES.KAMPUS) return pathname.startsWith('/ekosistem') || pathname.startsWith('/riset');
  if (role === APP_ROLES.INDUSTRI) return pathname === '/mitra' || pathname.startsWith('/mitra/') || pathname.startsWith('/ekosistem') || pathname.startsWith('/kebutuhan');
  
  const allowedPaths = ROLE_ACCESS_MAP[role];
  if (!allowedPaths) return false;
  if (allowedPaths.includes('*')) return true;
  return allowedPaths.some(allowedPath => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`));
};

export const canPerformAction = (role: string | null, action: Permission): boolean => {
  if (!role) return false;
  if (role === APP_ROLES.SUPER_ADMIN) return true;
  return ACTION_PERMISSIONS[role]?.includes(action) || false;
};

export const isInternalStaff = (role: string | null): boolean => {
  if (!role) return false;
  return Object.values(APP_ROLES).includes(role as AppRole) && role !== APP_ROLES.PUBLIC && role !== APP_ROLES.TENANT && role !== APP_ROLES.ALUMNI && role !== APP_ROLES.INVESTOR && role !== APP_ROLES.KAMPUS && role !== APP_ROLES.INDUSTRI;
};