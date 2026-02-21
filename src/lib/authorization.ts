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
    'event.approve',
    'payment.read',
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
    'fund.transfer.request',
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
    'payment.read',
    'report.read',
    'report.export',
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
    'controller',
    'store_keeper',
    'purchaser',
    'accountant',
  ],
  '/bookings': ['manager', 'assistant_hall_manager', 'controller', 'cashier_1'],
  '/customers': ['manager', 'controller'],
  '/payments': ['cashier_1', 'controller', 'accountant'],
  '/cash-movement': ['cashier_2', 'cashier_1', 'controller', 'accountant'],
  '/services': ['manager', 'controller'],
  '/rentals': ['manager', 'assistant_hall_manager', 'controller', 'store_keeper', 'purchaser'],
  '/documents': ['manager', 'assistant_hall_manager', 'controller', 'cashier_1', 'store_keeper', 'purchaser'],
  '/reports': ['accountant', 'manager', 'controller', 'cashier_1'],
  '/managing-director-dashboard': ['managing_director'],
  '/portal': ['controller'],
  '/settings': [
    'manager',
    'managing_director',
    'assistant_hall_manager',
    'cashier_1',
    'cashier_2',
    'controller',
    'store_keeper',
    'purchaser',
    'accountant',
  ],
  '/admin': ['controller'],
  '/md-transfer': ['cashier_1', 'controller'],
  '/distribution': ['cashier_2', 'controller'],
  '/messages': ['manager', 'accountant', 'controller'],
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
  return policy.transactionsFrozen && role !== 'controller';
}
