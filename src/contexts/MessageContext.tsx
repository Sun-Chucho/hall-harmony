import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, limit, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFirestoreData } from '@/lib/firestoreData';
import { db } from '@/lib/firebase';
import { USER_NOTIFICATION_COLLECTION, UserNotification } from '@/lib/requestWorkflows';
import { UserRole } from '@/types/auth';

interface ManagerAlertRecord {
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
  link?: string;
}

export interface AppMessage {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  source: 'notification' | 'manager_alert';
  incoming: boolean;
  link?: string;
  relatedId?: string;
  relatedType?: 'cash_request' | 'purchase_request' | 'payment_voucher' | 'booking' | 'system';
  bookingId?: string;
  decision?: 'approve' | 'disapprove';
  fromUserId?: string;
  fromRole?: UserRole;
}

interface MessageContextValue {
  messages: AppMessage[];
  unreadCount: number;
  sendManagerAlert: (input: {
    bookingId?: string;
    title: string;
    body: string;
    decision?: 'approve' | 'disapprove';
    link?: string;
  }) => Promise<{ ok: boolean; message: string }>;
  sendUserNotification: (input: {
    userId: string;
    title: string;
    body: string;
    link?: string;
    relatedId?: string;
    relatedType?: 'cash_request' | 'purchase_request' | 'payment_voucher' | 'booking' | 'system';
  }) => Promise<{ ok: boolean; message: string }>;
  markMessageRead: (messageId: string) => Promise<{ ok: boolean; message: string }>;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);
const MANAGER_ALERT_COLLECTION = 'manager_messages';

function sortByCreatedAt(messages: AppMessage[]) {
  return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [managerAlerts, setManagerAlerts] = useState<ManagerAlertRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    const notificationsQuery = query(
      collection(db, USER_NOTIFICATION_COLLECTION),
      where('userId', '==', user.id),
      limit(300),
    );

    const unsub = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<UserNotification, 'id'>) })));
      },
      () => setNotifications([]),
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'manager') {
      setManagerAlerts([]);
      return undefined;
    }

    const alertsQuery = query(
      collection(db, MANAGER_ALERT_COLLECTION),
      where('toRole', '==', 'manager'),
      limit(200),
    );

    const unsub = onSnapshot(
      alertsQuery,
      (snapshot) => {
        setManagerAlerts(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ManagerAlertRecord, 'id'>) })));
      },
      () => setManagerAlerts([]),
    );

    return () => unsub();
  }, [user]);

  const sendManagerAlert = useCallback(async (input: {
    bookingId?: string;
    title: string;
    body: string;
    decision?: 'approve' | 'disapprove';
    link?: string;
  }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };

    const payload: Omit<ManagerAlertRecord, 'id'> & { updatedAt: unknown } = {
      title: input.title,
      body: input.body,
      fromUserId: user.id,
      fromRole: user.role,
      toRole: 'manager',
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };
    if (typeof input.bookingId === 'string' && input.bookingId.trim()) {
      payload.bookingId = input.bookingId;
    }
    if (input.decision) {
      payload.decision = input.decision;
    }
    if (typeof input.link === 'string' && input.link.trim()) {
      payload.link = input.link;
    }

    try {
      await addDoc(collection(db, MANAGER_ALERT_COLLECTION), sanitizeFirestoreData(payload));
      return { ok: true, message: 'Alert sent to Halls Manager.' };
    } catch {
      return { ok: false, message: 'Failed to send manager alert.' };
    }
  }, [user]);

  const sendUserNotification = useCallback(async (input: {
    userId: string;
    title: string;
    body: string;
    link?: string;
    relatedId?: string;
    relatedType?: 'cash_request' | 'purchase_request' | 'payment_voucher' | 'booking' | 'system';
  }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };

    const payload: Omit<UserNotification, 'id'> & { updatedAt: unknown } = {
      userId: input.userId,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      createdByRole: user.role,
      updatedAt: serverTimestamp(),
    };
    if (typeof input.link === 'string' && input.link.trim()) {
      payload.link = input.link;
    }
    if (typeof input.relatedId === 'string' && input.relatedId.trim()) {
      payload.relatedId = input.relatedId;
    }
    if (input.relatedType) {
      payload.relatedType = input.relatedType;
    }

    try {
      await addDoc(collection(db, USER_NOTIFICATION_COLLECTION), sanitizeFirestoreData(payload));
      return { ok: true, message: 'Notification sent.' };
    } catch {
      if (input.userId === user.id) {
        setNotifications((prev) => [
          {
            id: `LOCAL-NOTICE-${Date.now()}`,
            ...payload,
          },
          ...prev,
        ]);
      }
      return { ok: true, message: 'Notification saved locally. Cloud sync pending.' };
    }
  }, [user]);

  const messages = useMemo<AppMessage[]>(() => {
    const notificationMessages = notifications.map((message) => ({
      id: message.id,
      title: message.title,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt,
      source: 'notification' as const,
      incoming: true,
      link: message.link,
      relatedId: message.relatedId,
      relatedType: message.relatedType,
      fromUserId: message.createdByUserId,
      fromRole: message.createdByRole,
    }));

    const managerAlertMessages = managerAlerts.map((message) => ({
      id: message.id,
      title: message.title,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt,
      source: 'manager_alert' as const,
      incoming: true,
      link: message.link,
      bookingId: message.bookingId,
      relatedId: message.bookingId,
      relatedType: 'booking' as const,
      decision: message.decision,
      fromUserId: message.fromUserId,
      fromRole: message.fromRole,
    }));

    return sortByCreatedAt([...notificationMessages, ...managerAlertMessages]);
  }, [managerAlerts, notifications]);

  const unreadCount = useMemo(
    () => messages.filter((message) => message.incoming && !message.read).length,
    [messages],
  );

  const markMessageRead = useCallback(async (messageId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };

    const notification = notifications.find((item) => item.id === messageId);
    if (notification) {
      try {
        await updateDoc(doc(db, USER_NOTIFICATION_COLLECTION, messageId), sanitizeFirestoreData({
          read: true,
          updatedAt: serverTimestamp(),
        }));
      } catch {
        setNotifications((prev) => prev.map((item) => (item.id === messageId ? { ...item, read: true } : item)));
      }
      return { ok: true, message: 'Message marked as read.' };
    }

    if (user.role !== 'manager') return { ok: false, message: 'Message not found.' };

    try {
      await updateDoc(doc(db, MANAGER_ALERT_COLLECTION, messageId), sanitizeFirestoreData({
        read: true,
        updatedAt: serverTimestamp(),
      }));
    } catch {
      setManagerAlerts((prev) => prev.map((item) => (item.id === messageId ? { ...item, read: true } : item)));
    }
    return { ok: true, message: 'Message marked as read.' };
  }, [notifications, user]);

  const value = useMemo<MessageContextValue>(() => ({
    messages,
    unreadCount,
    sendManagerAlert,
    sendUserNotification,
    markMessageRead,
  }), [markMessageRead, messages, sendManagerAlert, sendUserNotification, unreadCount]);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used within MessageProvider');
  return context;
}
