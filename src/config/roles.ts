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
  
  PUBLIC: 'public',
  TENANT: 'tenant',
  ALUMNI: 'alumni', 

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
  [APP_ROLES.ADMIN]: ['/dashboard', '/aset', '/booking', '/billing', '/katalog', '/tenant', '/manajemen-event', '/manajemen-krenova', '/pelatihan', '/lms', '/manajemen-faq', '/manajemen-artikel'],
  [APP_ROLES.ADMIN_KEUANGAN]: ['/dashboard', '/billing', '/katalog', '/manajemen-faq'], 
  [APP_ROLES.KASIR]: ['/dashboard', '/billing'],
  [APP_ROLES.KASIR_PENGELUARAN]: ['/dashboard', '/billing'],
  [APP_ROLES.ADMIN_ASET]: ['/dashboard', '/aset', '/booking', '/manajemen-faq'],
  [APP_ROLES.OPERATOR_ASET]: ['/dashboard', '/aset', '/booking'],
  [APP_ROLES.ADMIN_TENANT]: ['/dashboard', '/tenant', '/manajemen-event', '/manajemen-krenova', '/manajemen-faq', '/manajemen-artikel'],
  [APP_ROLES.OPERATOR_TENANT]: ['/dashboard', '/tenant', '/manajemen-event'],
  [APP_ROLES.ADMIN_PELATIHAN]: ['/dashboard', '/pelatihan', '/lms', '/manajemen-faq', '/manajemen-artikel'],
  [APP_ROLES.OPERATOR_PELATIHAN]: ['/dashboard', '/pelatihan', '/lms'],
  [APP_ROLES.ALUMNI]: ['/lms', '/alumni-portal'],
  [APP_ROLES.TENANT]: ['/tenant', '/lms', '/ekosistem'], // Tenant diberi akses ke ekosistem (hub)
  [APP_ROLES.INVESTOR]: ['/ekosistem', '/portfolio'],
  [APP_ROLES.KAMPUS]: ['/ekosistem', '/riset'],
  [APP_ROLES.INDUSTRI]: ['/ekosistem', '/kebutuhan'],
};

// 2. KAMUS HAK AKSES AKSI (PERMISSION LEVEL)
export const PERMISSIONS = {
  VIEW_ASSET: 'view_asset', CREATE_ASSET: 'create_asset', EDIT_ASSET: 'edit_asset', DELETE_ASSET: 'delete_asset', MANAGE_BOOKING: 'manage_booking', APPROVE_BOOKING: 'approve_booking', 
  VIEW_BILLING: 'view_billing', CREATE_INVOICE: 'create_invoice', DELETE_INVOICE: 'delete_invoice', CREATE_EXPENSE: 'create_expense', APPROVE_EXPENSE: 'approve_expense', MANAGE_CATALOG: 'manage_catalog', VIEW_FINANCE_REPORTS: 'view_finance_reports', MANAGE_CASH_TRANSFER: 'manage_cash_transfer', 
  VIEW_TENANT: 'view_tenant', MANAGE_TENANT: 'manage_tenant', APPROVE_TENANT: 'approve_tenant', VIEW_EVENT: 'view_event', MANAGE_EVENT: 'manage_event',
  
  MANAGE_LMS: 'manage_lms',       
  MANAGE_ALUMNI: 'manage_alumni', 
  MANAGE_TALENT: 'manage_talent', 
  MANAGE_KRENOVA: 'manage_krenova',

  MANAGE_FAQ: 'manage_faq',
  MANAGE_ARTICLE: 'manage_article',
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
    PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT, PERMISSIONS.MANAGE_KRENOVA,
    PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE
  ],
  [APP_ROLES.ADMIN_ASET]: [PERMISSIONS.VIEW_ASSET, PERMISSIONS.CREATE_ASSET, PERMISSIONS.EDIT_ASSET, PERMISSIONS.DELETE_ASSET, PERMISSIONS.MANAGE_BOOKING, PERMISSIONS.APPROVE_BOOKING, PERMISSIONS.MANAGE_FAQ],
  [APP_ROLES.OPERATOR_ASET]: [PERMISSIONS.VIEW_ASSET, PERMISSIONS.CREATE_ASSET, PERMISSIONS.EDIT_ASSET, PERMISSIONS.MANAGE_BOOKING],
  [APP_ROLES.ADMIN_KEUANGAN]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_INVOICE, PERMISSIONS.DELETE_INVOICE, PERMISSIONS.CREATE_EXPENSE, PERMISSIONS.APPROVE_EXPENSE, PERMISSIONS.MANAGE_CATALOG, PERMISSIONS.VIEW_FINANCE_REPORTS, PERMISSIONS.MANAGE_CASH_TRANSFER, PERMISSIONS.MANAGE_FAQ],
  [APP_ROLES.KASIR]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_INVOICE],
  [APP_ROLES.KASIR_PENGELUARAN]: [PERMISSIONS.VIEW_BILLING, PERMISSIONS.CREATE_EXPENSE],
  [APP_ROLES.ADMIN_TENANT]: [PERMISSIONS.VIEW_TENANT, PERMISSIONS.MANAGE_TENANT, PERMISSIONS.APPROVE_TENANT, PERMISSIONS.VIEW_EVENT, PERMISSIONS.MANAGE_EVENT, PERMISSIONS.MANAGE_KRENOVA, PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE],
  [APP_ROLES.OPERATOR_TENANT]: [PERMISSIONS.VIEW_TENANT, PERMISSIONS.MANAGE_TENANT, PERMISSIONS.VIEW_EVENT, PERMISSIONS.MANAGE_EVENT],
  [APP_ROLES.ADMIN_PELATIHAN]: [PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT, PERMISSIONS.MANAGE_FAQ, PERMISSIONS.MANAGE_ARTICLE],
  [APP_ROLES.OPERATOR_PELATIHAN]: [PERMISSIONS.MANAGE_LMS, PERMISSIONS.MANAGE_ALUMNI, PERMISSIONS.MANAGE_TALENT],
};

// 4. FUNGSI CEK ROUTE (MENGATASI AKSES TERLARANG)
export const hasAccess = (role: string | null, pathname: string): boolean => {
  if (!role) return false;
  
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
  if (role === APP_ROLES.ALUMNI) return pathname.startsWith('/lms') || pathname.startsWith('/alumni-portal'); 
  if (role === APP_ROLES.INVESTOR) return pathname.startsWith('/ekosistem') || pathname.startsWith('/portfolio');
  if (role === APP_ROLES.KAMPUS) return pathname.startsWith('/ekosistem') || pathname.startsWith('/riset');
  if (role === APP_ROLES.INDUSTRI) return pathname.startsWith('/ekosistem') || pathname.startsWith('/kebutuhan');
  
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