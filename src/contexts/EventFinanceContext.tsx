import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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

interface BudgetInput { actionId?: string; bookingId: string; notes?: string; categories: Record<BudgetCategory, number>; }
interface AllocationInput { actionId?: string; budgetId: string; requestedAmount: number; purpose: string; }
interface DistributionInput { actionId?: string; allocationRequestId: string; category: BudgetCategory; amount: number; description: string; proofReference?: string; }

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
  controllerDecision: (requestId: string, decision: 'approved' | 'rejected', comment: string) => { ok: boolean; message: string };
  releaseFunds: (requestId: string, releaseReference: string) => { ok: boolean; message: string };
  addDistribution: (input: DistributionInput) => { ok: boolean; message: string; distributionId?: string };
  requestCashTransferFromCashier2: (input: { amount: number; comment: string; actionId?: string }) => { ok: boolean; message: string; requestId?: string };
  sendCashToCashier2: (input: { amount: number; comment: string; actionId?: string }) => { ok: boolean; message: string; transferId?: string };
  approveCashTransferRequest: (transferId: string, approvedAmount: number, decisionComment: string, actionId?: string) => { ok: boolean; message: string };
  declineCashTransferRequest: (transferId: string, decisionComment: string, actionId?: string) => { ok: boolean; message: string };
  confirmCashTransferReceived: (transferId: string, receiveComment: string, actionId?: string) => { ok: boolean; message: string };
  recordManagingDirectorTransfer: (input: { actionId?: string; amount: number; reference?: string; notes?: string }) => { ok: boolean; message: string; transferId?: string };
  recordCashDistribution: (input: { actionId?: string; category: CashDistributionCategory; amount: number; reason: string; otherDetails?: string }) => { ok: boolean; message: string; distributionId?: string };
  getAllocationSummary: (requestId: string) => { requested: number; distributed: number; remaining: number };
  generateExpenseSheet: (requestId: string) => { ok: boolean; message: string; sheet?: string };
}

const EventFinanceContext = createContext<EventFinanceContextValue | undefined>(undefined);
const BUDGETS_COLLECTION = 'event_budgets';
const ALLOCATIONS_COLLECTION = 'event_allocations';
const DISTRIBUTIONS_COLLECTION = 'event_distributions';
const CASH_TRANSFERS_COLLECTION = 'cash_transfers';
const MD_TRANSFERS_COLLECTION = 'md_transfers';
const CASH_DISTRIBUTIONS_COLLECTION = 'cash_distributions';

function sumBudget(categories: Record<BudgetCategory, number>): number { return Object.values(categories).reduce((sum, amount) => sum + (Number(amount) || 0), 0); }
function generateReference(prefix: string) { return `${prefix}-${Date.now()}`; }
function normalizeActionId(value?: string): string { return (value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64); }

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
  const [logs] = useState<EventFinanceLog[]>([]);

  useEffect(() => {
    if (!user) { setBudgets([]); return; }
    const unsub = onSnapshot(query(collection(db, BUDGETS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<EventBudget, 'id'>) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBudgets(next);
    }, () => setBudgets([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setAllocations([]); return; }
    const unsub = onSnapshot(query(collection(db, ALLOCATIONS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AllocationRequest, 'id'>) }))
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setAllocations(next);
    }, () => setAllocations([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setDistributions([]); return; }
    const unsub = onSnapshot(query(collection(db, DISTRIBUTIONS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ExpenseDistribution, 'id'>) }))
        .sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
      setDistributions(next);
    }, () => setDistributions([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setCashTransfers([]); return; }
    const unsub = onSnapshot(query(collection(db, CASH_TRANSFERS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CashTransfer, 'id'>) }))
        .sort((a, b) => new Date((b.receivedAt ?? b.sentAt ?? b.requestedAt)).getTime() - new Date((a.receivedAt ?? a.sentAt ?? a.requestedAt)).getTime());
      setCashTransfers(next);
    }, () => setCashTransfers([]));
    return () => unsub();
  }, [user]);
  useEffect(() => {
    if (!user) { setMdTransfers([]); return; }
    const unsub = onSnapshot(query(collection(db, MD_TRANSFERS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ManagingDirectorTransfer, 'id'>) }))
        .sort((a, b) => new Date(b.transferredAt).getTime() - new Date(a.transferredAt).getTime());
      setMdTransfers(next);
    }, () => setMdTransfers([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setCashDistributions([]); return; }
    const unsub = onSnapshot(query(collection(db, CASH_DISTRIBUTIONS_COLLECTION), limit(3000)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CashDistributionRecord, 'id'>) }))
        .sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
      setCashDistributions(next);
    }, () => setCashDistributions([]));
    return () => unsub();
  }, [user]);

  const appendLog = useCallback((action: string, referenceId: string, detail: string) => { void action; void referenceId; void detail; }, []);
  const findBooking = useCallback((bookingId: string) => bookings.find((booking) => booking.id === bookingId), [bookings]);

  const createBudget = useCallback((input: BudgetInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 2 or Controller can create event budgets.' };
    if (policy.transactionsFrozen && user.role !== 'controller') return { ok: false, message: 'Transactions are frozen by controller.' };

    const booking = findBooking(input.bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.bookingStatus !== 'approved') return { ok: false, message: 'Budget can only be created for approved bookings.' };

    const totalAmount = sumBudget(input.categories);
    if (totalAmount <= 0) return { ok: false, message: 'Budget total must be greater than zero.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateBudget = budgets.find((entry) => entry.clientActionId === actionId);
    if (duplicateBudget) return { ok: true, message: 'Budget already submitted.', budgetId: duplicateBudget.id };

    const existing = budgets.find((item) => item.bookingId === input.bookingId);
    if (existing) {
      const updated: EventBudget = { ...existing, categories: input.categories, totalAmount, notes: input.notes?.trim() ?? '' };
      setBudgets((prev) => prev.map((item) => (item.id === existing.id ? updated : item)));
      void setDoc(doc(db, BUDGETS_COLLECTION, existing.id), { ...updated, updatedAt: serverTimestamp() }, { merge: true });
      appendLog('budget.updated', existing.id, `Budget updated for booking ${input.bookingId}`);
      return { ok: true, message: 'Event budget updated.', budgetId: existing.id };
    }

    const budget: EventBudget = {
      id: `BUD-${Date.now()}`,
      clientActionId: actionId,
      bookingId: input.bookingId,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      categories: input.categories,
      totalAmount,
      notes: input.notes?.trim() ?? '',
    };
    setBudgets((prev) => [budget, ...prev]);
    void setDoc(doc(db, BUDGETS_COLLECTION, budget.id), { ...budget, updatedAt: serverTimestamp() }, { merge: true });
    appendLog('budget.created', budget.id, `Budget created for booking ${input.bookingId}`);
    return { ok: true, message: 'Event budget created.', budgetId: budget.id };
  }, [appendLog, budgets, findBooking, policy.transactionsFrozen, user]);

  const requestAllocation = useCallback((input: AllocationInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 2 or Controller can request allocations.' };
    if (policy.transactionsFrozen && user.role !== 'controller') return { ok: false, message: 'Transactions are frozen by controller.' };
    const budget = budgets.find((item) => item.id === input.budgetId);
    if (!budget) return { ok: false, message: 'Budget not found.' };
    if (input.requestedAmount <= 0) return { ok: false, message: 'Requested amount must be greater than zero.' };
    if (!input.purpose.trim()) return { ok: false, message: 'Purpose is required.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateRequest = allocations.find((entry) => entry.clientActionId === actionId);
    if (duplicateRequest) return { ok: true, message: 'Allocation already submitted.', requestId: duplicateRequest.id };

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
      clientActionId: actionId,
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
    void setDoc(doc(db, ALLOCATIONS_COLLECTION, request.id), { ...request, updatedAt: serverTimestamp() }, { merge: true });
    appendLog('allocation.requested', request.id, `Allocation requested for ${budget.bookingId}`);
    return { ok: true, message: 'Allocation request submitted for controller approval.', requestId: request.id };
  }, [allocations, appendLog, budgets, createApprovalRequest, policy.transactionsFrozen, user]);
  const controllerDecision = useCallback((requestId: string, decision: 'approved' | 'rejected', comment: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'controller') return { ok: false, message: 'Only Controller can decide allocation requests.' };
    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'pending_controller') return { ok: false, message: 'Request is not pending controller decision.' };
    if (!request.approvalId) return { ok: false, message: 'Missing approval reference.' };

    const review = reviewApproval(request.approvalId, decision, comment || 'Controller decision');
    if (!review.ok) return { ok: false, message: review.message };

    const patch = {
      status: decision === 'approved' ? 'approved_controller' : 'rejected_controller',
      controllerDecisionAt: new Date().toISOString(),
      controllerComment: comment.trim(),
    } as const;
    const updated = { ...request, ...patch };
    setAllocations((prev) => prev.map((item) => (item.id === requestId ? updated : item)));
    void setDoc(doc(db, ALLOCATIONS_COLLECTION, requestId), { ...updated, updatedAt: serverTimestamp() }, { merge: true });
    appendLog(decision === 'approved' ? 'allocation.approved' : 'allocation.rejected', requestId, comment || 'Controller decision recorded');
    return { ok: true, message: `Allocation ${decision} by controller.` };
  }, [allocations, appendLog, reviewApproval, user]);

  const releaseFunds = useCallback((requestId: string, releaseReference: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1 or Controller can release funds.' };
    if (!releaseReference.trim()) return { ok: false, message: 'Release reference is required.' };

    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'approved_controller') return { ok: false, message: 'Allocation must be controller-approved before release.' };

    const financials = getBookingFinancials(request.bookingId);
    if (financials.totalPaid < request.requestedAmount) return { ok: false, message: 'Insufficient received funds for this release.' };

    const updated: AllocationRequest = {
      ...request,
      status: 'funds_released',
      releasedAt: new Date().toISOString(),
      releasedByUserId: user.id,
      releaseReference: releaseReference.trim(),
    };
    setAllocations((prev) => prev.map((item) => (item.id === requestId ? updated : item)));
    void setDoc(doc(db, ALLOCATIONS_COLLECTION, requestId), { ...updated, updatedAt: serverTimestamp() }, { merge: true });
    appendLog('allocation.released', requestId, `Funds released with reference ${releaseReference.trim()}`);
    return { ok: true, message: 'Funds released to Cashier 2 for distribution.' };
  }, [allocations, appendLog, getBookingFinancials, user]);

  const getAllocationSummary = useCallback((requestId: string) => {
    const request = allocations.find((item) => item.id === requestId);
    if (!request) return { requested: 0, distributed: 0, remaining: 0 };
    const distributed = distributions.filter((item) => item.allocationRequestId === requestId).reduce((sum, item) => sum + item.amount, 0);
    return { requested: request.requestedAmount, distributed, remaining: Math.max(request.requestedAmount - distributed, 0) };
  }, [allocations, distributions]);

  const addDistribution = useCallback((input: DistributionInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 2 or Controller can distribute funds.' };
    if (policy.transactionsFrozen && user.role !== 'controller') return { ok: false, message: 'Transactions are frozen by controller.' };
    const request = allocations.find((item) => item.id === input.allocationRequestId);
    if (!request) return { ok: false, message: 'Allocation request not found.' };
    if (request.status !== 'funds_released') return { ok: false, message: 'Funds must be released before distribution.' };
    if (input.amount <= 0) return { ok: false, message: 'Distribution amount must be greater than zero.' };
    if (!input.description.trim()) return { ok: false, message: 'Distribution description is required.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateDistribution = distributions.find((entry) => entry.clientActionId === actionId);
    if (duplicateDistribution) return { ok: true, message: 'Distribution already recorded.', distributionId: duplicateDistribution.id };

    const summary = getAllocationSummary(request.id);
    if (input.amount > summary.remaining) return { ok: false, message: 'Distribution exceeds remaining allocation balance.' };

    const distribution: ExpenseDistribution = {
      id: `DIST-${Date.now()}`,
      clientActionId: actionId,
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
    void setDoc(doc(db, DISTRIBUTIONS_COLLECTION, distribution.id), { ...distribution, updatedAt: serverTimestamp() }, { merge: true });

    if (summary.remaining - input.amount <= 0) {
      const closed: AllocationRequest = { ...request, status: 'closed' };
      setAllocations((prev) => prev.map((item) => (item.id === request.id ? closed : item)));
      void updateDoc(doc(db, ALLOCATIONS_COLLECTION, request.id), { status: 'closed', updatedAt: serverTimestamp() });
    }
    appendLog('distribution.recorded', distribution.id, `Expense distribution added to ${input.category}`);
    return { ok: true, message: 'Expense distribution recorded.', distributionId: distribution.id };
  }, [allocations, appendLog, distributions, getAllocationSummary, policy.transactionsFrozen, user]);

  const persistCashTransferEvent = useCallback((transfer: CashTransfer) => {
    void setDoc(doc(db, CASH_TRANSFERS_COLLECTION, transfer.id), { ...transfer, updatedAt: serverTimestamp() }, { merge: true });
  }, []);
  const requestCashTransferFromCashier2 = useCallback((input: { amount: number; comment: string; actionId?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 2 or Controller can request cash.' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Requested amount must be greater than zero.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateTransfer = cashTransfers.find((entry) => entry.clientActionId === actionId);
    if (duplicateTransfer) return { ok: true, message: 'Cash request already submitted.', requestId: duplicateTransfer.id };

    const requestedAmount = Math.round(input.amount);
    const transfer: CashTransfer = {
      id: actionId ? `CASH-MOVE-ACT-${actionId}` : `CASH-MOVE-${crypto.randomUUID()}`,
      clientActionId: actionId,
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
    setCashTransfers((prev) => [transfer, ...prev]);
    persistCashTransferEvent(transfer);
    appendLog('cash_move.requested', transfer.id, `Cashier 2 requested TZS ${requestedAmount.toLocaleString()}`);
    return { ok: true, message: 'Cash request sent to Cashier 1.', requestId: transfer.id };
  }, [appendLog, cashTransfers, persistCashTransferEvent, user]);

  const sendCashToCashier2 = useCallback((input: { amount: number; comment: string; actionId?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1 or Controller can send cash to Cashier 2.' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateTransfer = cashTransfers.find((entry) => entry.clientActionId === actionId);
    if (duplicateTransfer) return { ok: true, message: 'Cash transfer already submitted.', transferId: duplicateTransfer.id };

    const requestedAmount = Math.round(input.amount);
    const transfer: CashTransfer = {
      id: actionId ? `CASH-MOVE-ACT-${actionId}` : `CASH-MOVE-${crypto.randomUUID()}`,
      clientActionId: actionId,
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
    setCashTransfers((prev) => [transfer, ...prev]);
    persistCashTransferEvent(transfer);
    appendLog('cash_move.sent', transfer.id, `Cashier 1 sent TZS ${requestedAmount.toLocaleString()} to Cashier 2`);
    return { ok: true, message: 'Cash sent. Waiting for Cashier 2 confirmation.', transferId: transfer.id };
  }, [appendLog, cashTransfers, persistCashTransferEvent, user]);

  const approveCashTransferRequest = useCallback((transferId: string, approvedAmount: number, decisionComment: string, actionId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1 or Controller can approve cash requests.' };
    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) return { ok: false, message: 'Approved amount must be greater than zero.' };

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash request not found.' };
    if (target.status !== 'pending_cashier_1_approval') return { ok: false, message: 'Only pending requests can be approved.' };

    const normalizedActionId = normalizeActionId(actionId);
    if (normalizedActionId && cashTransfers.some((entry) => entry.clientActionId === normalizedActionId)) return { ok: true, message: 'Approval already submitted.' };

    const updated: CashTransfer = {
      ...target,
      clientActionId: normalizedActionId || target.clientActionId,
      approvedAmount: Math.round(approvedAmount),
      decisionComment: decisionComment.trim(),
      decidedAt: new Date().toISOString(),
      decidedByUserId: user.id,
      sentAt: new Date().toISOString(),
      sentByUserId: user.id,
      status: 'sent_to_cashier_2',
    };
    setCashTransfers((prev) => prev.map((item) => (item.id === transferId ? updated : item)));
    persistCashTransferEvent(updated);
    return { ok: true, message: 'Request approved and cash sent to Cashier 2.' };
  }, [cashTransfers, persistCashTransferEvent, user]);

  const declineCashTransferRequest = useCallback((transferId: string, decisionComment: string, actionId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1 or Controller can decline cash requests.' };

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash request not found.' };
    if (target.status !== 'pending_cashier_1_approval') return { ok: false, message: 'Only pending requests can be declined.' };

    const normalizedActionId = normalizeActionId(actionId);
    if (normalizedActionId && cashTransfers.some((entry) => entry.clientActionId === normalizedActionId)) return { ok: true, message: 'Decline already submitted.' };

    const updated: CashTransfer = {
      ...target,
      clientActionId: normalizedActionId || target.clientActionId,
      decisionComment: decisionComment.trim(),
      decidedAt: new Date().toISOString(),
      decidedByUserId: user.id,
      status: 'declined_by_cashier_1',
    };
    setCashTransfers((prev) => prev.map((item) => (item.id === transferId ? updated : item)));
    persistCashTransferEvent(updated);
    return { ok: true, message: 'Request declined.' };
  }, [cashTransfers, persistCashTransferEvent, user]);
  const confirmCashTransferReceived = useCallback((transferId: string, receiveComment: string, actionId?: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1, Cashier 2, or Controller can confirm receipt.' };

    const target = cashTransfers.find((item) => item.id === transferId);
    if (!target) return { ok: false, message: 'Cash transfer not found.' };
    if (target.status !== 'sent_to_cashier_2') return { ok: false, message: 'Transfer is not awaiting receipt confirmation.' };

    const normalizedActionId = normalizeActionId(actionId);
    if (normalizedActionId && cashTransfers.some((entry) => entry.clientActionId === normalizedActionId)) return { ok: true, message: 'Receipt confirmation already submitted.' };

    const updated: CashTransfer = {
      ...target,
      clientActionId: normalizedActionId || target.clientActionId,
      receiveComment: receiveComment.trim(),
      receivedAt: new Date().toISOString(),
      receivedByUserId: user.id,
      status: 'received_by_cashier_2',
    };
    setCashTransfers((prev) => prev.map((item) => (item.id === transferId ? updated : item)));
    persistCashTransferEvent(updated);
    return { ok: true, message: 'Cash receipt confirmed.' };
  }, [cashTransfers, persistCashTransferEvent, user]);

  const recordManagingDirectorTransfer = useCallback((input: { amount: number; reference?: string; notes?: string; actionId?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1 or Controller can record MD transfers.' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateTransfer = mdTransfers.find((entry) => entry.clientActionId === actionId);
    if (duplicateTransfer) return { ok: true, message: 'Managing Director transfer already submitted.', transferId: duplicateTransfer.id };

    const transfer: ManagingDirectorTransfer = {
      id: generateReference('MD-TRANSFER'),
      clientActionId: actionId,
      amount: Math.round(input.amount),
      reference: input.reference?.trim() || generateReference('MDTRF'),
      notes: input.notes?.trim() ?? '',
      transferredAt: new Date().toISOString(),
      transferredByUserId: user.id,
    };
    setMdTransfers((prev) => [transfer, ...prev]);
    void setDoc(doc(db, MD_TRANSFERS_COLLECTION, transfer.id), { ...transfer, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Managing Director transfer recorded.', transferId: transfer.id };
  }, [mdTransfers, user]);

  const recordCashDistribution = useCallback((input: { actionId?: string; category: CashDistributionCategory; amount: number; reason: string; otherDetails?: string; }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_2' && user.role !== 'cashier_1' && user.role !== 'controller') return { ok: false, message: 'Only Cashier 1, Cashier 2, or Controller can record cash distributions.' };
    if (policy.transactionsFrozen && user.role !== 'controller') return { ok: false, message: 'Transactions are frozen by controller.' };
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicateDistribution = cashDistributions.find((entry) => entry.clientActionId === actionId);
    if (duplicateDistribution) return { ok: true, message: 'Cash distribution already submitted.', distributionId: duplicateDistribution.id };
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    if (!input.reason.trim()) return { ok: false, message: 'Reason is required.' };
    const customCategoryLabel = input.category === 'other' ? (input.otherDetails?.trim() ?? '') : '';
    if (input.category === 'other' && !customCategoryLabel) return { ok: false, message: 'Enter details for Others category.' };

    const record: CashDistributionRecord = {
      id: `CDIST-${Date.now()}`,
      clientActionId: actionId,
      category: input.category,
      customCategoryLabel: customCategoryLabel || undefined,
      amount: Math.round(input.amount),
      reason: input.reason.trim(),
      distributedAt: new Date().toISOString(),
      distributedByUserId: user.id,
    };
    setCashDistributions((prev) => [record, ...prev]);
    void setDoc(doc(db, CASH_DISTRIBUTIONS_COLLECTION, record.id), { ...record, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true, message: 'Cash distribution recorded.', distributionId: record.id };
  }, [cashDistributions, policy.transactionsFrozen, user]);

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
    budgets, allocations, distributions, cashTransfers, mdTransfers, cashDistributions, logs,
    createBudget, requestAllocation, controllerDecision, releaseFunds, addDistribution,
    requestCashTransferFromCashier2, sendCashToCashier2, approveCashTransferRequest,
    declineCashTransferRequest, confirmCashTransferReceived, recordManagingDirectorTransfer,
    recordCashDistribution, getAllocationSummary, generateExpenseSheet,
  }), [
    addDistribution, allocations, approveCashTransferRequest, budgets, cashTransfers,
    confirmCashTransferReceived, controllerDecision, createBudget, declineCashTransferRequest,
    distributions, generateExpenseSheet, getAllocationSummary, cashDistributions, logs,
    mdTransfers, recordCashDistribution, recordManagingDirectorTransfer, releaseFunds,
    requestCashTransferFromCashier2, requestAllocation, sendCashToCashier2,
  ]);

  return <EventFinanceContext.Provider value={value}>{children}</EventFinanceContext.Provider>;
}

export function useEventFinance() {
  const context = useContext(EventFinanceContext);
  if (!context) throw new Error('useEventFinance must be used within EventFinanceProvider');
  return context;
}
