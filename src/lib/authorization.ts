import type { UserRole } from '@/types/auth';

export type ApprovalLevel = 'minor' | 'money' | 'final';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'overridden';
export type ApprovalModule =
  | 'booking'
  | 'event'
  | 'payment'
  | 'refund'
  | 'purchase'
  | 'allocation'
  | 'fund_transfer';

export type Permission =
  | 'booking.read'
  | 'booking.write'
  | 'booking.approve'
  | 'event.approve'
  | 'payment.record'
  | 'payment.read'
  | 'fund.allocate'
  | 'fund.transfer.request'
  | 'purchase.request'
  | 'purchase.approve'
  | 'inventory.manage'
  | 'report.read'
  | 'report.export'
  | 'approval.review.minor'
  | 'approval.review.money'
  | 'approval.review.final'
  | 'approval.override'
  | 'transaction.freeze'
  | 'transaction.unfreeze'
  | 'audit.read';

export interface ApprovalRequest {
  id: string;
  level: ApprovalLevel;
  module: ApprovalModule;
  title: string;
  description: string;
  amount?: number;
  requestedByUserId: string;
  requestedByRole: UserRole;
  targetReference: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  reviewedByUserId?: string;
  reviewedByRole?: UserRole;
  decisionComment?: string;
  overrideByUserId?: string;
  overrideByRole?: UserRole;
  overrideComment?: string;
}

export interface SystemPolicy {
  transactionsFrozen: boolean;
  freezeReason: string;
  finalApprovalRequired: boolean;
  majorExpenseThreshold: number;
}

export interface AuthorizationAuditEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  module: ApprovalModule | 'system';
  detail: string;
}

export const DEFAULT_SYSTEM_POLICY: SystemPolicy = {
  transactionsFrozen: false,
  freezeReason: '',
  finalApprovalRequired: true,
  majorExpenseThreshold: 3000000,
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  manager: [
    'booking.read',
    'booking.write',
    'event.approve',
    'payment.read',
    'purchase.request',
    'report.read',
    'approval.review.minor',
    'audit.read',
  ],
  managing_director: [
    'payment.read',
    'report.read',
    'report.export',
    'audit.read',
  ],
  assistant_hall_manager: [
    'booking.read',
    'booking.write',
  ],
  cashier_1: [
    'payment.record',
    'payment.read',
    'fund.allocate',
    'fund.transfer.request',
    'approval.review.final',
    'approval.review.money',
  ],
  cashier_2: [
    'fund.allocate',
    'approval.review.money',
  ],
  controller: [
    'booking.read',
    'booking.write',
    'booking.approve',
    'event.approve',
    'payment.record',
    'payment.read',
    'fund.allocate',
    'fund.transfer.request',
    'purchase.request',
    'purchase.approve',
    'inventory.manage',
    'report.read',
    'report.export',
    'approval.review.minor',
    'approval.review.money',
    'approval.review.final',
    'approval.override',
    'transaction.freeze',
    'transaction.unfreeze',
    'audit.read',
  ],
  store_keeper: [
    'inventory.manage',
    'purchase.request',
  ],
  purchaser: [
    'purchase.request',
  ],
  accountant: [
    'booking.read',
    'booking.write',
    'booking.approve',
    'event.approve',
    'payment.record',
    'payment.read',
    'fund.allocate',
    'fund.transfer.request',
    'purchase.request',
    'purchase.approve',
    'inventory.manage',
    'report.read',
    'report.export',
    'approval.review.minor',
    'approval.review.money',
    'approval.review.final',
    'approval.override',
    'transaction.freeze',
    'transaction.unfreeze',
    'audit.read',
  ],
};

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/dashboard': [
    'manager',
    'managing_director',
    'assistant_hall_manager',
    'cashier_1',
    'cashier_2',
    'store_keeper',
    'purchaser',
    'accountant',
  ],
  '/bookings': ['assistant_hall_manager', 'cashier_1'],
  '/bookings/submitted': ['assistant_hall_manager'],
  '/customers': ['manager', 'assistant_hall_manager'],
  '/payments': ['cashier_1', 'accountant'],
  '/cash-movement': ['cashier_1', 'accountant'],
  '/cash-requests': ['assistant_hall_manager', 'cashier_1', 'store_keeper', 'accountant', 'manager'],
  '/purchase-requests': ['assistant_hall_manager', 'store_keeper', 'purchaser'],
  '/payment-vouchers': ['accountant'],
  '/services': ['manager', 'accountant'],
  '/rentals': ['manager', 'assistant_hall_manager', 'accountant', 'store_keeper', 'purchaser'],
  '/inventory': ['store_keeper'],
  '/documents': ['manager', 'accountant', 'cashier_1', 'store_keeper'],
  '/reports': ['manager', 'managing_director', 'assistant_hall_manager', 'cashier_1', 'accountant', 'store_keeper', 'purchaser'],
  '/managing-director-dashboard': ['managing_director'],
  '/managing-director-dashboard/analytics': ['managing_director'],
  '/managing-director-dashboard/stock-overview': ['managing_director'],
  '/managing-director-dashboard/halls-payment-booking': ['managing_director'],
  '/managing-director-dashboard/cash-requests-vouchers': ['managing_director'],
  '/portal': ['accountant'],
  '/settings': [
    'manager',
    'managing_director',
    'assistant_hall_manager',
    'cashier_1',
    'store_keeper',
    'purchaser',
    'accountant',
  ],
  '/admin': ['accountant'],
  '/md-transfer': ['cashier_1', 'accountant'],
  '/distribution': ['cashier_1', 'accountant'],
  '/messages': ['manager', 'managing_director', 'assistant_hall_manager', 'cashier_1', 'accountant', 'store_keeper', 'purchaser'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROUTE_ACCESS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function canReviewApproval(role: UserRole, level: ApprovalLevel): boolean {
  const requiredPermission: Record<ApprovalLevel, Permission> = {
    minor: 'approval.review.minor',
    money: 'approval.review.money',
    final: 'approval.review.final',
  };
  return hasPermission(role, requiredPermission[level]);
}

export function isTransactionBlocked(role: UserRole, policy: SystemPolicy): boolean {
  return policy.transactionsFrozen && role !== 'accountant';
}
