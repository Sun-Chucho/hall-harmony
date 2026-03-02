import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
    reference?: string;
    notes?: string;
  }) => { ok: boolean; message: string; transferId?: string };
  recordCashDistribution: (input: {
    category: CashDistributionCategory;
    amount: number;
    reason: string;
    otherDetails?: string;
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

function generateReference(prefix: string) {
  return `${prefix}-${Date.now()}`;
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
  const lastSyncedStateRef = useRef('');
  const pendingRemoteWriteRef = useRef(false);

  const serializeState = useCallback((input: {
    budgets: EventBudget[];
    allocations: AllocationRequest[];
    distributions: ExpenseDistribution[];
    cashTransfers: CashTransfer[];
    mdTransfers: ManagingDirectorTransfer[];
    cashDistributions: CashDistributionRecord[];
    logs: EventFinanceLog[];
  }) => JSON.stringify(input), []);

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
      lastSyncedStateRef.current = '';
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
        const nextState = {
          budgets: Array.isArray(data?.budgets) ? data.budgets : [],
          allocations: Array.isArray(data?.allocations) ? data.allocations : [],
          distributions: Array.isArray(data?.distributions) ? data.distributions : [],
          cashTransfers: Array.isArray(data?.cashTransfers) ? data.cashTransfers : [],
          mdTransfers: Array.isArray(data?.mdTransfers) ? data.mdTransfers : [],
          cashDistributions: Array.isArray(data?.cashDistributions) ? data.cashDistributions : [],
          logs: Array.isArray(data?.logs) ? data.logs : [],
        };
        const serialized = serializeState(nextState);
        if (serialized !== lastSyncedStateRef.current) {
          setBudgets(nextState.budgets);
          setAllocations(nextState.allocations);
          setDistributions(nextState.distributions);
          setCashTransfers(nextState.cashTransfers);
          setMdTransfers(nextState.mdTransfers);
          setCashDistributions(nextState.cashDistributions);
          setLogs(nextState.logs);
          lastSyncedStateRef.current = serialized;
        }
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
    if (!pendingRemoteWriteRef.current) return;
    pendingRemoteWriteRef.current = false;
    const serialized = serializeState({
      budgets,
      allocations,
      distributions,
      cashTransfers,
      mdTransfers,
      cashDistributions,
      logs,
    });
    if (serialized === lastSyncedStateRef.current) return;
    lastSyncedStateRef.current = serialized;
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

  const persistFinanceState = useCallback((overrides?: {
    budgets?: EventBudget[];
    allocations?: AllocationRequest[];
    distributions?: ExpenseDistribution[];
    cashTransfers?: CashTransfer[];
    mdTransfers?: ManagingDirectorTransfer[];
    cashDistributions?: CashDistributionRecord[];
    logs?: EventFinanceLog[];
  }) => {
    const payload = {
      budgets: overrides?.budgets ?? budgets,
      allocations: overrides?.allocations ?? allocations,
      distributions: overrides?.distributions ?? distributions,
      cashTransfers: overrides?.cashTransfers ?? cashTransfers,
      mdTransfers: overrides?.mdTransfers ?? mdTransfers,
      cashDistributions: overrides?.cashDistributions ?? cashDistributions,
      logs: overrides?.logs ?? logs,
    };
    pendingRemoteWriteRef.current = true;
    localStorage.setItem(EVENT_FINANCE_CACHE_KEY, JSON.stringify(payload));
  }, [allocations, budgets, cashDistributions, cashTransfers, distributions, logs, mdTransfers]);

  const appendLog = useCallback((action: string, referenceId: string, detail: string) => {
    if (!user) return;
    pendingRemoteWriteRef.current = true;
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
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, message: 'Requested amount must be greater than zero.' };
    }
    const requestedAmount = Math.round(input.amount);

    const transfer: CashTransfer = {
      id: `CASH-MOVE-${crypto.randomUUID()}`,
      requestedAmount,
      approvedAmount: 0,
      requestComment: input.comment.trim(),
      decisionComment: '',
      receiveComment: '',
      initiatedByUserId: user.id,
      initiatedByRole: user.role === 'controller' ? 'cashier_2' : user.role,
      requestedAt: new Date().toISOString(),
      status: 'pending_cashier_1_approval',
    };
    const nextCashTransfers = [transfer, ...cashTransfers];
    setCashTransfers(nextCashTransfers);
    persistFinanceState({ cashTransfers: nextCashTransfers });
    appendLog('cash_move.requested', transfer.id, `Cashier 2 requested TZS ${requestedAmount.toLocaleString()}`);
    return { ok: true, message: 'Cash request sent to Cashier 1.', requestId: transfer.id };
  }, [appendLog, cashTransfers, persistFinanceState, user]);

  const sendCashToCashier2 = useCallback((input: { amount: number; comment: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can send cash to Cashier 2.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    const requestedAmount = Math.round(input.amount);

    const transfer: CashTransfer = {
      id: `CASH-MOVE-${crypto.randomUUID()}`,
      requestedAmount,
      approvedAmount: requestedAmount,
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
    const nextCashTransfers = [transfer, ...cashTransfers];
    setCashTransfers(nextCashTransfers);
    persistFinanceState({ cashTransfers: nextCashTransfers });
    appendLog('cash_move.sent', transfer.id, `Cashier 1 sent TZS ${requestedAmount.toLocaleString()} to Cashier 2`);
    return { ok: true, message: 'Cash sent. Waiting for Cashier 2 confirmation.', transferId: transfer.id };
  }, [appendLog, cashTransfers, persistFinanceState, user]);

  const approveCashTransferRequest = useCallback((transferId: string, approvedAmount: number, decisionComment: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can approve cash requests.' };
    }
    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) return { ok: false, message: 'Approved amount must be greater than zero.' };
    const normalizedApprovedAmount = Math.round(approvedAmount);

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash request not found.' };
    if (target.status !== 'pending_cashier_1_approval') {
      return { ok: false, message: 'Only pending requests can be approved.' };
    }

    const nextCashTransfers = cashTransfers.map((item) =>
      item.id === transferId
        ? {
            ...item,
            approvedAmount: normalizedApprovedAmount,
            decisionComment: decisionComment.trim(),
            decidedAt: new Date().toISOString(),
            decidedByUserId: user.id,
            sentAt: new Date().toISOString(),
            sentByUserId: user.id,
            status: 'sent_to_cashier_2' as const,
          }
        : item,
    );
    setCashTransfers(nextCashTransfers);
    persistFinanceState({ cashTransfers: nextCashTransfers });
    appendLog('cash_move.approved', transferId, `Cash request approved for TZS ${normalizedApprovedAmount.toLocaleString()}`);
    return { ok: true, message: 'Request approved and cash sent to Cashier 2.' };
  }, [appendLog, cashTransfers, persistFinanceState, user]);

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

    const nextCashTransfers = cashTransfers.map((item) =>
      item.id === transferId
        ? {
            ...item,
            decisionComment: decisionComment.trim(),
            decidedAt: new Date().toISOString(),
            decidedByUserId: user.id,
            status: 'declined_by_cashier_1' as const,
          }
        : item,
    );
    setCashTransfers(nextCashTransfers);
    persistFinanceState({ cashTransfers: nextCashTransfers });
    appendLog('cash_move.declined', transferId, 'Cash request declined by Cashier 1');
    return { ok: true, message: 'Request declined.' };
  }, [appendLog, cashTransfers, persistFinanceState, user]);

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

    const nextCashTransfers = cashTransfers.map((item) =>
      item.id === transferId
        ? {
            ...item,
            receiveComment: receiveComment.trim(),
            receivedAt: new Date().toISOString(),
            receivedByUserId: user.id,
            status: 'received_by_cashier_2' as const,
          }
        : item,
    );
    setCashTransfers(nextCashTransfers);
    persistFinanceState({ cashTransfers: nextCashTransfers });
    appendLog('cash_move.received', transferId, 'Cashier 2 confirmed receipt');
    return { ok: true, message: 'Cash receipt confirmed.' };
  }, [appendLog, cashTransfers, persistFinanceState, user]);

  const recordManagingDirectorTransfer = useCallback((input: { amount: number; reference?: string; notes?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can record MD transfers.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    const amount = Math.round(input.amount);
    const reference = input.reference?.trim() || generateReference('MDTRF');

    const transfer: ManagingDirectorTransfer = {
      id: generateReference('MD-TRANSFER'),
      amount,
      reference,
      notes: input.notes?.trim() ?? '',
      transferredAt: new Date().toISOString(),
      transferredByUserId: user.id,
    };
    const nextTransfers = [transfer, ...mdTransfers];
    setMdTransfers(nextTransfers);
    persistFinanceState({ mdTransfers: nextTransfers });
    appendLog('md_transfer.recorded', transfer.id, `TZS ${amount.toLocaleString()} moved to Managing Director`);
    return { ok: true, message: 'Managing Director transfer recorded.', transferId: transfer.id };
  }, [appendLog, mdTransfers, persistFinanceState, user]);

  const recordCashDistribution = useCallback((input: {
    category: CashDistributionCategory;
    amount: number;
    reason: string;
    otherDetails?: string;
  }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1, Cashier 2, or Controller can record cash distributions.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    const amount = Math.round(input.amount);
    if (!input.reason.trim()) return { ok: false, message: 'Reason is required.' };
    const customCategoryLabel = input.category === 'other' ? (input.otherDetails?.trim() ?? '') : '';
    if (input.category === 'other' && !customCategoryLabel) {
      return { ok: false, message: 'Enter details for Others category.' };
    }

    const record: CashDistributionRecord = {
      id: `CDIST-${Date.now()}`,
      category: input.category,
      customCategoryLabel: customCategoryLabel || undefined,
      amount,
      reason: input.reason.trim(),
      distributedAt: new Date().toISOString(),
      distributedByUserId: user.id,
    };
    const nextDistributions = [record, ...cashDistributions];
    setCashDistributions(nextDistributions);
    persistFinanceState({ cashDistributions: nextDistributions });
    appendLog('cash_distribution.recorded', record.id, `${input.category} TZS ${amount.toLocaleString()}`);
    return { ok: true, message: 'Cash distribution recorded.', distributionId: record.id };
  }, [appendLog, cashDistributions, persistFinanceState, policy.transactionsFrozen, user]);

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
