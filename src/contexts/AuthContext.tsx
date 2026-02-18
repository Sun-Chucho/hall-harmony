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
  STAFF_USERS,
  User,
  UserRole,
} from '@/types/auth';
import { auth, db, firebaseConfig } from '@/lib/firebase';

interface AuthContextType extends AuthState {
  staffUsers: User[];
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  refreshStaffUsers: () => Promise<void>;
  updateStaffRole: (userId: string, role: UserRole) => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STAFF_COLLECTION = 'staff_users';
const DEFAULT_PASSWORD = '1234';

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
    if (snapshot.empty) {
      return STAFF_USERS;
    }

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
    return STAFF_USERS;
  }
}

async function fetchProfileByUid(uid: string): Promise<User | null> {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [staffUsers, setStaffUsers] = useState<User[]>(STAFF_USERS);

  const refreshStaffUsers = useCallback(async () => {
    const directory = await fetchStaffDirectory();
    setStaffUsers(directory);
  }, []);

  useEffect(() => {
    void refreshStaffUsers();
  }, [refreshStaffUsers]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
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

  const login = useCallback(
    async (identifier: string, password: string): Promise<boolean> => {
      const sourceUsers = staffUsers.length > 0 ? staffUsers : STAFF_USERS;
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const targetUser = sourceUsers.find(
        (item) => item.id === identifier || item.email.toLowerCase() === normalizedIdentifier,
      );

      if (!targetUser) {
        return false;
      }

      try {
        const credential = await signInWithEmailAndPassword(auth, targetUser.email, password || DEFAULT_PASSWORD);
        const profile = await fetchProfileByUid(credential.user.uid);
        if (!profile || !profile.isActive) {
          await signOut(auth);
          return false;
        }

        const nowIso = new Date().toISOString();
        await updateDoc(doc(db, STAFF_COLLECTION, profile.id), {
          lastLogin: nowIso,
          updatedAt: serverTimestamp(),
        });

        setState({
          user: {
            ...profile,
            lastLogin: nowIso,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } catch {
        return false;
      }
    },
    [staffUsers],
  );

  const logout = useCallback(async () => {
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
      if (cleanPassword.length < 4) {
        return { ok: false, message: 'New password must be at least 4 characters.' };
      }

      const sourceUsers = staffUsers.length > 0 ? staffUsers : STAFF_USERS;
      const targetUser = sourceUsers.find((item) => item.id === userId);
      if (!targetUser) {
        return { ok: false, message: 'Selected user account was not found.' };
      }

      try {
        if (auth.currentUser && auth.currentUser.uid === targetUser.id && auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, cleanPassword);
          return { ok: true, message: 'Password updated successfully.' };
        }

        const tempAppName = `password-change-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        const tempCredential = await signInWithEmailAndPassword(tempAuth, targetUser.email, currentPassword);
        await updatePassword(tempCredential.user, cleanPassword);
        await signOut(tempAuth);
        await deleteApp(tempApp);
        return { ok: true, message: 'Password updated successfully.' };
      } catch {
        return { ok: false, message: 'Password update failed. Please verify the current password.' };
      }
    },
    [staffUsers],
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
      logout,
      switchUser,
      changePassword,
      refreshStaffUsers,
      updateStaffRole,
    }),
    [changePassword, login, logout, refreshStaffUsers, staffUsers, state, switchUser, updateStaffRole],
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
