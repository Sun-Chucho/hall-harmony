import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { usePayments } from '@/contexts/PaymentContext';
import {
  AllocationRequest,
  BudgetCategory,
  EventBudget,
  EventFinanceLog,
  ExpenseDistribution,
} from '@/types/eventFinance';

interface BudgetInput {
  bookingId: string;
  notes?: string;
  categories: Record<BudgetCategory, number>;
}

interface AllocationInput {
  budgetId: string;
  requestedAmount: number;
  purpose: string;
}

interface DistributionInput {
  allocationRequestId: string;
  category: BudgetCategory;
  amount: number;
  description: string;
  proofReference?: string;
}

interface EventFinanceContextValue {
  budgets: EventBudget[];
  allocations: AllocationRequest[];
  distributions: ExpenseDistribution[];
  logs: EventFinanceLog[];
  createBudget: (input: BudgetInput) => { ok: boolean; message: string; budgetId?: string };
  requestAllocation: (input: AllocationInput) => { ok: boolean; message: string; requestId?: string };
  controllerDecision: (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment: string,
  ) => { ok: boolean; message: string };
  releaseFunds: (requestId: string, releaseReference: string) => { ok: boolean; message: string };
  addDistribution: (input: DistributionInput) => { ok: boolean; message: string; distributionId?: string };
  getAllocationSummary: (requestId: string) => { requested: number; distributed: number; remaining: number };
  generateExpenseSheet: (requestId: string) => { ok: boolean; message: string; sheet?: string };
}

const BUDGETS_KEY = 'kuringe_event_budgets_v1';
const ALLOCATIONS_KEY = 'kuringe_event_allocations_v1';
const DISTRIBUTIONS_KEY = 'kuringe_event_distributions_v1';
const LOGS_KEY = 'kuringe_event_finance_logs_v1';

const EventFinanceContext = createContext<EventFinanceContextValue | undefined>(undefined);

function sumBudget(categories: Record<BudgetCategory, number>): number {
  return Object.values(categories).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
}

export function EventFinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { getBookingFinancials } = usePayments();
  const { policy, createApprovalRequest, reviewApproval } = useAuthorization();
  const [budgets, setBudgets] = useState<EventBudget[]>([]);
  const [allocations, setAllocations] = useState<AllocationRequest[]>([]);
  const [distributions, setDistributions] = useState<ExpenseDistribution[]>([]);
  const [logs, setLogs] = useState<EventFinanceLog[]>([]);

  useEffect(() => {
    const rawBudgets = localStorage.getItem(BUDGETS_KEY);
    const rawAllocations = localStorage.getItem(ALLOCATIONS_KEY);
    const rawDistributions = localStorage.getItem(DISTRIBUTIONS_KEY);
    const rawLogs = localStorage.getItem(LOGS_KEY);

    if (rawBudgets) {
      try {
        setBudgets(JSON.parse(rawBudgets) as EventBudget[]);
      } catch {
        localStorage.removeItem(BUDGETS_KEY);
      }
    }
    if (rawAllocations) {
      try {
        setAllocations(JSON.parse(rawAllocations) as AllocationRequest[]);
      } catch {
        localStorage.removeItem(ALLOCATIONS_KEY);
      }
    }
    if (rawDistributions) {
      try {
        setDistributions(JSON.parse(rawDistributions) as ExpenseDistribution[]);
      } catch {
        localStorage.removeItem(DISTRIBUTIONS_KEY);
      }
    }
    if (rawLogs) {
      try {
        setLogs(JSON.parse(rawLogs) as EventFinanceLog[]);
      } catch {
        localStorage.removeItem(LOGS_KEY);
      }
    }
  }, []);

  useEffect(() => localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(allocations)), [allocations]);
  useEffect(() => localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(distributions)), [distributions]);
  useEffect(() => localStorage.setItem(LOGS_KEY, JSON.stringify(logs)), [logs]);

  const appendLog = useCallback((action: string, referenceId: string, detail: string) => {
    if (!user) return;
    const entry: EventFinanceLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actorUserId: user.id,
      actorRole: user.role,
      action,
      referenceId,
      detail,
    };
    setLogs((prev) => [entry, ...prev]);
  }, [user]);

  const findBooking = useCallback((bookingId: string) => {
    return bookings.find((booking) => booking.id === bookingId);
  }, [bookings]);

  const createBudget = useCallback((input: BudgetInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can create event budgets.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }

    const booking = findBooking(input.bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.bookingStatus !== 'approved') {
      return { ok: false, message: 'Budget can only be created for approved bookings.' };
    }

    const totalAmount = sumBudget(input.categories);
    if (totalAmount <= 0) return { ok: false, message: 'Budget total must be greater than zero.' };

    const existing = budgets.find((item) => item.bookingId === input.bookingId);
    if (existing) {
      const updated: EventBudget = {
        ...existing,
        categories: input.categories,
        totalAmount,
        notes: input.notes?.trim() ?? '',
      };
      setBudgets((prev) => prev.map((item) => (item.id === existing.id ? updated : item)));
      appendLog('budget.updated', existing.id, `Budget updated for booking ${input.bookingId}`);
      return { ok: true, message: 'Event budget updated.', budgetId: existing.id };
    }

    const budget: EventBudget = {
      id: `BUD-${Date.now()}`,
      bookingId: input.bookingId,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      categories: input.categories,
      totalAmount,
      notes: input.notes?.trim() ?? '',
    };
    setBudgets((prev) => [budget, ...prev]);
    appendLog('budget.created', budget.id, `Budget created for booking ${input.bookingId}`);
    return { ok: true, message: 'Event budget created.', budgetId: budget.id };
  }, [appendLog, budgets, findBooking, policy.transactionsFrozen, user]);

  const requestAllocation = useCallback((input: AllocationInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can request allocations.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const budget = budgets.find((item) => item.id === input.budgetId);
    if (!budget) return { ok: false, message: 'Budget not found.' };
    if (input.requestedAmount <= 0) return { ok: false, message: 'Requested amount must be greater than zero.' };
    if (!input.purpose.trim()) return { ok: false, message: 'Purpose is required.' };

    const approval = createApprovalRequest({
      level: 'final',
      module: 'allocation',
      title: `Event allocation request for ${budget.bookingId}`,
      description: input.purpose.trim(),
      targetReference: `ALLOC-${budget.bookingId}-${Date.now()}`,
      amount: input.requestedAmount,
    });
    if (!approval.ok || !approval.requestId) return { ok: false, message: approval.message };

    const request: AllocationRequest = {
      id: `ALLOC-${Date.now()}`,
      budgetId: budget.id,
      bookingId: budget.bookingId,
      requestedAmount: input.requestedAmount,
      purpose: input.purpose.trim(),
      requestedAt: new Date().toISOString(),
      requestedByUserId: user.id,
      status: 'pending_controller',
      approvalId: approval.requestId,
    };
    setAllocations((prev) => [request, ...prev]);
    appendLog('allocation.requested', request.id, `Allocation requested for ${budget.bookingId}`);
    return { ok: true, message: 'Allocation request submitted for controller approval.', requestId: request.id };
  }, [appendLog, budgets, createApprovalRequest, policy.transactionsFrozen, user]);

  const controllerDecision = useCallback((
    requestId: string,
    decision: 'approved' | 'rejected',
    comment: string,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'controller') return { ok: false, message: 'Only Controller can decide allocation requests.' };
    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'pending_controller') return { ok: false, message: 'Request is not pending controller decision.' };
    if (!request.approvalId) return { ok: false, message: 'Missing approval reference.' };

    const review = reviewApproval(request.approvalId, decision, comment || 'Controller decision');
    if (!review.ok) return { ok: false, message: review.message };

    setAllocations((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: decision === 'approved' ? 'approved_controller' : 'rejected_controller',
              controllerDecisionAt: new Date().toISOString(),
              controllerComment: comment.trim(),
            }
          : item,
      ),
    );
    appendLog(
      decision === 'approved' ? 'allocation.approved' : 'allocation.rejected',
      requestId,
      comment || 'Controller decision recorded',
    );
    return { ok: true, message: `Allocation ${decision} by controller.` };
  }, [allocations, appendLog, reviewApproval, user]);

  const releaseFunds = useCallback((requestId: string, releaseReference: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can release funds.' };
    }
    if (!releaseReference.trim()) return { ok: false, message: 'Release reference is required.' };

    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'approved_controller') {
      return { ok: false, message: 'Allocation must be controller-approved before release.' };
    }

    const financials = getBookingFinancials(request.bookingId);
    if (financials.totalPaid < request.requestedAmount) {
      return { ok: false, message: 'Insufficient received funds for this release.' };
    }

    setAllocations((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'funds_released',
              releasedAt: new Date().toISOString(),
              releasedByUserId: user.id,
              releaseReference: releaseReference.trim(),
            }
          : item,
      ),
    );
    appendLog('allocation.released', requestId, `Funds released with reference ${releaseReference.trim()}`);
    return { ok: true, message: 'Funds released to Cashier 2 for distribution.' };
  }, [allocations, appendLog, getBookingFinancials, user]);

  const getAllocationSummary = useCallback((requestId: string) => {
    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { requested: 0, distributed: 0, remaining: 0 };
    const distributed = distributions
      .filter((item) => item.allocationRequestId === requestId)
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      requested: request.requestedAmount,
      distributed,
      remaining: Math.max(request.requestedAmount - distributed, 0),
    };
  }, [allocations, distributions]);

  const addDistribution = useCallback((input: DistributionInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can distribute funds.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const request = allocations.find((item) => item.id === input.allocationRequestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'funds_released') {
      return { ok: false, message: 'Funds must be released before distribution.' };
    }
    if (input.amount <= 0) return { ok: false, message: 'Distribution amount must be greater than zero.' };
    if (!input.description.trim()) return { ok: false, message: 'Distribution description is required.' };

    const summary = getAllocationSummary(request.id);
    if (input.amount > summary.remaining) {
      return { ok: false, message: 'Distribution exceeds remaining allocation balance.' };
    }

    const distribution: ExpenseDistribution = {
      id: `DIST-${Date.now()}`,
      allocationRequestId: request.id,
      bookingId: request.bookingId,
      category: input.category,
      amount: input.amount,
      description: input.description.trim(),
      proofReference: input.proofReference?.trim() || undefined,
      distributedAt: new Date().toISOString(),
      distributedByUserId: user.id,
    };
    setDistributions((prev) => [distribution, ...prev]);

    const newRemaining = summary.remaining - input.amount;
    if (newRemaining <= 0) {
      setAllocations((prev) =>
        prev.map((item) => (item.id === request.id ? { ...item, status: 'closed' } : item)),
      );
    }

    appendLog('distribution.recorded', distribution.id, `Expense distribution added to ${input.category}`);
    return { ok: true, message: 'Expense distribution recorded.', distributionId: distribution.id };
  }, [allocations, appendLog, getAllocationSummary, policy.transactionsFrozen, user]);

  const generateExpenseSheet = useCallback((requestId: string) => {
    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    const budget = budgets.find((item) => item.id === request.budgetId);
    const booking = findBooking(request.bookingId);
    const relatedDistributions = distributions.filter((item) => item.allocationRequestId === requestId);
    const summary = getAllocationSummary(requestId);

    const lines = [
      'KURINGE HALLS - EVENT EXPENSE SHEET',
      `Event Ref: ${request.bookingId}`,
      `Booking: ${booking?.eventName ?? 'Unknown event'}`,
      `Hall: ${booking?.hall ?? '-'}`,
      `Date: ${booking?.date ?? '-'}`,
      `Budget Total: TZS ${(budget?.totalAmount ?? 0).toLocaleString()}`,
      `Allocated: TZS ${summary.requested.toLocaleString()}`,
      `Distributed: TZS ${summary.distributed.toLocaleString()}`,
      `Remaining: TZS ${summary.remaining.toLocaleString()}`,
      'Distributions:',
      ...relatedDistributions.map((item) => `- ${item.category}: TZS ${item.amount.toLocaleString()} (${item.description})`),
    ];
    return { ok: true, message: 'Expense sheet generated.', sheet: lines.join('\n') };
  }, [allocations, budgets, distributions, findBooking, getAllocationSummary]);

  const value = useMemo<EventFinanceContextValue>(() => ({
    budgets,
    allocations,
    distributions,
    logs,
    createBudget,
    requestAllocation,
    controllerDecision,
    releaseFunds,
    addDistribution,
    getAllocationSummary,
    generateExpenseSheet,
  }), [
    addDistribution,
    allocations,
    budgets,
    controllerDecision,
    createBudget,
    distributions,
    generateExpenseSheet,
    getAllocationSummary,
    logs,
    releaseFunds,
    requestAllocation,
  ]);

  return <EventFinanceContext.Provider value={value}>{children}</EventFinanceContext.Provider>;
}

export function useEventFinance() {
  const context = useContext(EventFinanceContext);
  if (!context) throw new Error('useEventFinance must be used within EventFinanceProvider');
  return context;
}
