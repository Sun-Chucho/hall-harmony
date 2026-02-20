import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  AuthState,
  PASSWORD_RESET_AUTHORITIES,
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
  updateStaffRole: (userId: string, role: UserRole) => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STAFF_COLLECTION = 'staff_users';
const DEFAULT_PASSWORD = '123456';
const LEGACY_PASSWORD_ALIAS = '1234';
const LOCAL_MD_SESSION_KEY = 'kuringe_local_md_session_v1';
const LOCAL_MD_USER = {
  id: 'md-local-edward-mushi',
  email: 'edward.mushi@kuringe.co.tz',
  name: 'Edward Mushi',
  role: 'managing_director' as const,
  isActive: true,
};
const LOCAL_MD_PASSWORD = '1234';

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

function buildLocalManagingDirectorUser(lastLogin?: string): User {
  return normalizeUser({
    ...LOCAL_MD_USER,
    createdAt: new Date().toISOString(),
    lastLogin,
  });
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
    const hasManagingDirector = directory.some(
      (item) => item.id === LOCAL_MD_USER.id || item.email.toLowerCase() === LOCAL_MD_USER.email.toLowerCase(),
    );
    setStaffUsers(hasManagingDirector ? directory : [buildLocalManagingDirectorUser(), ...directory]);
  }, []);

  useEffect(() => {
    void refreshStaffUsers();
  }, [refreshStaffUsers]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const localSessionRaw = localStorage.getItem(LOCAL_MD_SESSION_KEY);
        if (localSessionRaw) {
          try {
            const parsed = JSON.parse(localSessionRaw) as { lastLogin?: string };
            setState({
              user: buildLocalManagingDirectorUser(parsed.lastLogin),
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            localStorage.removeItem(LOCAL_MD_SESSION_KEY);
          }
        }

        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const profile = await fetchProfileByUid(firebaseUser.uid);
        if (!profile || !profile.isActive) {
          await signOut(auth);
          setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        setState({
          user: {
            ...profile,
            email: firebaseUser.email ?? profile.email,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return unsubscribe;
  }, []);

  const loginWithResult = useCallback(
    async (identifier: string, password: string): Promise<{ ok: boolean; message?: string }> => {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const targetUser = staffUsers.find(
        (item) => item.id === identifier || item.email.toLowerCase() === normalizedIdentifier,
      );
      if (
        identifier === LOCAL_MD_USER.id ||
        targetUser?.email.toLowerCase() === LOCAL_MD_USER.email.toLowerCase() ||
        normalizedIdentifier === LOCAL_MD_USER.email.toLowerCase() ||
        normalizedIdentifier === LOCAL_MD_USER.name.toLowerCase()
      ) {
        if (password.trim() !== LOCAL_MD_PASSWORD) {
          return { ok: false, message: 'Invalid Managing Director password.' };
        }
        const nowIso = new Date().toISOString();
        localStorage.setItem(LOCAL_MD_SESSION_KEY, JSON.stringify({ lastLogin: nowIso }));
        setState({
          user: buildLocalManagingDirectorUser(nowIso),
          isAuthenticated: true,
          isLoading: false,
        });
        return { ok: true };
      }
      localStorage.removeItem(LOCAL_MD_SESSION_KEY);

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
    localStorage.removeItem(LOCAL_MD_SESSION_KEY);
    await signOut(auth);
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
      if (targetUser.id === LOCAL_MD_USER.id) {
        return { ok: false, message: 'Managing Director password is fixed by system configuration.' };
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

  const updateStaffRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!state.user || !ROLE_CHANGE_AUTHORITIES.includes(state.user.role)) {
        return { ok: false, message: 'Only Controller or Hall Manager can change user roles.' };
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
      updateStaffRole,
    }),
    [changePassword, login, loginWithResult, logout, refreshStaffUsers, staffUsers, state, switchUser, updateStaffRole],
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
  return PASSWORD_RESET_AUTHORITIES.includes(role);
}
