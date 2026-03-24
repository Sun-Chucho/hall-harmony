import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  AuthState,
  ROLE_CHANGE_AUTHORITIES,
  ROLE_LABELS,
  User,
  UserRole,
} from '@/types/auth';
import { auth, db, firebaseConfig } from '@/lib/firebase';

interface AuthContextType extends AuthState {
  staffUsers: User[];
  login: (identifier: string, password: string) => Promise<boolean>;
  loginWithResult: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  refreshStaffUsers: () => Promise<void>;
  createStaffUser: (input: { name: string; email: string; role: UserRole; password: string }) => Promise<{ ok: boolean; message: string }>;
  updateStaffRole: (userId: string, role: UserRole) => Promise<{ ok: boolean; message: string }>;
  updateStaffActive: (userId: string, isActive: boolean) => Promise<{ ok: boolean; message: string }>;
  removeStaffUser: (userId: string) => Promise<{ ok: boolean; message: string }>;
  forceLogoutAllSessions: () => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STAFF_COLLECTION = 'staff_users';
const DEFAULT_PASSWORD = '123456';
const LEGACY_PASSWORD_ALIAS = '1234';
const AUTH_PROFILE_CACHE_KEY = 'kuringe_auth_profile_v1';
const SESSION_CONTROL_REF = doc(db, 'system_state', 'session_control');

function resolveFirebasePassword(password: string) {
  if (password === LEGACY_PASSWORD_ALIAS) {
    return DEFAULT_PASSWORD;
  }
  return password;
}

function normalizeUser(input: Partial<User> & { id: string; email: string; name: string; role: UserRole }): User {
  return {
    id: input.id,
    email: input.email,
    name: input.name,
    role: input.role,
    isActive: input.isActive ?? true,
    createdAt: input.createdAt ?? new Date().toISOString(),
    lastLogin: input.lastLogin,
  };
}

async function fetchStaffDirectory(): Promise<User[]> {
  try {
    const snapshot = await getDocs(collection(db, STAFF_COLLECTION));

    return snapshot.docs
      .map((item) => {
        const data = item.data() as Partial<User>;
        const createdAt =
          typeof data.createdAt === 'string'
            ? data.createdAt
            : new Date().toISOString();
        return normalizeUser({
          id: item.id,
          email: data.email ?? '',
          name: data.name ?? '',
          role: (data.role as UserRole) ?? 'manager',
          isActive: data.isActive ?? true,
          createdAt,
          lastLogin: data.lastLogin,
        });
      })
      .filter((user) => user.email && user.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function fetchProfileByUid(uid: string): Promise<User | null> {
  try {
    const profileRef = doc(db, STAFF_COLLECTION, uid);
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as Partial<User>;
    return normalizeUser({
      id: snapshot.id,
      email: data.email ?? '',
      name: data.name ?? '',
      role: (data.role as UserRole) ?? 'manager',
      isActive: data.isActive ?? true,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      lastLogin: data.lastLogin,
    });
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  const refreshStaffUsers = useCallback(async () => {
    const directory = await fetchStaffDirectory();
    setStaffUsers(directory);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const profile = await fetchProfileByUid(firebaseUser.uid);
        if (!profile || !profile.isActive) {
          await signOut(auth);
          localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
          setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        const resolvedUser = {
          ...profile,
          email: firebaseUser.email ?? profile.email,
        };
        localStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(resolvedUser));

        setState({
          user: resolvedUser,
          isAuthenticated: true,
          isLoading: false,
        });
        void refreshStaffUsers();
      } catch {
        const cached = localStorage.getItem(AUTH_PROFILE_CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as User;
            if (parsed.id === firebaseUser.uid) {
              setState({
                user: {
                  ...parsed,
                  email: firebaseUser.email ?? parsed.email,
                },
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          } catch {
            localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
          }
        }

        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return unsubscribe;
  }, [refreshStaffUsers]);

  useEffect(() => {
    if (!state.user) return;

    const unsub = onSnapshot(
      SESSION_CONTROL_REF,
      async (snapshot) => {
        const data = snapshot.data() as { forceLogoutAt?: string } | undefined;
        const forceLogoutAt = data?.forceLogoutAt;
        if (!forceLogoutAt) return;
        const forcedAtMs = Date.parse(forceLogoutAt);
        if (Number.isNaN(forcedAtMs)) return;
        const baseline = state.user?.lastLogin ?? state.user?.createdAt ?? '';
        const lastLoginMs = Date.parse(baseline);
        if (Number.isNaN(lastLoginMs) || lastLoginMs < forcedAtMs) {
          await signOut(auth);
          localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      () => {
        // Ignore listener errors; auth flow remains available.
      },
    );

    return () => unsub();
  }, [state.user]);

  const loginWithResult = useCallback(
    async (identifier: string, password: string): Promise<{ ok: boolean; message?: string }> => {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const targetUser = staffUsers.find(
        (item) => item.id === identifier || item.email.toLowerCase() === normalizedIdentifier,
      );

      if (!targetUser) {
        return { ok: false, message: 'Selected user was not found in Firestore staff directory.' };
      }

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          targetUser.email,
          resolveFirebasePassword(password || DEFAULT_PASSWORD),
        );
        const profile = await fetchProfileByUid(credential.user.uid);
        if (!profile || !profile.isActive) {
          await signOut(auth);
          return { ok: false, message: 'This user is inactive and cannot sign in.' };
        }

        const nowIso = new Date().toISOString();
        try {
          await updateDoc(doc(db, STAFF_COLLECTION, profile.id), {
            lastLogin: nowIso,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Continue when Firestore is unavailable.
        }

        setState({
          user: {
            ...profile,
            lastLogin: nowIso,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify({
          ...profile,
          lastLogin: nowIso,
        }));
        return { ok: true };
      } catch (error: unknown) {
        const authCode = typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
        if (
          authCode === 'auth/invalid-credential' ||
          authCode === 'auth/wrong-password' ||
          authCode === 'auth/user-not-found' ||
          authCode === 'auth/invalid-login-credentials'
        ) {
          return { ok: false, message: 'Invalid email/password in Firebase Authentication for this staff account.' };
        }
        return { ok: false, message: 'Firebase sign-in failed. Please verify Firebase Authentication and Firestore setup.' };
      }
    },
    [staffUsers],
  );

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    const result = await loginWithResult(identifier, password);
    return result.ok;
  }, [loginWithResult]);

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const switchUser = useCallback((userId: string) => {
    // Disabled in Firebase mode. Use explicit login with password.
    void userId;
  }, []);

  const changePassword = useCallback(
    async (userId: string, currentPassword: string, newPassword: string) => {
      const cleanPassword = newPassword.trim();
      if (cleanPassword.length < 6) {
        return { ok: false, message: 'New password must be at least 6 characters.' };
      }

      const targetUser = staffUsers.find((item) => item.id === userId)
        ?? (state.user && state.user.id === userId ? state.user : null);
      if (!targetUser) {
        return { ok: false, message: 'Selected user account was not found.' };
      }

      try {
        if (auth.currentUser && auth.currentUser.uid === targetUser.id && auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            resolveFirebasePassword(currentPassword),
          );
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, cleanPassword);
          return { ok: true, message: 'Password updated successfully.' };
        }

        const tempAppName = `password-change-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        const tempCredential = await signInWithEmailAndPassword(
          tempAuth,
          targetUser.email,
          resolveFirebasePassword(currentPassword),
        );
        await updatePassword(tempCredential.user, cleanPassword);
        await signOut(tempAuth);
        await deleteApp(tempApp);
        return { ok: true, message: 'Password updated successfully.' };
      } catch {
        return { ok: false, message: 'Password update failed. Please verify the current password.' };
      }
    },
    [staffUsers, state.user],
  );

  const createStaffUser = useCallback(
    async (input: { name: string; email: string; role: UserRole; password: string }) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Managing Director can add users.' };
      }

      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      const password = input.password.trim();
      if (!name) return { ok: false, message: 'Name is required.' };
      if (!email || !email.includes('@')) return { ok: false, message: 'Valid email is required.' };
      if (!ROLE_LABELS[input.role]) return { ok: false, message: 'Invalid role.' };
      if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

      const existing = staffUsers.find((entry) => entry.email.toLowerCase() === email);
      if (existing) {
        return { ok: false, message: 'A staff profile with this email already exists.' };
      }

      const tempAppName = `staff-create-${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
        await setDoc(doc(db, STAFF_COLLECTION, credential.user.uid), {
          id: credential.user.uid,
          email,
          name,
          role: input.role,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await signOut(tempAuth);
        await deleteApp(tempApp);
        await refreshStaffUsers();
        return { ok: true, message: 'Staff user added successfully.' };
      } catch {
        try {
          await signOut(tempAuth);
        } catch {
          // Ignore.
        }
        await deleteApp(tempApp);
        return { ok: false, message: 'Failed to create user. Verify Firebase Authentication is enabled for Email/Password.' };
      }
    },
    [refreshStaffUsers, staffUsers, state.user],
  );

  const updateStaffRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Managing Director can change user roles.' };
      }

      if (!ROLE_LABELS[role]) {
        return { ok: false, message: 'Invalid target role.' };
      }

      try {
        await updateDoc(doc(db, STAFF_COLLECTION, userId), {
          role,
          updatedAt: serverTimestamp(),
        });
        await refreshStaffUsers();
        return { ok: true, message: 'Role updated successfully.' };
      } catch {
        return { ok: false, message: 'Failed to update role.' };
      }
    },
    [refreshStaffUsers, state.user],
  );

  const updateStaffActive = useCallback(
    async (userId: string, isActive: boolean) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Managing Director can update user status.' };
      }

      if (state.user.id === userId && !isActive) {
        return { ok: false, message: 'You cannot deactivate your own account.' };
      }

      try {
        await updateDoc(doc(db, STAFF_COLLECTION, userId), {
          isActive,
          updatedAt: serverTimestamp(),
        });
        await refreshStaffUsers();
        return { ok: true, message: isActive ? 'User activated.' : 'User deactivated.' };
      } catch {
        return { ok: false, message: 'Failed to update user status.' };
      }
    },
    [refreshStaffUsers, state.user],
  );

  const removeStaffUser = useCallback(
    async (userId: string) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Managing Director can remove users.' };
      }

      if (state.user.id === userId) {
        return { ok: false, message: 'You cannot remove your own account.' };
      }

      try {
        await deleteDoc(doc(db, STAFF_COLLECTION, userId));
        await refreshStaffUsers();
        return { ok: true, message: 'User removed from staff directory.' };
      } catch {
        return { ok: false, message: 'Failed to remove user.' };
      }
    },
    [refreshStaffUsers, state.user],
  );

  const forceLogoutAllSessions = useCallback(async () => {
    if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
      return { ok: false, message: 'Only Accountant or Managing Director can force logout all sessions.' };
    }

    try {
      const nowIso = new Date().toISOString();
      await setDoc(
        SESSION_CONTROL_REF,
        {
          forceLogoutAt: nowIso,
          forcedByUserId: state.user.id,
          forcedByRole: state.user.role,
          writeToken: 'action_v1',
          clientActionNonce: crypto.randomUUID(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return { ok: true, message: 'Global logout signal sent. Active sessions will be signed out.' };
    } catch {
      return { ok: false, message: 'Failed to send global logout signal.' };
    }
  }, [state.user]);

  const value = useMemo(
    () => ({
      ...state,
      staffUsers,
      login,
      loginWithResult,
      logout,
      switchUser,
      changePassword,
      refreshStaffUsers,
      createStaffUser,
      updateStaffRole,
      updateStaffActive,
      removeStaffUser,
      forceLogoutAllSessions,
    }),
    [
      changePassword,
      createStaffUser,
      login,
      loginWithResult,
      logout,
      refreshStaffUsers,
      removeStaffUser,
      staffUsers,
      state,
      switchUser,
      updateStaffActive,
      updateStaffRole,
      forceLogoutAllSessions,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function canResetOtherUsers(role: UserRole) {
  return ROLE_CHANGE_AUTHORITIES.includes(role);
}
