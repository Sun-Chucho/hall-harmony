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
import { sanitizeFirestoreData } from '@/lib/firestoreData';
import { auth, db, firebaseConfig } from '@/lib/firebase';

interface AuthContextType extends AuthState {
  staffUsers: User[];
  login: (identifier: string, password: string) => Promise<boolean>;
  loginWithResult: (identifier: string, password: string, options?: LoginOptions) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  refreshStaffUsers: () => Promise<void>;
  createStaffUser: (input: { name: string; email: string; role: UserRole; password: string; notes?: string }) => Promise<{ ok: boolean; message: string }>;
  updateStaffRole: (userId: string, role: UserRole) => Promise<{ ok: boolean; message: string }>;
  updateStaffNotes: (userId: string, notes: string) => Promise<{ ok: boolean; message: string }>;
  updateStaffActive: (userId: string, isActive: boolean) => Promise<{ ok: boolean; message: string }>;
  removeStaffUser: (userId: string) => Promise<{ ok: boolean; message: string }>;
  forceLogoutAllSessions: () => Promise<{ ok: boolean; message: string }>;
}

interface LoginOptions {
  allowedRoles?: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STAFF_COLLECTION = 'staff_users';
const AUTH_PROFILE_CACHE_KEY = 'kuringe_auth_profile_v1';
const SESSION_CONTROL_REF = doc(db, 'system_state', 'session_control');
const FIREBASE_READ_TIMEOUT_MS = 12000;
const FIREBASE_WRITE_TIMEOUT_MS = 10000;
const FIREBASE_AUTH_TIMEOUT_MS = 18000;
const LOGIN_TIMEOUT_MESSAGE = 'Login request timed out. Please check the connection and try again.';
const KNOWN_MD_FALLBACK_PROFILES: User[] = [
  {
    id: '11',
    email: 'md@kuringe.co.tz',
    name: 'MD',
    role: 'managing_director',
    notes: '',
    isActive: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: '10',
    email: 'edward.mushi@kuringe.co.tz',
    name: 'MD',
    role: 'managing_director',
    notes: '',
    isActive: true,
    createdAt: new Date(0).toISOString(),
  },
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function isEmailIdentifier(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && /timed out/i.test(error.message);
}

function canUseLoginFallbackProfile(profile: User | null, firebaseUid: string, emailForAuth: string) {
  if (!profile || !profile.isActive) return false;
  return profile.id === firebaseUid || profile.email.toLowerCase() === emailForAuth.toLowerCase();
}

function getKnownLoginFallbackProfile(firebaseUid: string, emailForAuth: string) {
  return KNOWN_MD_FALLBACK_PROFILES.find((profile) => canUseLoginFallbackProfile(profile, firebaseUid, emailForAuth)) ?? null;
}

function normalizeAuthPasswordInput(password: string) {
  return password.trim();
}

function normalizeStaffRole(role: UserRole): UserRole {
  return role === 'controller' ? 'accountant' : role;
}

function normalizeStaffName(name: string, role: UserRole): string {
  if (role === 'manager' && /diana|dianna/i.test(name)) {
    return 'Halls Manager';
  }
  if (role === 'accountant' && /augustine/i.test(name)) {
    return 'Accountant';
  }
  return name;
}

function normalizeUser(input: Partial<User> & { id: string; email: string; name: string; role: UserRole }): User {
  const normalizedRole = normalizeStaffRole(input.role);
  return {
    id: input.id,
    email: input.email,
    name: normalizeStaffName(input.name, normalizedRole),
    role: normalizedRole,
    notes: input.notes?.trim() ?? '',
    isActive: input.isActive ?? true,
    createdAt: input.createdAt ?? new Date().toISOString(),
    lastLogin: input.lastLogin,
  };
}

async function fetchStaffDirectory(): Promise<User[]> {
  try {
    const snapshot = await withTimeout(
      getDocs(collection(db, STAFF_COLLECTION)),
      FIREBASE_READ_TIMEOUT_MS,
      'Staff directory request timed out.',
    );

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
          notes: data.notes ?? '',
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
  const profileRef = doc(db, STAFF_COLLECTION, uid);
  const snapshot = await withTimeout(
    getDoc(profileRef),
    FIREBASE_READ_TIMEOUT_MS,
    'Staff profile request timed out.',
  );
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<User>;
  return normalizeUser({
    id: snapshot.id,
    email: data.email ?? '',
    name: data.name ?? '',
    role: (data.role as UserRole) ?? 'manager',
    notes: data.notes ?? '',
    isActive: data.isActive ?? true,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    lastLogin: data.lastLogin,
  });
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
    async (identifier: string, password: string, options: LoginOptions = {}): Promise<{ ok: boolean; message?: string }> => {
      const cleanIdentifier = identifier.trim();
      const normalizedIdentifier = cleanIdentifier.toLowerCase();
      const normalizedPassword = normalizeAuthPasswordInput(password);
      let targetUser = staffUsers.find(
        (item) => item.id === cleanIdentifier || item.email.toLowerCase() === normalizedIdentifier,
      );

      if (!targetUser && !isEmailIdentifier(normalizedIdentifier)) {
        const directory = await fetchStaffDirectory();
        targetUser = directory.find(
          (item) => item.id === cleanIdentifier || item.email.toLowerCase() === normalizedIdentifier,
        );
      }

      if (!normalizedPassword) {
        return { ok: false, message: 'Password is required.' };
      }

      const emailForAuth = targetUser?.email ?? (isEmailIdentifier(normalizedIdentifier) ? normalizedIdentifier : '');
      if (!emailForAuth) {
        return { ok: false, message: 'Enter your staff email address, or wait briefly and try the staff ID again.' };
      }

      try {
        const credential = await withTimeout(
          signInWithEmailAndPassword(
            auth,
            emailForAuth,
            normalizedPassword,
          ),
          FIREBASE_AUTH_TIMEOUT_MS,
          LOGIN_TIMEOUT_MESSAGE,
        );
        let profile: User | null = null;
        try {
          profile = await fetchProfileByUid(credential.user.uid);
        } catch {
          if (canUseLoginFallbackProfile(targetUser ?? null, credential.user.uid, emailForAuth)) {
            profile = {
              ...targetUser,
              id: credential.user.uid,
              email: credential.user.email ?? targetUser.email,
            };
          } else {
            profile = getKnownLoginFallbackProfile(credential.user.uid, emailForAuth);
          }
        }

        if (!profile || !profile.isActive) {
          await signOut(auth);
          return { ok: false, message: 'This user profile could not be verified or is inactive.' };
        }

        if (options.allowedRoles?.length && !options.allowedRoles.includes(profile.role)) {
          await signOut(auth);
          return { ok: false, message: 'This account is not allowed to enter the selected workspace.' };
        }

        const nowIso = new Date().toISOString();
        try {
          await withTimeout(
            updateDoc(doc(db, STAFF_COLLECTION, profile.id), sanitizeFirestoreData({
              lastLogin: nowIso,
              updatedAt: serverTimestamp(),
            })),
            FIREBASE_WRITE_TIMEOUT_MS,
            'Last login update timed out.',
          );
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
        try {
          await signOut(auth);
        } catch {
          // Ignore cleanup failures; surface the original login error.
        }
        if (isTimeoutError(error)) {
          return { ok: false, message: error instanceof Error ? error.message : LOGIN_TIMEOUT_MESSAGE };
        }
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
      const cleanCurrentPassword = normalizeAuthPasswordInput(currentPassword);
      const cleanPassword = newPassword.trim();
      if (!cleanCurrentPassword) {
        return { ok: false, message: 'Current password is required.' };
      }
      if (cleanPassword.length < 4) {
        return { ok: false, message: 'New password must be at least 4 characters.' };
      }
      if (cleanCurrentPassword === cleanPassword) {
        return { ok: false, message: 'New password must be different from the current password.' };
      }

      const targetUser = staffUsers.find((item) => item.id === userId)
        ?? (state.user && state.user.id === userId ? state.user : null);
      if (!targetUser) {
        return { ok: false, message: 'Selected user account was not found.' };
      }

      const persistPasswordChange = async () => {
        try {
          await updateDoc(doc(db, STAFF_COLLECTION, targetUser.id), sanitizeFirestoreData({
            passwordChangedAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          }));
        } catch {
          // The credential change already happened in Firebase Auth.
        }

        const nextUser = state.user && state.user.id === targetUser.id
          ? {
              ...state.user,
              passwordChangedAt: new Date().toISOString(),
            }
          : null;

        if (nextUser) {
          localStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(nextUser));
        }

        await refreshStaffUsers();
      };

      try {
        if (auth.currentUser && auth.currentUser.uid === targetUser.id && auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            cleanCurrentPassword,
          );
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, cleanPassword);
          await persistPasswordChange();
          return { ok: true, message: 'Password updated successfully.' };
        }

        const tempAppName = `password-change-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        try {
          const tempCredential = await signInWithEmailAndPassword(
            tempAuth,
            targetUser.email,
            cleanCurrentPassword,
          );
          await updatePassword(tempCredential.user, cleanPassword);
          await persistPasswordChange();
          await signOut(tempAuth);
        } finally {
          await deleteApp(tempApp);
        }
        return { ok: true, message: 'Password updated successfully.' };
      } catch {
        return { ok: false, message: 'Password update failed. Please verify the current password.' };
      }
    },
    [refreshStaffUsers, staffUsers, state.user],
  );

  const createStaffUser = useCallback(
    async (input: { name: string; email: string; role: UserRole; password: string; notes?: string }) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Halls Manager can add users.' };
      }

      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      const password = input.password.trim();
      const notes = input.notes?.trim() ?? '';
      if (!name) return { ok: false, message: 'Name is required.' };
      if (!email || !email.includes('@')) return { ok: false, message: 'Valid email is required.' };
      if (!ROLE_LABELS[input.role]) return { ok: false, message: 'Invalid role.' };
      if (password.length < 4) return { ok: false, message: 'Password must be at least 4 characters.' };

      const existing = staffUsers.find((entry) => entry.email.toLowerCase() === email);
      if (existing) {
        return { ok: false, message: 'A staff profile with this email already exists.' };
      }

      const tempAppName = `staff-create-${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
        await setDoc(doc(db, STAFF_COLLECTION, credential.user.uid), sanitizeFirestoreData({
          id: credential.user.uid,
          email,
          name,
          role: input.role,
          notes,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        }), { merge: true });

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

  const updateStaffNotes = useCallback(
    async (userId: string, notes: string) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Halls Manager can update user notes.' };
      }

      try {
        await updateDoc(doc(db, STAFF_COLLECTION, userId), sanitizeFirestoreData({
          notes: notes.trim(),
          updatedAt: serverTimestamp(),
        }));
        await refreshStaffUsers();
        return { ok: true, message: 'User notes updated successfully.' };
      } catch {
        return { ok: false, message: 'Failed to update user notes.' };
      }
    },
    [refreshStaffUsers, state.user],
  );

  const updateStaffRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Accountant or Halls Manager can change user roles.' };
      }

      if (!ROLE_LABELS[role]) {
        return { ok: false, message: 'Invalid target role.' };
      }

      try {
        await updateDoc(doc(db, STAFF_COLLECTION, userId), sanitizeFirestoreData({
          role,
          updatedAt: serverTimestamp(),
        }));
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
        return { ok: false, message: 'Only Accountant or Halls Manager can update user status.' };
      }

      if (state.user.id === userId && !isActive) {
        return { ok: false, message: 'You cannot deactivate your own account.' };
      }

      try {
        await updateDoc(doc(db, STAFF_COLLECTION, userId), sanitizeFirestoreData({
          isActive,
          updatedAt: serverTimestamp(),
        }));
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
        return { ok: false, message: 'Only Accountant or Halls Manager can remove users.' };
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
      return { ok: false, message: 'Only Accountant or Halls Manager can force logout all sessions.' };
    }

    try {
      const nowIso = new Date().toISOString();
      await setDoc(
        SESSION_CONTROL_REF,
        sanitizeFirestoreData({
          forceLogoutAt: nowIso,
          forcedByUserId: state.user.id,
          forcedByRole: state.user.role,
          writeToken: 'action_v1',
          clientActionNonce: crypto.randomUUID(),
          updatedAt: serverTimestamp(),
        }),
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
      updateStaffNotes,
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
      updateStaffNotes,
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
