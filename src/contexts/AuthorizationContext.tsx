import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
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
const AUTHZ_STATE_REF = doc(db, 'system_state', 'authorization');
const AUTHZ_CACHE_KEY = 'kuringe_authorization_state_cache_v1';
const MANAGER_MESSAGES_COLLECTION = 'manager_messages';

export function AuthorizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<SystemPolicy>(DEFAULT_SYSTEM_POLICY);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuthorizationAuditEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(AUTHZ_CACHE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        policy?: SystemPolicy;
        approvals?: ApprovalRequest[];
        auditLog?: AuthorizationAuditEntry[];
      };
      setPolicy({ ...DEFAULT_SYSTEM_POLICY, ...(data.policy ?? {}) });
      setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
      setAuditLog(Array.isArray(data.auditLog) ? data.auditLog : []);
    } catch {
      localStorage.removeItem(AUTHZ_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      AUTHZ_CACHE_KEY,
      JSON.stringify({
        policy,
        approvals,
        auditLog,
      }),
    );
  }, [approvals, auditLog, policy]);

  useEffect(() => {
    if (!user) {
      setPolicy(DEFAULT_SYSTEM_POLICY);
      setApprovals([]);
      setAuditLog([]);
      setHydrated(false);
      return;
    }

    const unsub = onSnapshot(
      AUTHZ_STATE_REF,
      (snapshot) => {
        const data = snapshot.data() as {
          policy?: SystemPolicy;
          approvals?: ApprovalRequest[];
          auditLog?: AuthorizationAuditEntry[];
        } | undefined;
        if (!data) {
          setPolicy(DEFAULT_SYSTEM_POLICY);
          setApprovals([]);
          setAuditLog([]);
          setHydrated(true);
          return;
        }
        setPolicy({ ...DEFAULT_SYSTEM_POLICY, ...(data.policy ?? {}) });
        setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
        setAuditLog(Array.isArray(data.auditLog) ? data.auditLog : []);
        setHydrated(true);
      },
      () => {
        const raw = localStorage.getItem(AUTHZ_CACHE_KEY);
        if (raw) {
          try {
            const data = JSON.parse(raw) as {
              policy?: SystemPolicy;
              approvals?: ApprovalRequest[];
              auditLog?: AuthorizationAuditEntry[];
            };
            setPolicy({ ...DEFAULT_SYSTEM_POLICY, ...(data.policy ?? {}) });
            setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
            setAuditLog(Array.isArray(data.auditLog) ? data.auditLog : []);
          } catch {
            localStorage.removeItem(AUTHZ_CACHE_KEY);
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
      AUTHZ_STATE_REF,
      {
        policy,
        approvals,
        auditLog,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [approvals, auditLog, hydrated, policy, user]);

  const appendAudit = useCallback((entry: Omit<AuthorizationAuditEntry, 'id' | 'timestamp'>) => {
    const record: AuthorizationAuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [record, ...prev]);

    // Mirror each audit event into Hall Manager messages for centralized oversight.
    void addDoc(collection(db, MANAGER_MESSAGES_COLLECTION), {
      title: `Audit: ${entry.action}`,
      body: `${entry.module.toUpperCase()} | ${entry.detail}`,
      fromUserId: entry.actorUserId,
      fromRole: entry.actorRole,
      toRole: 'manager',
      read: false,
      createdAt: record.timestamp,
      updatedAt: serverTimestamp(),
    });
  }, []);

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
      return { ok: false, message: 'Transactions are currently frozen by the controller.' };
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
    appendAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'approval.requested',
      module: input.module,
      detail: `${input.level} approval requested for ${input.targetReference}`,
    });
    return { ok: true, message: 'Approval request created.', requestId: request.id };
  }, [appendAudit, policy, user]);

  const reviewApproval = useCallback(
    (
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

      setApprovals((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                status: decision,
                decisionComment: comment,
                reviewedByUserId: user.id,
                reviewedByRole: user.role,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      appendAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: `approval.${decision}`,
        module: request.module,
        detail: `${request.targetReference} ${decision}`,
      });
      return { ok: true, message: `Approval ${decision}.` };
    },
    [appendAudit, approvals, user],
  );

  const overrideApproval = useCallback(
    (requestId: string, status: Extract<ApprovalStatus, 'approved' | 'rejected'>, comment: string) => {
      if (!user) return { ok: false, message: 'Authentication required.' };
      if (user.role !== 'controller') {
        return { ok: false, message: 'Only controller can override decisions.' };
      }

      const request = approvals.find((item) => item.id === requestId);
      if (!request) return { ok: false, message: 'Approval request not found.' };

      setApprovals((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                status: 'overridden',
                overrideByUserId: user.id,
                overrideByRole: user.role,
                overrideComment: `${status.toUpperCase()}: ${comment}`,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      appendAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'approval.overridden',
        module: request.module,
        detail: `${request.targetReference} overridden to ${status}`,
      });
      return { ok: true, message: 'Approval overridden by controller.' };
    },
    [appendAudit, approvals, user],
  );

  const setTransactionsFrozen = useCallback((frozen: boolean, reason: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'controller') {
      return { ok: false, message: 'Only controller can freeze/unfreeze transactions.' };
    }
    setPolicy((prev) => ({
      ...prev,
      transactionsFrozen: frozen,
      freezeReason: reason.trim(),
    }));
    appendAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: frozen ? 'system.transactions.frozen' : 'system.transactions.unfrozen',
      module: 'system',
      detail: reason.trim() || (frozen ? 'No reason provided' : 'System resumed'),
    });
    return { ok: true, message: frozen ? 'Transactions frozen.' : 'Transactions resumed.' };
  }, [appendAudit, user]);

  return (
    <AuthorizationContext.Provider
      value={{
        policy,
        approvals,
        auditLog,
        can,
        isBlocked,
        createApprovalRequest,
        reviewApproval,
        overrideApproval,
        setTransactionsFrozen,
      }}
    >
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error('useAuthorization must be used inside AuthorizationProvider');
  }
  return context;
}
