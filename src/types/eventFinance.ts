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
