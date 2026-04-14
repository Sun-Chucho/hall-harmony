import { CashDistributionRecord, ManagingDirectorTransfer } from '@/types/eventFinance';
import { ROLE_LABELS, UserRole } from '@/types/auth';

export const DOCUMENT_OUTPUTS_COLLECTION = 'document_form_outputs';
export const CASH_REQUEST_WORKFLOW_COLLECTION = 'cash_request_workflow';
export const PURCHASE_REQUEST_WORKFLOW_COLLECTION = 'purchase_item_workflow';
export const USER_NOTIFICATION_COLLECTION = 'user_notifications';

export type CashRequestStageCode =
  | 'submitted'
  | 'moved_to_accountant'
  | 'approved_by_accountant'
  | 'moved_to_halls_manager'
  | 'approved_by_halls_manager'
  | 'moved_to_cashier'
  | 'payment_voucher_created'
  | 'sent_to_accountant'
  | 'completed'
  | 'declined_accountant'
  | 'declined_halls_manager';

export type CashRequestStatus =
  | 'pending_accountant'
  | 'pending_halls_manager'
  | 'pending_cashier'
  | 'sent_to_accountant'
  | 'completed'
  | 'declined';

export type CashRequestActionRole = Extract<UserRole, 'accountant' | 'manager' | 'cashier_1'>;

export interface CashRequestStageEntry {
  id: string;
  code: CashRequestStageCode;
  label: string;
  at: string;
  actorUserId?: string;
  actorRole?: UserRole;
  note?: string;
}

export interface CashRequestWorkflow {
  id: string;
  reference: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  currentStatus: CashRequestStatus;
  currentAssigneeRole?: UserRole;
  stages: CashRequestStageEntry[];
  accountantReviewedAt?: string;
  accountantReviewedBy?: string;
  accountantComment?: string;
  hallsManagerReviewedAt?: string;
  hallsManagerReviewedBy?: string;
  hallsManagerComment?: string;
  cashierReviewedAt?: string;
  cashierReviewedBy?: string;
  paymentVoucherId?: string;
  paymentVoucherNumber?: string;
  paymentVoucherCreatedAt?: string;
  completedAt?: string;
}

export type PurchaseRequestStatus = 'pending_purchaser' | 'purchase_done' | 'declined';

export interface PurchaseRequestWorkflow {
  id: string;
  reference: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  currentStatus: PurchaseRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  purchaseReference?: string;
  purchaseRecordedAt?: string;
  purchaseRecordedBy?: string;
  purchaseComment?: string;
  purchaseSupplier?: string;
  purchaseDate?: string;
}

export interface DocumentOutput {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  reference?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  createdByUserId?: string;
  createdByRole?: UserRole;
  link?: string;
  relatedId?: string;
  relatedType?: 'cash_request' | 'purchase_request' | 'payment_voucher' | 'booking' | 'system';
}

export interface MoneyMovementRow {
  id: string;
  date: string;
  reference: string;
  amount: number;
  movementStage: string;
  notes: string;
}

const CASH_STAGE_LABELS: Record<CashRequestStageCode, string> = {
  submitted: 'Submitted',
  moved_to_accountant: 'Moved to Accountant',
  approved_by_accountant: 'Approved by Accountant',
  moved_to_halls_manager: 'Moved to Halls Manager',
  approved_by_halls_manager: 'Approved by Halls Manager',
  moved_to_cashier: 'Moved to Cashier',
  payment_voucher_created: 'Payment Voucher Created',
  sent_to_accountant: 'Sent to Accountant',
  completed: 'Request Approved / Completed',
  declined_accountant: 'Declined by Accountant',
  declined_halls_manager: 'Declined by Halls Manager',
};

const DOCUMENT_REFERENCE_KEYS = [
  'reference_number',
  'reference',
  'request_reference',
  'purchase_reference',
  'voucher_number',
  'voucher_no',
  'invoice_number',
  'grn_number',
  'grn_no',
  'order_number',
  'delivery_note_number',
  'receipt_number',
] as const;

const DOCUMENT_REFERENCE_KEYS_BY_FORM: Record<string, readonly string[]> = {
  payment_voucher: ['reference_number', 'request_reference', 'request_number', 'voucher_number'],
  petty_cash: ['voucher_no', 'reference_number'],
  tax_invoice: ['invoice_number', 'reference_number'],
  grn: ['grn_number', 'delivery_note_number', 'reference_number'],
  stores_ledger: ['grn_no', 'reference_number'],
  delivery_note: ['order_number', 'invoice_number', 'reference_number'],
  purchase_request: ['reference', 'purchase_reference'],
  cash_request: ['reference'],
};

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && value in ROLE_LABELS;
}

function fallbackIso(value?: unknown) {
  if (typeof value === 'string' && value.trim()) return value;
  return new Date().toISOString();
}

function getRecordString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getDocumentOutputReference(
  formId: string,
  fields: Record<string, string>,
  explicitReference?: unknown,
) {
  const directReference = getRecordString(explicitReference);
  if (directReference) return directReference;

  const candidateKeys = [
    ...(DOCUMENT_REFERENCE_KEYS_BY_FORM[formId] ?? []),
    ...DOCUMENT_REFERENCE_KEYS,
  ];

  for (const key of candidateKeys) {
    const value = getRecordString(fields[key]);
    if (value) return value;
  }

  return undefined;
}

function toStageLabel(code: CashRequestStageCode) {
  return CASH_STAGE_LABELS[code];
}

function buildStage(code: CashRequestStageCode, at: string, actorUserId?: string, actorRole?: UserRole, note?: string): CashRequestStageEntry {
  const stage: CashRequestStageEntry = {
    id: `${code}-${at}-${actorUserId ?? 'system'}`,
    code,
    label: toStageLabel(code),
    at,
  };

  if (typeof actorUserId === 'string' && actorUserId.trim()) {
    stage.actorUserId = actorUserId;
  }
  if (actorRole) {
    stage.actorRole = actorRole;
  }
  if (typeof note === 'string' && note.trim()) {
    stage.note = note;
  }

  return stage;
}

function uniqueStages(stages: CashRequestStageEntry[]) {
  const seen = new Set<string>();
  return [...stages]
    .filter((stage) => {
      const key = `${stage.code}-${stage.at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function toCashStatus(rawStatus: unknown): CashRequestStatus {
  switch (rawStatus) {
    case 'pending_accountant':
    case 'pending_controller':
      return 'pending_accountant';
    case 'pending_halls_manager':
    case 'pending_manager':
      return 'pending_halls_manager';
    case 'pending_cashier':
    case 'approved_halls_manager':
    case 'approved_manager':
      return 'pending_cashier';
    case 'sent_to_accountant':
      return 'sent_to_accountant';
    case 'voucher_recorded':
    case 'distribution_recorded':
    case 'completed':
      return 'completed';
    case 'declined_accountant':
    case 'declined_controller':
    case 'declined_halls_manager':
    case 'declined_manager':
      return 'declined';
    default:
      return 'pending_accountant';
  }
}

export function getCashRequestAssignee(status: CashRequestStatus): UserRole | undefined {
  switch (status) {
    case 'pending_accountant':
      return 'accountant';
    case 'pending_halls_manager':
      return 'manager';
    case 'pending_cashier':
      return 'cashier_1';
    case 'sent_to_accountant':
      return 'accountant';
    default:
      return undefined;
  }
}

export function getCashRequestActionError(
  request: Pick<CashRequestWorkflow, 'currentStatus' | 'currentAssigneeRole'>,
  role: CashRequestActionRole,
) {
  if (request.currentStatus === 'completed') {
    return 'This cash request is already completed.';
  }

  if (request.currentStatus === 'declined') {
    return 'This cash request has already been declined.';
  }

  const expectedRole = getCashRequestAssignee(request.currentStatus);
  const assignedRole = request.currentAssigneeRole ?? expectedRole;

  if (assignedRole && assignedRole !== role) {
    return `This cash request is currently assigned to ${ROLE_LABELS[assignedRole]}.`;
  }

  if (expectedRole && expectedRole !== role) {
    return `This cash request is currently waiting for ${ROLE_LABELS[expectedRole]}.`;
  }

  if (!expectedRole && !assignedRole) {
    return 'This cash request is not awaiting action right now.';
  }

  return null;
}

export function canCashRequestAdvance(
  request: Pick<CashRequestWorkflow, 'currentStatus' | 'currentAssigneeRole'>,
  role: CashRequestActionRole,
) {
  return getCashRequestActionError(request, role) === null;
}

function buildLegacyCashStages(raw: Record<string, unknown>, currentStatus: CashRequestStatus) {
  const submittedAt = fallbackIso(raw.submittedAt ?? raw.createdAt);
  const stages: CashRequestStageEntry[] = [
    buildStage('submitted', submittedAt),
    buildStage('moved_to_accountant', submittedAt),
  ];

  const accountantReviewedAt = typeof raw.accountantReviewedAt === 'string'
    ? raw.accountantReviewedAt
    : typeof raw.reviewedAt === 'string'
      ? raw.reviewedAt
      : undefined;
  const accountantReviewedBy = typeof raw.accountantReviewedBy === 'string'
    ? raw.accountantReviewedBy
    : typeof raw.reviewedBy === 'string'
      ? raw.reviewedBy
      : undefined;
  const accountantComment = typeof raw.accountantComment === 'string'
    ? raw.accountantComment
    : typeof raw.reviewComment === 'string'
      ? raw.reviewComment
      : undefined;

  if (accountantReviewedAt) {
    const accountantRole = isUserRole(raw.accountantReviewedByRole) ? raw.accountantReviewedByRole : 'accountant';
    if (currentStatus === 'declined') {
      stages.push(buildStage('declined_accountant', accountantReviewedAt, accountantReviewedBy, accountantRole, accountantComment));
    } else {
      stages.push(buildStage('approved_by_accountant', accountantReviewedAt, accountantReviewedBy, accountantRole, accountantComment));
      stages.push(buildStage('moved_to_halls_manager', accountantReviewedAt, accountantReviewedBy, accountantRole));
    }
  }

  const hallsManagerReviewedAt = typeof raw.hallsManagerReviewedAt === 'string'
    ? raw.hallsManagerReviewedAt
    : undefined;
  const hallsManagerReviewedBy = typeof raw.hallsManagerReviewedBy === 'string'
    ? raw.hallsManagerReviewedBy
    : undefined;
  const hallsManagerComment = typeof raw.hallsManagerComment === 'string'
    ? raw.hallsManagerComment
    : undefined;

  if (hallsManagerReviewedAt) {
    if (currentStatus === 'declined') {
      stages.push(buildStage('declined_halls_manager', hallsManagerReviewedAt, hallsManagerReviewedBy, 'manager', hallsManagerComment));
    } else {
      stages.push(buildStage('approved_by_halls_manager', hallsManagerReviewedAt, hallsManagerReviewedBy, 'manager', hallsManagerComment));
      stages.push(buildStage('moved_to_cashier', hallsManagerReviewedAt, hallsManagerReviewedBy, 'manager'));
    }
  }

  const voucherAt = typeof raw.paymentVoucherCreatedAt === 'string'
    ? raw.paymentVoucherCreatedAt
    : typeof raw.paymentVoucherRecordedAt === 'string'
      ? raw.paymentVoucherRecordedAt
      : typeof raw.cashierReviewedAt === 'string'
        ? raw.cashierReviewedAt
        : typeof raw.completedAt === 'string'
          ? raw.completedAt
          : undefined;

  if (voucherAt) {
    const cashierReviewedBy = typeof raw.cashierReviewedBy === 'string'
      ? raw.cashierReviewedBy
      : typeof raw.paymentVoucherRecordedBy === 'string'
        ? raw.paymentVoucherRecordedBy
        : undefined;
    stages.push(buildStage('payment_voucher_created', voucherAt, cashierReviewedBy, 'cashier_1', typeof raw.paymentVoucherNumber === 'string' ? raw.paymentVoucherNumber : undefined));
    stages.push(buildStage('sent_to_accountant', voucherAt, cashierReviewedBy, 'cashier_1'));
    if (currentStatus === 'completed') {
      stages.push(buildStage('completed', voucherAt, cashierReviewedBy, 'cashier_1'));
    }
  }

  return uniqueStages(stages);
}

export function normalizeCashRequest(rawValue: Record<string, unknown>): CashRequestWorkflow {
  const id = String(rawValue.id ?? '');
  const currentStatus = toCashStatus(rawValue.currentStatus ?? rawValue.status);
  const stages = Array.isArray(rawValue.stages)
    ? uniqueStages(rawValue.stages
        .map((stage) => {
          const value = stage as Record<string, unknown>;
          const code = value.code as CashRequestStageCode;
          if (!code || !(code in CASH_STAGE_LABELS)) return null;
          return {
            id: String(value.id ?? `${code}-${fallbackIso(value.at)}`),
            code,
            label: typeof value.label === 'string' && value.label.trim() ? value.label : toStageLabel(code),
            at: fallbackIso(value.at),
            actorUserId: typeof value.actorUserId === 'string' ? value.actorUserId : undefined,
            actorRole: isUserRole(value.actorRole) ? value.actorRole : undefined,
            note: typeof value.note === 'string' ? value.note : undefined,
          } satisfies CashRequestStageEntry;
        })
        .filter(Boolean) as CashRequestStageEntry[])
    : buildLegacyCashStages(rawValue, currentStatus);

  return {
    id,
    reference: typeof rawValue.reference === 'string' && rawValue.reference.trim()
      ? rawValue.reference
      : `CR-${(id || Date.now().toString()).slice(-6).toUpperCase()}`,
    submittedAt: fallbackIso(rawValue.submittedAt ?? rawValue.createdAt),
    submittedBy: String(rawValue.submittedBy ?? ''),
    submittedByRole: isUserRole(rawValue.submittedByRole) ? rawValue.submittedByRole : 'assistant_hall_manager',
    fields: (rawValue.fields as Record<string, string>) ?? {},
    currentStatus,
    currentAssigneeRole: isUserRole(rawValue.currentAssigneeRole) ? rawValue.currentAssigneeRole : getCashRequestAssignee(currentStatus),
    stages,
    accountantReviewedAt: typeof rawValue.accountantReviewedAt === 'string'
      ? rawValue.accountantReviewedAt
      : typeof rawValue.reviewedAt === 'string'
        ? rawValue.reviewedAt
        : undefined,
    accountantReviewedBy: typeof rawValue.accountantReviewedBy === 'string'
      ? rawValue.accountantReviewedBy
      : typeof rawValue.reviewedBy === 'string'
        ? rawValue.reviewedBy
        : undefined,
    accountantComment: typeof rawValue.accountantComment === 'string'
      ? rawValue.accountantComment
      : typeof rawValue.reviewComment === 'string'
        ? rawValue.reviewComment
        : undefined,
    hallsManagerReviewedAt: typeof rawValue.hallsManagerReviewedAt === 'string' ? rawValue.hallsManagerReviewedAt : undefined,
    hallsManagerReviewedBy: typeof rawValue.hallsManagerReviewedBy === 'string' ? rawValue.hallsManagerReviewedBy : undefined,
    hallsManagerComment: typeof rawValue.hallsManagerComment === 'string' ? rawValue.hallsManagerComment : undefined,
    cashierReviewedAt: typeof rawValue.cashierReviewedAt === 'string' ? rawValue.cashierReviewedAt : undefined,
    cashierReviewedBy: typeof rawValue.cashierReviewedBy === 'string' ? rawValue.cashierReviewedBy : undefined,
    paymentVoucherId: typeof rawValue.paymentVoucherId === 'string' ? rawValue.paymentVoucherId : undefined,
    paymentVoucherNumber: typeof rawValue.paymentVoucherNumber === 'string' ? rawValue.paymentVoucherNumber : undefined,
    paymentVoucherCreatedAt: typeof rawValue.paymentVoucherCreatedAt === 'string'
      ? rawValue.paymentVoucherCreatedAt
      : typeof rawValue.paymentVoucherRecordedAt === 'string'
        ? rawValue.paymentVoucherRecordedAt
        : undefined,
    completedAt: typeof rawValue.completedAt === 'string' ? rawValue.completedAt : undefined,
  };
}

function toPurchaseStatus(rawStatus: unknown): PurchaseRequestStatus {
  switch (rawStatus) {
    case 'purchased':
    case 'purchase_done':
      return 'purchase_done';
    case 'declined':
    case 'declined_accountant':
    case 'declined_purchaser':
      return 'declined';
    default:
      return 'pending_purchaser';
  }
}

export function normalizePurchaseRequest(rawValue: Record<string, unknown>): PurchaseRequestWorkflow {
  const id = String(rawValue.id ?? '');
  return {
    id,
    reference: typeof rawValue.reference === 'string' && rawValue.reference.trim()
      ? rawValue.reference
      : `PR-${(id || Date.now().toString()).slice(-6).toUpperCase()}`,
    submittedAt: fallbackIso(rawValue.submittedAt ?? rawValue.createdAt),
    submittedBy: String(rawValue.submittedBy ?? ''),
    submittedByRole: isUserRole(rawValue.submittedByRole) ? rawValue.submittedByRole : 'assistant_hall_manager',
    fields: (rawValue.fields as Record<string, string>) ?? {},
    currentStatus: toPurchaseStatus(rawValue.currentStatus ?? rawValue.status),
    reviewedAt: typeof rawValue.reviewedAt === 'string'
      ? rawValue.reviewedAt
      : typeof rawValue.accountantReviewedAt === 'string'
        ? rawValue.accountantReviewedAt
        : undefined,
    reviewedBy: typeof rawValue.reviewedBy === 'string'
      ? rawValue.reviewedBy
      : typeof rawValue.accountantReviewedBy === 'string'
        ? rawValue.accountantReviewedBy
        : undefined,
    reviewComment: typeof rawValue.reviewComment === 'string'
      ? rawValue.reviewComment
      : typeof rawValue.accountantComment === 'string'
        ? rawValue.accountantComment
        : undefined,
    purchaseReference: typeof rawValue.purchaseReference === 'string' ? rawValue.purchaseReference : undefined,
    purchaseRecordedAt: typeof rawValue.purchaseRecordedAt === 'string' ? rawValue.purchaseRecordedAt : undefined,
    purchaseRecordedBy: typeof rawValue.purchaseRecordedBy === 'string' ? rawValue.purchaseRecordedBy : undefined,
    purchaseComment: typeof rawValue.purchaseComment === 'string' ? rawValue.purchaseComment : undefined,
    purchaseSupplier: typeof rawValue.purchaseSupplier === 'string' ? rawValue.purchaseSupplier : undefined,
    purchaseDate: typeof rawValue.purchaseDate === 'string' ? rawValue.purchaseDate : undefined,
  };
}

export function normalizeDocumentOutput(rawValue: Record<string, unknown>): DocumentOutput {
  const id = String(rawValue.id ?? '');
  const formId = typeof rawValue.formId === 'string' ? rawValue.formId : '';
  const fields = (rawValue.fields as Record<string, string>) ?? {};

  return {
    id,
    formId,
    formTitle: typeof rawValue.formTitle === 'string' ? rawValue.formTitle : formId,
    submittedAt: fallbackIso(rawValue.submittedAt ?? rawValue.createdAt),
    submittedBy: String(rawValue.submittedBy ?? ''),
    submittedByRole: isUserRole(rawValue.submittedByRole) ? rawValue.submittedByRole : 'assistant_hall_manager',
    fields,
    reference: getDocumentOutputReference(formId, fields, rawValue.reference),
  };
}

export function createCashRequestStage(
  code: CashRequestStageCode,
  actorUserId?: string,
  actorRole?: UserRole,
  note?: string,
  at = new Date().toISOString(),
) {
  return buildStage(code, at, actorUserId, actorRole, note);
}

export function getCashRequestStatusLabel(status: CashRequestStatus) {
  switch (status) {
    case 'pending_accountant':
      return 'Pending Accountant';
    case 'pending_halls_manager':
      return 'Pending Halls Manager';
    case 'pending_cashier':
      return 'Pending Cashier';
    case 'sent_to_accountant':
      return 'Sent to Accountant';
    case 'completed':
      return 'Completed';
    case 'declined':
      return 'Declined';
  }
}

export function getPurchaseRequestStatusLabel(status: PurchaseRequestStatus) {
  switch (status) {
    case 'pending_purchaser':
      return 'Pending Purchaser';
    case 'purchase_done':
      return 'Purchase Done';
    case 'declined':
      return 'Declined';
  }
}

export function getCashDistributionCategoryLabel(
  category: CashDistributionRecord['category'],
  customCategoryLabel?: string,
) {
  switch (category) {
    case 'cleaning':
      return 'Cleaning';
    case 'stationary':
      return 'Stationary';
    case 'repairs_maintenance':
      return 'Repairs and Maintenance';
    case 'electricity':
      return 'Electricity';
    case 'petty_cash':
      return 'Petty Cash';
    case 'fuel':
      return 'Fuel';
    case 'logistics':
      return 'Logistics';
    case 'decoration':
      return 'Decoration';
    case 'cooling':
      return 'Cooling';
    case 'drink':
      return 'Drink';
    case 'other':
      return customCategoryLabel?.trim() ? `Other - ${customCategoryLabel.trim()}` : 'Other';
  }
}

export function parseCurrencyAmount(value?: string) {
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function escapeCsv(value: string | number) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  if (typeof window === 'undefined') return;
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildMoneyMovementRows(
  cashRequests: CashRequestWorkflow[],
  mdTransfers: ManagingDirectorTransfer[],
  cashDistributions: CashDistributionRecord[],
) {
  const rows: MoneyMovementRow[] = [
    ...mdTransfers.map((entry) => ({
      id: `md-${entry.id}`,
      date: entry.transferredAt,
      reference: entry.reference,
      amount: entry.amount,
      movementStage: 'Amount moved to MD',
      notes: entry.notes || 'Cash moved to managing director',
    })),
    ...cashDistributions.map((entry) => ({
      id: `cash-use-${entry.id}`,
      date: entry.distributedAt,
      reference: entry.id,
      amount: entry.amount,
      movementStage: `Cash Use - ${getCashDistributionCategoryLabel(entry.category, entry.customCategoryLabel)}`,
      notes: entry.reason,
    })),
    ...cashRequests.flatMap((entry) => {
      const amount = parseCurrencyAmount(entry.fields.total_requested);
      return entry.stages
        .filter((stage) => stage.code === 'payment_voucher_created' || stage.code === 'sent_to_accountant' || stage.code === 'completed')
        .map((stage) => ({
          id: `${entry.id}-${stage.code}-${stage.at}`,
          date: stage.at,
          reference: entry.paymentVoucherNumber || entry.reference,
          amount,
          movementStage:
            stage.code === 'payment_voucher_created'
              ? 'Payment voucher created'
              : stage.code === 'sent_to_accountant'
                ? 'Sent to Accountant'
                : 'Funds disbursed',
          notes: stage.note || `Cash request ${entry.reference} for ${entry.fields.full_name ?? 'requester'}`,
        }));
    }),
  ];

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
