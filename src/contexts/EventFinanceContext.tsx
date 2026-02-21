import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { usePayments } from '@/contexts/PaymentContext';
import { db } from '@/lib/firebase';
import {
  AllocationRequest,
  BudgetCategory,
  CashTransfer,
  CashDistributionCategory,
  CashDistributionRecord,
  EventBudget,
  EventFinanceLog,
  ExpenseDistribution,
  ManagingDirectorTransfer,
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
  cashTransfers: CashTransfer[];
  mdTransfers: ManagingDirectorTransfer[];
  cashDistributions: CashDistributionRecord[];
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
  requestCashTransferFromCashier2: (input: { amount: number; comment: string }) => { ok: boolean; message: string; requestId?: string };
  sendCashToCashier2: (input: { amount: number; comment: string }) => { ok: boolean; message: string; transferId?: string };
  approveCashTransferRequest: (
    transferId: string,
    approvedAmount: number,
    decisionComment: string,
  ) => { ok: boolean; message: string };
  declineCashTransferRequest: (transferId: string, decisionComment: string) => { ok: boolean; message: string };
  confirmCashTransferReceived: (transferId: string, receiveComment: string) => { ok: boolean; message: string };
  recordManagingDirectorTransfer: (input: {
    amount: number;
    reference: string;
    notes?: string;
  }) => { ok: boolean; message: string; transferId?: string };
  recordCashDistribution: (input: {
    category: CashDistributionCategory;
    amount: number;
    reason: string;
  }) => { ok: boolean; message: string; distributionId?: string };
  getAllocationSummary: (requestId: string) => { requested: number; distributed: number; remaining: number };
  generateExpenseSheet: (requestId: string) => { ok: boolean; message: string; sheet?: string };
}

const EventFinanceContext = createContext<EventFinanceContextValue | undefined>(undefined);
const EVENT_FINANCE_STATE_REF = doc(db, 'system_state', 'event_finance');
const EVENT_FINANCE_CACHE_KEY = 'kuringe_event_finance_cache_v1';

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
  const [cashTransfers, setCashTransfers] = useState<CashTransfer[]>([]);
  const [mdTransfers, setMdTransfers] = useState<ManagingDirectorTransfer[]>([]);
  const [cashDistributions, setCashDistributions] = useState<CashDistributionRecord[]>([]);
  const [logs, setLogs] = useState<EventFinanceLog[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(EVENT_FINANCE_CACHE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        budgets?: EventBudget[];
        allocations?: AllocationRequest[];
        distributions?: ExpenseDistribution[];
        cashTransfers?: CashTransfer[];
        mdTransfers?: ManagingDirectorTransfer[];
        cashDistributions?: CashDistributionRecord[];
        logs?: EventFinanceLog[];
      };
      setBudgets(Array.isArray(data.budgets) ? data.budgets : []);
      setAllocations(Array.isArray(data.allocations) ? data.allocations : []);
      setDistributions(Array.isArray(data.distributions) ? data.distributions : []);
      setCashTransfers(Array.isArray(data.cashTransfers) ? data.cashTransfers : []);
      setMdTransfers(Array.isArray(data.mdTransfers) ? data.mdTransfers : []);
      setCashDistributions(Array.isArray(data.cashDistributions) ? data.cashDistributions : []);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      localStorage.removeItem(EVENT_FINANCE_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      EVENT_FINANCE_CACHE_KEY,
      JSON.stringify({
        budgets,
        allocations,
        distributions,
        cashTransfers,
        mdTransfers,
        cashDistributions,
        logs,
      }),
    );
  }, [allocations, budgets, cashDistributions, cashTransfers, distributions, logs, mdTransfers]);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setAllocations([]);
      setDistributions([]);
      setCashTransfers([]);
      setMdTransfers([]);
      setCashDistributions([]);
      setLogs([]);
      setHydrated(false);
      return;
    }

    const unsub = onSnapshot(
      EVENT_FINANCE_STATE_REF,
      (snapshot) => {
        const data = snapshot.data() as {
          budgets?: EventBudget[];
          allocations?: AllocationRequest[];
          distributions?: ExpenseDistribution[];
          cashTransfers?: CashTransfer[];
          mdTransfers?: ManagingDirectorTransfer[];
          cashDistributions?: CashDistributionRecord[];
          logs?: EventFinanceLog[];
        } | undefined;
        setBudgets(Array.isArray(data?.budgets) ? data.budgets : []);
        setAllocations(Array.isArray(data?.allocations) ? data.allocations : []);
        setDistributions(Array.isArray(data?.distributions) ? data.distributions : []);
        setCashTransfers(Array.isArray(data?.cashTransfers) ? data.cashTransfers : []);
        setMdTransfers(Array.isArray(data?.mdTransfers) ? data.mdTransfers : []);
        setCashDistributions(Array.isArray(data?.cashDistributions) ? data.cashDistributions : []);
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setHydrated(true);
      },
      () => {
        const raw = localStorage.getItem(EVENT_FINANCE_CACHE_KEY);
        if (raw) {
          try {
            const data = JSON.parse(raw) as {
              budgets?: EventBudget[];
              allocations?: AllocationRequest[];
              distributions?: ExpenseDistribution[];
              cashTransfers?: CashTransfer[];
              mdTransfers?: ManagingDirectorTransfer[];
              cashDistributions?: CashDistributionRecord[];
              logs?: EventFinanceLog[];
            };
            setBudgets(Array.isArray(data.budgets) ? data.budgets : []);
            setAllocations(Array.isArray(data.allocations) ? data.allocations : []);
            setDistributions(Array.isArray(data.distributions) ? data.distributions : []);
            setCashTransfers(Array.isArray(data.cashTransfers) ? data.cashTransfers : []);
            setMdTransfers(Array.isArray(data.mdTransfers) ? data.mdTransfers : []);
            setCashDistributions(Array.isArray(data.cashDistributions) ? data.cashDistributions : []);
            setLogs(Array.isArray(data.logs) ? data.logs : []);
          } catch {
            localStorage.removeItem(EVENT_FINANCE_CACHE_KEY);
          }
        }
        setHydrated(true);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !hydrated) return;
    void setDoc(
      EVENT_FINANCE_STATE_REF,
      {
        budgets,
        allocations,
        distributions,
        cashTransfers,
        mdTransfers,
        cashDistributions,
        logs,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [allocations, budgets, cashDistributions, cashTransfers, distributions, hydrated, logs, mdTransfers, user]);

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

  const requestCashTransferFromCashier2 = useCallback((input: { amount: number; comment: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can request cash.' };
    }
    if (input.amount <= 0) return { ok: false, message: 'Requested amount must be greater than zero.' };

    const transfer: CashTransfer = {
      id: `CASH-MOVE-${Date.now()}`,
      requestedAmount: input.amount,
      approvedAmount: 0,
      requestComment: input.comment.trim(),
      decisionComment: '',
      receiveComment: '',
      initiatedByUserId: user.id,
      initiatedByRole: user.role === 'controller' ? 'cashier_2' : user.role,
      requestedAt: new Date().toISOString(),
      status: 'pending_cashier_1_approval',
    };
    setCashTransfers((prev) => [transfer, ...prev]);
    appendLog('cash_move.requested', transfer.id, `Cashier 2 requested TZS ${input.amount.toLocaleString()}`);
    return { ok: true, message: 'Cash request sent to Cashier 1.', requestId: transfer.id };
  }, [appendLog, user]);

  const sendCashToCashier2 = useCallback((input: { amount: number; comment: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can send cash to Cashier 2.' };
    }
    if (input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };

    const transfer: CashTransfer = {
      id: `CASH-MOVE-${Date.now()}`,
      requestedAmount: input.amount,
      approvedAmount: input.amount,
      requestComment: input.comment.trim(),
      decisionComment: 'Direct transfer by Cashier 1',
      receiveComment: '',
      initiatedByUserId: user.id,
      initiatedByRole: 'cashier_1',
      requestedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      decidedByUserId: user.id,
      sentAt: new Date().toISOString(),
      sentByUserId: user.id,
      status: 'sent_to_cashier_2',
    };
    setCashTransfers((prev) => [transfer, ...prev]);
    appendLog('cash_move.sent', transfer.id, `Cashier 1 sent TZS ${input.amount.toLocaleString()} to Cashier 2`);
    return { ok: true, message: 'Cash sent. Waiting for Cashier 2 confirmation.', transferId: transfer.id };
  }, [appendLog, user]);

  const approveCashTransferRequest = useCallback((transferId: string, approvedAmount: number, decisionComment: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can approve cash requests.' };
    }
    if (approvedAmount <= 0) return { ok: false, message: 'Approved amount must be greater than zero.' };

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash request not found.' };
    if (target.status !== 'pending_cashier_1_approval') {
      return { ok: false, message: 'Only pending requests can be approved.' };
    }

    setCashTransfers((prev) =>
      prev.map((item) =>
        item.id === transferId
          ? {
              ...item,
              approvedAmount,
              decisionComment: decisionComment.trim(),
              decidedAt: new Date().toISOString(),
              decidedByUserId: user.id,
              sentAt: new Date().toISOString(),
              sentByUserId: user.id,
              status: 'sent_to_cashier_2',
            }
          : item,
      ),
    );
    appendLog('cash_move.approved', transferId, `Cash request approved for TZS ${approvedAmount.toLocaleString()}`);
    return { ok: true, message: 'Request approved and cash sent to Cashier 2.' };
  }, [appendLog, cashTransfers, user]);

  const declineCashTransferRequest = useCallback((transferId: string, decisionComment: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can decline cash requests.' };
    }

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash request not found.' };
    if (target.status !== 'pending_cashier_1_approval') {
      return { ok: false, message: 'Only pending requests can be declined.' };
    }

    setCashTransfers((prev) =>
      prev.map((item) =>
        item.id === transferId
          ? {
              ...item,
              decisionComment: decisionComment.trim(),
              decidedAt: new Date().toISOString(),
              decidedByUserId: user.id,
              status: 'declined_by_cashier_1',
            }
          : item,
      ),
    );
    appendLog('cash_move.declined', transferId, 'Cash request declined by Cashier 1');
    return { ok: true, message: 'Request declined.' };
  }, [appendLog, cashTransfers, user]);

  const confirmCashTransferReceived = useCallback((transferId: string, receiveComment: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can confirm receipt.' };
    }

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash transfer not found.' };
    if (target.status !== 'sent_to_cashier_2') {
      return { ok: false, message: 'Transfer is not awaiting receipt confirmation.' };
    }

    setCashTransfers((prev) =>
      prev.map((item) =>
        item.id === transferId
          ? {
              ...item,
              receiveComment: receiveComment.trim(),
              receivedAt: new Date().toISOString(),
              receivedByUserId: user.id,
              status: 'received_by_cashier_2',
            }
          : item,
      ),
    );
    appendLog('cash_move.received', transferId, 'Cashier 2 confirmed receipt');
    return { ok: true, message: 'Cash receipt confirmed.' };
  }, [appendLog, cashTransfers, user]);

  const recordManagingDirectorTransfer = useCallback((input: { amount: number; reference: string; notes?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can record MD transfers.' };
    }
    if (input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    if (!input.reference.trim()) return { ok: false, message: 'Reference is required.' };

    const transfer: ManagingDirectorTransfer = {
      id: `MD-TRANSFER-${Date.now()}`,
      amount: input.amount,
      reference: input.reference.trim(),
      notes: input.notes?.trim() ?? '',
      transferredAt: new Date().toISOString(),
      transferredByUserId: user.id,
    };
    setMdTransfers((prev) => [transfer, ...prev]);
    appendLog('md_transfer.recorded', transfer.id, `TZS ${input.amount.toLocaleString()} moved to Managing Director`);
    return { ok: true, message: 'Managing Director transfer recorded.', transferId: transfer.id };
  }, [appendLog, user]);

  const recordCashDistribution = useCallback((input: {
    category: CashDistributionCategory;
    amount: number;
    reason: string;
  }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 2 or Controller can record cash distributions.' };
    }
    if (input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    if (!input.reason.trim()) return { ok: false, message: 'Reason is required.' };

    const record: CashDistributionRecord = {
      id: `CDIST-${Date.now()}`,
      category: input.category,
      amount: input.amount,
      reason: input.reason.trim(),
      distributedAt: new Date().toISOString(),
      distributedByUserId: user.id,
    };
    setCashDistributions((prev) => [record, ...prev]);
    appendLog('cash_distribution.recorded', record.id, `${input.category} TZS ${input.amount.toLocaleString()}`);
    return { ok: true, message: 'Cash distribution recorded.', distributionId: record.id };
  }, [appendLog, user]);

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
    cashTransfers,
    mdTransfers,
    cashDistributions,
    logs,
    createBudget,
    requestAllocation,
    controllerDecision,
    releaseFunds,
    addDistribution,
    requestCashTransferFromCashier2,
    sendCashToCashier2,
    approveCashTransferRequest,
    declineCashTransferRequest,
    confirmCashTransferReceived,
    recordManagingDirectorTransfer,
    recordCashDistribution,
    getAllocationSummary,
    generateExpenseSheet,
  }), [
    addDistribution,
    allocations,
    approveCashTransferRequest,
    budgets,
    cashTransfers,
    confirmCashTransferReceived,
    controllerDecision,
    createBudget,
    declineCashTransferRequest,
    distributions,
    generateExpenseSheet,
    getAllocationSummary,
    cashDistributions,
    logs,
    mdTransfers,
    recordCashDistribution,
    recordManagingDirectorTransfer,
    releaseFunds,
    requestCashTransferFromCashier2,
    requestAllocation,
    sendCashToCashier2,
  ]);

  return <EventFinanceContext.Provider value={value}>{children}</EventFinanceContext.Provider>;
}

export function useEventFinance() {
  const context = useContext(EventFinanceContext);
  if (!context) throw new Error('useEventFinance must be used within EventFinanceProvider');
  return context;
}
