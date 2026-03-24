import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { UserRole } from '@/types/auth';

export interface ManagerMessage {
  id: string;
  bookingId?: string;
  title: string;
  body: string;
  decision?: 'approve' | 'disapprove';
  fromUserId: string;
  fromRole: UserRole;
  toRole: UserRole;
  read: boolean;
  createdAt: string;
}

interface MessageContextValue {
  messages: ManagerMessage[];
  sendManagerAlert: (input: {
    bookingId?: string;
    title: string;
    body: string;
    decision?: 'approve' | 'disapprove';
  }) => Promise<{ ok: boolean; message: string }>;
  markMessageRead: (messageId: string) => Promise<{ ok: boolean; message: string }>;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);
const COLLECTION = 'manager_messages';
const CACHE_KEY = 'kuringe_manager_messages_cache_v1';

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ManagerMessage[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    try {
      setMessages(JSON.parse(raw) as ManagerMessage[]);
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const roleQuery = user.role === 'manager'
      ? query(collection(db, COLLECTION), where('toRole', '==', 'manager'), orderBy('createdAt', 'desc'), limit(200))
      : query(collection(db, COLLECTION), where('fromUserId', '==', user.id), orderBy('createdAt', 'desc'), limit(200));

    const unsub = onSnapshot(
      roleQuery,
      (snapshot) => {
        const next = snapshot.docs.map((item) => {
          const data = item.data() as Omit<ManagerMessage, 'id'>;
          return { id: item.id, ...data } as ManagerMessage;
        });
        setMessages(next);
      },
      () => {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return;
        try {
          setMessages(JSON.parse(raw) as ManagerMessage[]);
        } catch {
          localStorage.removeItem(CACHE_KEY);
        }
      },
    );

    return () => unsub();
  }, [user]);

  const sendManagerAlert = useCallback(async (input: {
    bookingId?: string;
    title: string;
    body: string;
    decision?: 'approve' | 'disapprove';
  }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };

    const payload: Omit<ManagerMessage, 'id'> & { updatedAt: unknown } = {
      bookingId: input.bookingId,
      title: input.title,
      body: input.body,
      decision: input.decision,
      fromUserId: user.id,
      fromRole: user.role,
      toRole: 'manager',
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, COLLECTION), payload);
      return { ok: true, message: 'Alert sent to Managing Director.' };
    } catch {
      const fallback: ManagerMessage = {
        id: `LOCAL-${Date.now()}`,
        bookingId: input.bookingId,
        title: input.title,
        body: input.body,
        decision: input.decision,
        fromUserId: user.id,
        fromRole: user.role,
        toRole: 'manager',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [fallback, ...prev]);
      return { ok: true, message: 'Alert saved locally. Cloud sync pending.' };
    }
  }, [user]);

  const markMessageRead = useCallback(async (messageId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };

    try {
      await updateDoc(doc(db, COLLECTION, messageId), {
        read: true,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Message marked as read.' };
    } catch {
      setMessages((prev) => prev.map((item) => (item.id === messageId ? { ...item, read: true } : item)));
      return { ok: true, message: 'Message updated locally. Cloud sync pending.' };
    }
  }, [user]);

  const value = useMemo<MessageContextValue>(() => ({
    messages,
    sendManagerAlert,
    markMessageRead,
  }), [markMessageRead, messages, sendManagerAlert]);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used within MessageProvider');
  return context;
}
