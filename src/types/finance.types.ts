import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  id: z.string(),
  referenceId: z.string().optional(), 
  referenceType: z.enum(['CATALOG', 'TARIFF_DAY', 'TARIFF_MONTH', 'CUSTOM', 'BOOKING', 'TRAINING']).default('CUSTOM'),
  description: z.string(),
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
  receiptUrl: z.string().optional()
});
export type PaymentHistory = z.infer<typeof PaymentHistorySchema>;

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerType: z.enum(['Tenant', 'Umum']),
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
  notes: z.string().optional(),
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
