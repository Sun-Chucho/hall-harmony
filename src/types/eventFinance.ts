export type BudgetCategory =
  | 'decoration'
  | 'cooking'
  | 'drinks'
  | 'cleaning'
  | 'logistics'
  | 'other';

export type AllocationRequestStatus =
  | 'pending_controller'
  | 'approved_controller'
  | 'rejected_controller'
  | 'funds_released'
  | 'closed';

export interface EventBudget {
  id: string;
  bookingId: string;
  createdAt: string;
  createdByUserId: string;
  notes: string;
  categories: Record<BudgetCategory, number>;
  totalAmount: number;
}

export interface AllocationRequest {
  id: string;
  budgetId: string;
  bookingId: string;
  requestedAmount: number;
  purpose: string;
  requestedAt: string;
  requestedByUserId: string;
  status: AllocationRequestStatus;
  approvalId?: string;
  controllerDecisionAt?: string;
  controllerComment?: string;
  releasedAt?: string;
  releasedByUserId?: string;
  releaseReference?: string;
}

export interface ExpenseDistribution {
  id: string;
  allocationRequestId: string;
  bookingId: string;
  category: BudgetCategory;
  amount: number;
  description: string;
  proofReference?: string;
  distributedAt: string;
  distributedByUserId: string;
}

export interface EventFinanceLog {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  referenceId: string;
  detail: string;
}

export type CashTransferStatus =
  | 'pending_cashier_1_approval'
  | 'declined_by_cashier_1'
  | 'sent_to_cashier_2'
  | 'received_by_cashier_2';

export interface CashTransfer {
  id: string;
  requestedAmount: number;
  approvedAmount: number;
  requestComment: string;
  decisionComment: string;
  receiveComment: string;
  initiatedByUserId: string;
  initiatedByRole: 'cashier_1' | 'cashier_2';
  requestedAt: string;
  decidedAt?: string;
  decidedByUserId?: string;
  sentAt?: string;
  sentByUserId?: string;
  receivedAt?: string;
  receivedByUserId?: string;
  status: CashTransferStatus;
}

export interface ManagingDirectorTransfer {
  id: string;
  amount: number;
  reference: string;
  notes: string;
  transferredAt: string;
  transferredByUserId: string;
}

export type CashDistributionCategory =
  | 'cleaning'
  | 'stationary'
  | 'repairs_maintenance'
  | 'electricity'
  | 'petty_cash'
  | 'fuel'
  | 'logistics'
  | 'decoration'
  | 'cooling'
  | 'drink'
  | 'other';

export interface CashDistributionRecord {
  id: string;
  category: CashDistributionCategory;
  customCategoryLabel?: string;
  amount: number;
  reason: string;
  distributedAt: string;
  distributedByUserId: string;
}
