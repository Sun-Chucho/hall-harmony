import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
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
const AUTHZ_DIRTY_KEY = 'kuringe_authorization_dirty_v1';

export function AuthorizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<SystemPolicy>(DEFAULT_SYSTEM_POLICY);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuthorizationAuditEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastSyncedStateRef = useRef('');
  const pendingRemoteWriteRef = useRef(false);
  const pendingActionNonceRef = useRef('');

  const serializeState = useCallback((nextState: {
    policy: SystemPolicy;
    approvals: ApprovalRequest[];
    auditLog: AuthorizationAuditEntry[];
  }) => JSON.stringify(nextState), []);

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
      lastSyncedStateRef.current = '';
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
          const emptyState = {
            policy: DEFAULT_SYSTEM_POLICY,
            approvals: [],
            auditLog: [],
          };
          const serialized = serializeState(emptyState);
          if (serialized !== lastSyncedStateRef.current) {
            setPolicy(emptyState.policy);
            setApprovals(emptyState.approvals);
            setAuditLog(emptyState.auditLog);
            lastSyncedStateRef.current = serialized;
          }
          setHydrated(true);
          return;
        }
        const nextState = {
          policy: { ...DEFAULT_SYSTEM_POLICY, ...(data.policy ?? {}) },
          approvals: Array.isArray(data.approvals) ? data.approvals : [],
          auditLog: Array.isArray(data.auditLog) ? data.auditLog : [],
        };
        const serialized = serializeState(nextState);
        if (serialized !== lastSyncedStateRef.current) {
          setPolicy(nextState.policy);
          setApprovals(nextState.approvals);
          setAuditLog(nextState.auditLog);
          lastSyncedStateRef.current = serialized;
        }
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
    if (!pendingRemoteWriteRef.current) return;
    pendingRemoteWriteRef.current = false;
    const actionNonce = pendingActionNonceRef.current || crypto.randomUUID();
    pendingActionNonceRef.current = '';
    const serialized = serializeState({
      policy,
      approvals,
      auditLog,
    });
    if (serialized === lastSyncedStateRef.current) return;
    lastSyncedStateRef.current = serialized;
    void (async () => {
      try {
        await setDoc(
          AUTHZ_STATE_REF,
          {
            policy,
            approvals,
            auditLog,
            writeToken: 'action_v1',
            clientActionNonce: actionNonce,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        localStorage.removeItem(AUTHZ_DIRTY_KEY);
      } catch {
        localStorage.setItem(AUTHZ_DIRTY_KEY, '1');
      }
    })();
  }, [approvals, auditLog, hydrated, policy, user]);

  const appendAudit = useCallback((entry: Omit<AuthorizationAuditEntry, 'id' | 'timestamp'>) => {
    // Audit logging intentionally disabled to reduce write volume.
    void entry;
  }, []);

  const persistAuthorizationState = useCallback((overrides?: {
    policy?: SystemPolicy;
    approvals?: ApprovalRequest[];
    auditLog?: AuthorizationAuditEntry[];
  }) => {
    const payload = {
      policy: overrides?.policy ?? policy,
      approvals: overrides?.approvals ?? approvals,
      auditLog: overrides?.auditLog ?? auditLog,
    };
    pendingActionNonceRef.current = crypto.randomUUID();
    pendingRemoteWriteRef.current = true;
    localStorage.setItem(AUTHZ_DIRTY_KEY, '1');
    localStorage.setItem(AUTHZ_CACHE_KEY, JSON.stringify(payload));
  }, [approvals, auditLog, policy]);

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

    const nextApprovals = [request, ...approvals];
    setApprovals(nextApprovals);
    persistAuthorizationState({ approvals: nextApprovals });
    return { ok: true, message: 'Approval request created.', requestId: request.id };
  }, [approvals, persistAuthorizationState, policy, user]);

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

      const nextApprovals = approvals.map((item) =>
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
      );
      setApprovals(nextApprovals);
      persistAuthorizationState({ approvals: nextApprovals });
      return { ok: true, message: `Approval ${decision}.` };
    },
    [approvals, persistAuthorizationState, user],
  );

  const overrideApproval = useCallback(
    (requestId: string, status: Extract<ApprovalStatus, 'approved' | 'rejected'>, comment: string) => {
      if (!user) return { ok: false, message: 'Authentication required.' };
      if (user.role !== 'controller') {
        return { ok: false, message: 'Only controller can override decisions.' };
      }

      const request = approvals.find((item) => item.id === requestId);
      if (!request) return { ok: false, message: 'Approval request not found.' };

      const nextApprovals = approvals.map((item) =>
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
      );
      setApprovals(nextApprovals);
      persistAuthorizationState({ approvals: nextApprovals });
      return { ok: true, message: 'Approval overridden by controller.' };
    },
    [approvals, persistAuthorizationState, user],
  );

  const setTransactionsFrozen = useCallback((frozen: boolean, reason: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'controller') {
      return { ok: false, message: 'Only controller can freeze/unfreeze transactions.' };
    }
    const nextPolicy = {
      ...policy,
      transactionsFrozen: frozen,
      freezeReason: reason.trim(),
    };
    setPolicy(nextPolicy);
    persistAuthorizationState({ policy: nextPolicy });
    return { ok: true, message: frozen ? 'Transactions frozen.' : 'Transactions resumed.' };
  }, [persistAuthorizationState, policy, user]);

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
