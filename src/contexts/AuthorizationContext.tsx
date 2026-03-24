import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  ApprovalLevel,
  ApprovalModule,
  ApprovalRequest,
  ApprovalStatus,
  AuthorizationAuditEntry,
  DEFAULT_SYSTEM_POLICY,
  Permission,
  SystemPolicy,
  canReviewApproval,
  hasPermission,
  isTransactionBlocked,
} from '@/lib/authorization';

interface CreateApprovalInput {
  level: ApprovalLevel;
  module: ApprovalModule;
  title: string;
  description: string;
  targetReference: string;
  amount?: number;
}

interface AuthorizationContextValue {
  policy: SystemPolicy;
  approvals: ApprovalRequest[];
  auditLog: AuthorizationAuditEntry[];
  can: (permission: Permission) => boolean;
  isBlocked: boolean;
  createApprovalRequest: (input: CreateApprovalInput) => { ok: boolean; message: string; requestId?: string };
  reviewApproval: (
    requestId: string,
    decision: Extract<ApprovalStatus, 'approved' | 'rejected'>,
    comment: string,
  ) => { ok: boolean; message: string };
  overrideApproval: (
    requestId: string,
    status: Extract<ApprovalStatus, 'approved' | 'rejected'>,
    comment: string,
  ) => { ok: boolean; message: string };
  setTransactionsFrozen: (frozen: boolean, reason: string) => { ok: boolean; message: string };
}

const AuthorizationContext = createContext<AuthorizationContextValue | undefined>(undefined);
const POLICY_REF = doc(db, 'authorization_policy', 'singleton');
const APPROVALS_COLLECTION = 'authorization_approvals';

export function AuthorizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<SystemPolicy>(DEFAULT_SYSTEM_POLICY);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLog] = useState<AuthorizationAuditEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setPolicy(DEFAULT_SYSTEM_POLICY);
      return;
    }

    const unsub = onSnapshot(
      POLICY_REF,
      (snapshot) => {
        const data = snapshot.data() as Partial<SystemPolicy> | undefined;
        setPolicy({ ...DEFAULT_SYSTEM_POLICY, ...(data ?? {}) });
      },
      () => {
        setPolicy(DEFAULT_SYSTEM_POLICY);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setApprovals([]);
      return;
    }

    const q = query(collection(db, APPROVALS_COLLECTION), limit(3000));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => {
            const data = item.data() as Partial<ApprovalRequest>;
            return {
              id: item.id,
              level: (data.level ?? 'minor') as ApprovalLevel,
              module: (data.module ?? 'booking') as ApprovalModule,
              title: data.title ?? '',
              description: data.description ?? '',
              amount: data.amount,
              requestedByUserId: data.requestedByUserId ?? '',
              requestedByRole: data.requestedByRole ?? 'assistant_hall_manager',
              targetReference: data.targetReference ?? '',
              status: (data.status ?? 'pending') as ApprovalStatus,
              createdAt: data.createdAt ?? new Date(0).toISOString(),
              updatedAt: data.updatedAt ?? data.createdAt ?? new Date(0).toISOString(),
              reviewedByUserId: data.reviewedByUserId,
              reviewedByRole: data.reviewedByRole,
              decisionComment: data.decisionComment,
              overrideByUserId: data.overrideByUserId,
              overrideByRole: data.overrideByRole,
              overrideComment: data.overrideComment,
            } as ApprovalRequest;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setApprovals(next);
      },
      () => {
        setApprovals([]);
      },
    );

    return () => unsub();
  }, [user]);

  const can = useCallback((permission: Permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const isBlocked = useMemo(() => {
    if (!user) return false;
    return isTransactionBlocked(user.role, policy);
  }, [policy, user]);

  const createApprovalRequest = useCallback((input: CreateApprovalInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (isTransactionBlocked(user.role, policy)) {
      return { ok: false, message: 'Transactions are currently frozen by the accountant.' };
    }

    const request: ApprovalRequest = {
      id: crypto.randomUUID(),
      level: input.level,
      module: input.module,
      title: input.title,
      description: input.description,
      amount: input.amount,
      requestedByUserId: user.id,
      requestedByRole: user.role,
      targetReference: input.targetReference,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setApprovals((prev) => [request, ...prev]);
    void setDoc(
      doc(db, APPROVALS_COLLECTION, request.id),
      {
        ...request,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true, message: 'Approval request created.', requestId: request.id };
  }, [policy, user]);

  const reviewApproval = useCallback((
    requestId: string,
    decision: Extract<ApprovalStatus, 'approved' | 'rejected'>,
    comment: string,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const request = approvals.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Approval request not found.' };
    if (!canReviewApproval(user.role, request.level)) {
      return { ok: false, message: 'Role cannot review this approval level.' };
    }
    if (request.status !== 'pending') {
      return { ok: false, message: 'Only pending requests can be reviewed.' };
    }

    const patch = {
      status: decision,
      updatedAt: new Date().toISOString(),
      reviewedByUserId: user.id,
      reviewedByRole: user.role,
      decisionComment: comment.trim(),
    };

    setApprovals((prev) => prev.map((item) => (item.id === requestId ? { ...item, ...patch } : item)));
    void updateDoc(doc(db, APPROVALS_COLLECTION, requestId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });

    return { ok: true, message: `Request ${decision}.` };
  }, [approvals, user]);

  const overrideApproval = useCallback((
    requestId: string,
    status: Extract<ApprovalStatus, 'approved' | 'rejected'>,
    comment: string,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!hasPermission(user.role, 'approval.override')) {
      return { ok: false, message: 'Only Accountant can override approvals.' };
    }

    const request = approvals.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: 'Approval request not found.' };

    const patch = {
      status,
      updatedAt: new Date().toISOString(),
      overrideByUserId: user.id,
      overrideByRole: user.role,
      overrideComment: comment.trim(),
    };

    setApprovals((prev) => prev.map((item) => (item.id === requestId ? { ...item, ...patch } : item)));
    void updateDoc(doc(db, APPROVALS_COLLECTION, requestId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });

    return { ok: true, message: `Request override set to ${status}.` };
  }, [approvals, user]);

  const setTransactionsFrozen = useCallback((frozen: boolean, reason: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'accountant') {
      return { ok: false, message: 'Only Accountant can freeze or unfreeze transactions.' };
    }

    const nextPolicy = {
      ...policy,
      transactionsFrozen: frozen,
      freezeReason: frozen ? reason.trim() : '',
    };

    setPolicy(nextPolicy);
    void setDoc(
      POLICY_REF,
      {
        ...nextPolicy,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      ok: true,
      message: frozen ? 'Transactions frozen.' : 'Transactions resumed.',
    };
  }, [policy, user]);

  const value = useMemo<AuthorizationContextValue>(() => ({
    policy,
    approvals,
    auditLog,
    can,
    isBlocked,
    createApprovalRequest,
    reviewApproval,
    overrideApproval,
    setTransactionsFrozen,
  }), [
    approvals,
    auditLog,
    can,
    createApprovalRequest,
    isBlocked,
    overrideApproval,
    policy,
    reviewApproval,
    setTransactionsFrozen,
  ]);

  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (!context) throw new Error('useAuthorization must be used within AuthorizationProvider');
  return context;
}
