import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  id: z.string(),
  referenceId: z.string().optional(), 
  referenceType: z.enum(['CATALOG', 'TARIFF_DAY', 'TARIFF_MONTH', 'CUSTOM', 'BOOKING', 'TRAINING', 'PRODUCTION', 'TENANT', 'PARTNERSHIP', 'EVENT']).default('CUSTOM'),
  description: z.string(),
  subDescription: z.string().optional(),
  unit: z.string().optional(),
  points: z.array(z.string()).optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number()
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const PaymentHistorySchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  method: z.string(),
  status: z.enum(['SUCCESS', 'PENDING', 'FAILED']),
  receiptUrl: z.string().optional(),
  aiOcrMeta: z.record(z.string(), z.any()).optional(),
});
export type PaymentHistory = z.infer<typeof PaymentHistorySchema>;

export const InvoiceDivisionSchema = z.enum([
  'JASA_PRODUKSI',
  'FASILITAS_ASET',
  'DIKLAT_PELATIHAN',
  'INKUBASI_TENANT',
  'KATALOG_PRODUK',
  'UMUM'
]);
export type InvoiceDivision = z.infer<typeof InvoiceDivisionSchema>;

export const INVOICE_DIVISION_CONFIG: Record<
  InvoiceDivision, 
  { 
    label: string; 
    shortLabel: string;
    badgeClass: string; 
    defaultCoaCode: string; 
    defaultCoaName: string; 
  }
> = {
  JASA_PRODUKSI: {
    label: 'Jasa Produksi & Manufaktur',
    shortLabel: 'Manufaktur',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultCoaCode: '4.1.02',
    defaultCoaName: 'Pendapatan Jasa Layanan Manufaktur & Fabrikasi'
  },
  FASILITAS_ASET: {
    label: 'Sewa Fasilitas & Gedung',
    shortLabel: 'Fasilitas',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultCoaCode: '4.1.01',
    defaultCoaName: 'Pendapatan Sewa Gedung, Lahan & Laboratorium'
  },
  DIKLAT_PELATIHAN: {
    label: 'Diklat & Pelatihan Kerja',
    shortLabel: 'Pelatihan',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultCoaCode: '4.1.03',
    defaultCoaName: 'Pendapatan Jasa Pelatihan & Sertifikasi'
  },
  INKUBASI_TENANT: {
    label: 'Inkubasi Bisnis & Tenant',
    shortLabel: 'Tenant',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultCoaCode: '4.1.04',
    defaultCoaName: 'Pendapatan Jasa Inkubasi Startup & Tenant'
  },
  KATALOG_PRODUK: {
    label: 'Katalog Produk & Merchandise',
    shortLabel: 'Produk',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    defaultCoaCode: '4.1.05',
    defaultCoaName: 'Pendapatan Penjualan Produk & Merchandise'
  },
  UMUM: {
    label: 'Layanan Umum / Lainnya',
    shortLabel: 'Umum',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    defaultCoaCode: '4.1.99',
    defaultCoaName: 'Pendapatan Jasa Layanan Umum BLUD Lainnya'
  }
};

/**
 * Helper untuk menentukan divisi invoice jika field division belum terisi (backward-compatibility)
 */
export function inferInvoiceDivision(invoice: Partial<Invoice>): InvoiceDivision {
  if (invoice.division && invoice.division in INVOICE_DIVISION_CONFIG) {
    return invoice.division as InvoiceDivision;
  }
  const firstItem = invoice.items && invoice.items.length > 0 ? invoice.items[0] : null;
  const refType = firstItem?.referenceType;
  const invNumber = invoice.invoiceNumber || '';

  if (refType === 'PRODUCTION' || invNumber.includes('/PROD/')) return 'JASA_PRODUKSI';
  if (refType === 'TENANT' || invoice.customerType === 'Tenant' || invNumber.includes('/TENANT/')) return 'INKUBASI_TENANT';
  if (refType === 'BOOKING' || refType === 'TARIFF_DAY' || refType === 'TARIFF_MONTH' || invNumber.includes('/SEWA/') || invNumber.includes('/BKG/')) return 'FASILITAS_ASET';
  if (refType === 'TRAINING' || invNumber.includes('/TRN/') || invNumber.includes('/TRAINING/')) return 'DIKLAT_PELATIHAN';
  if (refType === 'CATALOG' || invNumber.includes('/CAT/')) return 'KATALOG_PRODUK';
  return 'UMUM';
}

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerType: z.enum(['Tenant', 'Umum']),
  tenantId: z.string().optional(),
  customerEmail: z.string().optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),
  items: z.array(InvoiceItemSchema),
  subTotal: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  term: z.enum(['FULL_PAYMENT', 'DOWN_PAYMENT', 'INSTALLMENT', 'SUBSCRIPTION']),
  date: z.string(),
  dueDate: z.string(),
  status: z.enum(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE', 'CANCELLED']),
  division: InvoiceDivisionSchema.default('UMUM').optional(),
  divisionPic: z.string().optional(),
  divisionRefNumber: z.string().optional(),
  issuerName: z.string().optional().default(''),       
  issuerRole: z.string().optional().default('Kasir'),  
  issuerNIP: z.string().optional().default(''),        
  paymentBankName: z.string().optional(),
  paymentAccountNumber: z.string().optional(),
  paymentAccountHolder: z.string().optional(),
  paymentAccounts: z.array(z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string()
  })).optional(),
  history: z.array(PaymentHistorySchema),
  paymentUrl: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentProofUrl: z.string().optional(),
  paymentProofMeta: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.array(z.string()).optional(),
  referralCode: z.string().optional(),
  createdAt: z.number().optional(),
  isAllocated: z.boolean().default(false).optional(),
  allocatedCoaId: z.string().optional(),
  allocatedCoaName: z.string().optional(),
  suggestedCoaId: z.string().optional(),
  updatedAt: z.number().optional(), 
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const AccountSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  type: z.enum(['KAS_BANK', 'PENDAPATAN', 'BEBAN', 'HUTANG', 'PIUTANG', 'ASET_TETAP']),
  parentId: z.string().optional().nullable(), 
  level: z.number().default(1),               
  accountBehavior: z.enum(['HEADER', 'TRANSACTION', 'DETAIL']).default('TRANSACTION'),
  balance: z.number().default(0), 
  isSystem: z.boolean().default(false), 
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  isReceivingAccount: z.boolean().default(false).optional(),
  createdAt: z.number().optional()
});
export type Account = z.infer<typeof AccountSchema>;

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  expenseNumber: z.string(), 
  date: z.string(),
  categoryId: z.string(), 
  categoryName: z.string(),
  payeeName: z.string(), 
  description: z.string(),
  amount: z.number(),
  sourceAccountId: z.string(), 
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED']).default('PENDING_APPROVAL'),
  receiptUrl: z.string().optional(),
  updatedAt: z.number().optional(),
  createdAt: z.number().optional()
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const JournalSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  referenceType: z.enum(['INVOICE', 'EXPENSE', 'TRANSFER_KAS', 'PENYESUAIAN_KAS']),
  referenceId: z.string(),
  description: z.string(),
  entries: z.array(z.object({
    accountId: z.string(),
    accountName: z.string(),
    type: z.enum(['DEBIT', 'KREDIT']),
    amount: z.number()
  })),
  isReconciled: z.boolean().optional().default(false),
  updatedAt: z.number().optional(),
  createdAt: z.number().optional()
});
export type Journal = z.infer<typeof JournalSchema>;

export const BudgetSchema = z.object({
  id: z.string().optional(),
  period: z.string(),
  categoryId: z.string(), 
  categoryName: z.string(), 
  allocatedAmount: z.number(), 
  notes: z.string().optional(),
  createdAt: z.number().optional()
});
export type Budget = z.infer<typeof BudgetSchema>;
