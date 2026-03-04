import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, QueryConstraint, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { db } from '@/lib/firebase';
import { BookingCarType, BookingRecord, BookingStatus, CreateBookingInput, EventDetailStatus, PastBookingApprovalStatus } from '@/types/booking';

interface BookingContextValue {
  bookings: BookingRecord[];
  createBooking: (payload: CreateBookingInput, options?: { actionId?: string }) => Promise<{ ok: boolean; message: string }>;
  createPastBooking: (payload: CreateBookingInput, options?: { actionId?: string }) => Promise<{ ok: boolean; message: string }>;
  reviewPastBooking: (
    bookingId: string,
    decision: Extract<PastBookingApprovalStatus, 'approved_cashier_1' | 'rejected_cashier_1'>,
  ) => Promise<{ ok: boolean; message: string }>;
  createPublicBooking: (payload: CreateBookingInput, requestId?: string) => Promise<{ ok: boolean; message: string }>;
  updateBooking: (bookingId: string, payload: CreateBookingInput) => Promise<{ ok: boolean; message: string }>;
  deleteBooking: (bookingId: string) => Promise<{ ok: boolean; message: string }>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<{ ok: boolean; message: string }>;
  submitEventDetails: (
    bookingId: string,
    eventType: string,
    expectedGuests: number,
    notes: string,
  ) => Promise<{ ok: boolean; message: string }>;
  updateEventDetailStatus: (bookingId: string, status: EventDetailStatus) => Promise<{ ok: boolean; message: string }>;
  hasConflict: (payload: CreateBookingInput, ignoreBookingId?: string) => boolean;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);
const PUBLIC_BOOKING_USER_ID = 'public-web';
const BOOKINGS_COLLECTION = 'bookings';
const BOOKING_CACHE_KEY = 'kuringe_bookings_v1';
const BOOKING_PENDING_ACTIONS_KEY = 'kuringe_bookings_pending_actions_v1';
const CAR_PRICES: Record<Exclude<BookingCarType, 'none'>, number> = {
  range_rover: 500000,
  lexus: 300000,
  bmw: 300000,
};

type BookingPatch = Partial<BookingRecord> & { updatedAt?: unknown };
type PendingBookingAction =
  | { id: string; type: 'set'; bookingId: string; record: BookingRecord }
  | { id: string; type: 'patch'; bookingId: string; patch: BookingPatch }
  | { id: string; type: 'delete'; bookingId: string };

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

function normalizeCarSelection(carType?: BookingCarType, carPrice?: number) {
  if (!carType || carType === 'none') {
    return { carType: 'none' as BookingCarType, carPrice: 0 };
  }
  const normalizedPrice = Number.isFinite(carPrice) && Number(carPrice) >= 0
    ? Math.round(Number(carPrice))
    : CAR_PRICES[carType as Exclude<BookingCarType, 'none'>] ?? 0;
  return {
    carType,
    carPrice: normalizedPrice,
  };
}

function normalizeBooking(data: Partial<BookingRecord>, id: string): BookingRecord {
  return {
    id,
    clientActionId: data.clientActionId,
    customerName: data.customerName ?? '',
    customerPhone: data.customerPhone ?? '',
    eventName: data.eventName ?? '',
    eventType: data.eventType ?? '',
    hall: data.hall ?? '',
    date: data.date ?? '',
    startTime: data.startTime ?? '',
    endTime: data.endTime ?? '',
    expectedGuests: Number(data.expectedGuests) || 0,
    quotedAmount: Number(data.quotedAmount) || 0,
    carType: (data.carType as BookingCarType) ?? 'none',
    carPrice: Number(data.carPrice) || 0,
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    createdByUserId: data.createdByUserId ?? '',
    bookingStatus: (data.bookingStatus as BookingStatus) ?? 'pending',
    eventDetailStatus: (data.eventDetailStatus as EventDetailStatus) ?? 'pending_assistant',
    assignedToRole: data.assignedToRole,
    sentToCashier1At: data.sentToCashier1At,
    bookingApprovalId: data.bookingApprovalId,
    eventApprovalId: data.eventApprovalId,
    eventFinalApprovalId: data.eventFinalApprovalId,
    revision: Number(data.revision) || 0,
    lastEditedAt: data.lastEditedAt,
    lastEditedByUserId: data.lastEditedByUserId,
    lastEditedByRole: data.lastEditedByRole,
    pastBookingSubmission: data.pastBookingSubmission,
    pastBookingApprovalStatus: data.pastBookingApprovalStatus,
    pastReviewedAt: data.pastReviewedAt,
    pastReviewedByUserId: data.pastReviewedByUserId,
    pastReviewedByRole: data.pastReviewedByRole,
  };
}

function normalizeRequestId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
}

function normalizeActionId(value?: string): string {
  return (value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function createPendingActionId() {
  return `BOOK-PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRetryableSyncError(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    code.includes('resource-exhausted')
    || code.includes('unavailable')
    || code.includes('deadline-exceeded')
    || code.includes('failed-precondition')
    || code.includes('internal')
    || message.includes('quota')
    || message.includes('limit')
    || message.includes('network')
    || message.includes('offline')
  );
}

function applyPendingActions(records: BookingRecord[], actions: PendingBookingAction[]): BookingRecord[] {
  if (actions.length === 0) return records;
  return actions.reduce<BookingRecord[]>((current, action) => {
    if (action.type === 'set') {
      const withoutTarget = current.filter((entry) => entry.id !== action.bookingId);
      return [action.record, ...withoutTarget];
    }
    if (action.type === 'patch') {
      return current.map((entry) => (
        entry.id === action.bookingId
          ? {
              ...entry,
              ...action.patch,
            }
          : entry
      ));
    }
    return current.filter((entry) => entry.id !== action.bookingId);
  }, records);
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { policy, createApprovalRequest, reviewApproval } = useAuthorization();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingBookingAction[]>([]);
  const pendingActionsRef = useRef<PendingBookingAction[]>([]);
  const isSyncingRef = useRef(false);

  const queuePendingAction = useCallback((action: Omit<PendingBookingAction, 'id'>) => {
    setPendingActions((prev) => [...prev, { ...action, id: createPendingActionId() }]);
  }, []);

  useEffect(() => {
    pendingActionsRef.current = pendingActions;
  }, [pendingActions]);

  const syncPendingActions = useCallback(async () => {
    if (!user || isSyncingRef.current || pendingActionsRef.current.length === 0) return;
    isSyncingRef.current = true;
    try {
      for (const action of [...pendingActionsRef.current]) {
        try {
          if (action.type === 'set') {
            await setDoc(doc(db, BOOKINGS_COLLECTION, action.bookingId), {
              ...action.record,
              updatedAt: serverTimestamp(),
            });
          } else if (action.type === 'patch') {
            await updateDoc(doc(db, BOOKINGS_COLLECTION, action.bookingId), {
              ...action.patch,
              updatedAt: serverTimestamp(),
            });
          } else {
            await deleteDoc(doc(db, BOOKINGS_COLLECTION, action.bookingId));
          }
          setPendingActions((prev) => prev.filter((entry) => entry.id !== action.id));
        } catch (error) {
          if (!isRetryableSyncError(error)) {
            setPendingActions((prev) => prev.filter((entry) => entry.id !== action.id));
            continue;
          }
          break;
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    const raw = localStorage.getItem(BOOKING_CACHE_KEY);
    if (!raw) return;
    try {
      setBookings(JSON.parse(raw) as BookingRecord[]);
    } catch {
      localStorage.removeItem(BOOKING_CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(BOOKING_PENDING_ACTIONS_KEY);
    if (!raw) return;
    try {
      setPendingActions(JSON.parse(raw) as PendingBookingAction[]);
    } catch {
      localStorage.removeItem(BOOKING_PENDING_ACTIONS_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(BOOKING_CACHE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(BOOKING_PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
    setBookings((prev) => applyPendingActions(prev, pendingActions));
    if (pendingActions.length > 0) {
      void syncPendingActions();
    }
  }, [pendingActions, syncPendingActions]);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    const constraints: QueryConstraint[] = [];
    if (user.role === 'assistant_hall_manager') {
      constraints.push(where('createdByUserId', '==', user.id));
    }
    const q = constraints.length > 0
      ? query(collection(db, BOOKINGS_COLLECTION), ...constraints)
      : query(collection(db, BOOKINGS_COLLECTION));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => normalizeBooking(item.data() as Partial<BookingRecord>, item.id))
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        setBookings(applyPendingActions(next, pendingActionsRef.current));
        if (pendingActionsRef.current.length > 0) {
          void syncPendingActions();
        }
      },
      () => {
        const raw = localStorage.getItem(BOOKING_CACHE_KEY);
        if (!raw) return;
        try {
          const cached = JSON.parse(raw) as BookingRecord[];
          setBookings(applyPendingActions(cached, pendingActionsRef.current));
        } catch {
          localStorage.removeItem(BOOKING_CACHE_KEY);
        }
      },
    );

    return () => unsub();
  }, [syncPendingActions, user]);

  useEffect(() => {
    if (!user) return undefined;
    if (typeof window === 'undefined') return undefined;
    const onOnline = () => {
      void syncPendingActions();
    };
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(() => {
      void syncPendingActions();
    }, 15000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
  }, [syncPendingActions, user]);

  const hasConflict = useCallback((payload: CreateBookingInput, ignoreBookingId?: string) => {
    return bookings.some((booking) => {
      if (ignoreBookingId && booking.id === ignoreBookingId) return false;
      if (booking.hall !== payload.hall) return false;
      if (booking.date !== payload.date) return false;
      if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'rejected') return false;
      return overlaps(booking.startTime, booking.endTime, payload.startTime, payload.endTime);
    });
  }, [bookings]);

  const createBooking = useCallback(async (payload: CreateBookingInput, options?: { actionId?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (!payload.customerName || !payload.customerPhone || !payload.eventName || !payload.eventType) {
      return { ok: false, message: 'Customer and event details are required.' };
    }
    if (!payload.hall || !payload.date || !payload.startTime || !payload.endTime) {
      return { ok: false, message: 'Hall, date, and time window are required.' };
    }
    if (toMinutes(payload.endTime) <= toMinutes(payload.startTime)) {
      return { ok: false, message: 'End time must be later than start time.' };
    }
    if (payload.expectedGuests <= 0) {
      return { ok: false, message: 'Expected guests must be greater than zero.' };
    }
    if (payload.quotedAmount <= 0) {
      return { ok: false, message: 'Quoted amount must be greater than zero.' };
    }
    if (hasConflict(payload)) {
      return { ok: false, message: 'Booking conflict detected for the selected hall and time.' };
    }

    const actionId = normalizeActionId(options?.actionId);
    const id = actionId ? `BOOK-ACT-${actionId}` : `BOOK-${Date.now()}`;
    if (actionId && bookings.some((entry) => entry.clientActionId === actionId)) {
      return { ok: true, message: 'Booking already submitted.' };
    }
    if (actionId) {
      const existing = await getDoc(doc(db, BOOKINGS_COLLECTION, id));
      if (existing.exists()) {
        return { ok: true, message: 'Booking already submitted.' };
      }
    }
    const bookingApproval = createApprovalRequest({
      level: 'minor',
      module: 'booking',
      title: `Booking approval for ${payload.eventName}`,
      description: `${payload.hall} on ${payload.date} (${payload.startTime} - ${payload.endTime})`,
      targetReference: id,
    });

    const eventApproval = createApprovalRequest({
      level: 'minor',
      module: 'event',
      title: `Event detail approval for ${payload.eventName}`,
      description: `${payload.eventType}, ${payload.expectedGuests} guests`,
      targetReference: `${id}-EVENT`,
    });

    if (!bookingApproval.ok || !eventApproval.ok) {
      return { ok: false, message: bookingApproval.message || eventApproval.message };
    }

    const record: BookingRecord = {
      id,
      clientActionId: actionId || undefined,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      eventName: payload.eventName.trim(),
      eventType: payload.eventType.trim(),
      hall: payload.hall.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      expectedGuests: payload.expectedGuests,
      quotedAmount: payload.quotedAmount,
      ...normalizeCarSelection(payload.carType, payload.carPrice),
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
      bookingApprovalId: bookingApproval.requestId,
      eventApprovalId: eventApproval.requestId,
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, id), {
        ...record,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Booking submitted for approval.' };
    } catch {
      setBookings((prev) => [record, ...prev]);
      queuePendingAction({ type: 'set', bookingId: id, record });
      return { ok: true, message: 'Booking saved locally. Cloud sync will retry when connection is restored.' };
    }
  }, [bookings, createApprovalRequest, hasConflict, queuePendingAction, user]);

  const createPublicBooking = useCallback(async (payload: CreateBookingInput, requestId?: string) => {
    if (!payload.customerName || !payload.customerPhone || !payload.eventName || !payload.eventType) {
      return { ok: false, message: 'Customer and event details are required.' };
    }
    if (!payload.hall || !payload.date || !payload.startTime || !payload.endTime) {
      return { ok: false, message: 'Hall, date, and time window are required.' };
    }
    if (toMinutes(payload.endTime) <= toMinutes(payload.startTime)) {
      return { ok: false, message: 'End time must be later than start time.' };
    }
    if (payload.expectedGuests <= 0) {
      return { ok: false, message: 'Expected guests must be greater than zero.' };
    }
    if (payload.quotedAmount <= 0) {
      return { ok: false, message: 'Quoted amount must be greater than zero.' };
    }

    const normalizedRequestId = requestId ? normalizeRequestId(requestId) : '';
    const bookingId = normalizedRequestId ? `BOOK-${normalizedRequestId}` : `BOOK-${Date.now()}`;

    const record: BookingRecord = {
      id: bookingId,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      eventName: payload.eventName.trim(),
      eventType: payload.eventType.trim(),
      hall: payload.hall.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      expectedGuests: payload.expectedGuests,
      quotedAmount: payload.quotedAmount,
      ...normalizeCarSelection(payload.carType, payload.carPrice),
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: PUBLIC_BOOKING_USER_ID,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, record.id), {
        ...record,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Booking submitted directly. Staff will review and contact you shortly.' };
    } catch {
      return { ok: false, message: 'Unable to submit booking to backend right now. Please check connection and try again.' };
    }
  }, []);

  const createPastBooking = useCallback(async (payload: CreateBookingInput, options?: { actionId?: string }) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'assistant_hall_manager') {
      return { ok: false, message: 'Only Assistant Hall Manager can record past bookings.' };
    }
    if (!payload.customerName || !payload.customerPhone || !payload.eventName || !payload.eventType) {
      return { ok: false, message: 'Customer and event details are required.' };
    }
    if (!payload.hall || !payload.date || !payload.startTime || !payload.endTime) {
      return { ok: false, message: 'Hall, date, and time window are required.' };
    }
    if (toMinutes(payload.endTime) <= toMinutes(payload.startTime)) {
      return { ok: false, message: 'End time must be later than start time.' };
    }
    if (payload.expectedGuests <= 0) {
      return { ok: false, message: 'Expected guests must be greater than zero.' };
    }
    if (payload.quotedAmount <= 0) {
      return { ok: false, message: 'Quoted amount must be greater than zero.' };
    }

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const yearStartIso = `${now.getUTCFullYear()}-01-01`;
    if (payload.date < yearStartIso || payload.date > todayIso) {
      return { ok: false, message: `Past booking date must be between ${yearStartIso} and ${todayIso}.` };
    }
    if (hasConflict(payload)) {
      return { ok: false, message: 'Booking conflict detected for the selected hall and time.' };
    }

    const actionId = normalizeActionId(options?.actionId);
    const id = actionId ? `BOOK-PAST-ACT-${actionId}` : `BOOK-PAST-${Date.now()}`;
    if (actionId && bookings.some((entry) => entry.clientActionId === actionId)) {
      return { ok: true, message: 'Past booking already submitted.' };
    }
    if (actionId) {
      const existing = await getDoc(doc(db, BOOKINGS_COLLECTION, id));
      if (existing.exists()) {
        return { ok: true, message: 'Past booking already submitted.' };
      }
    }
    const record: BookingRecord = {
      id,
      clientActionId: actionId || undefined,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      eventName: payload.eventName.trim(),
      eventType: payload.eventType.trim(),
      hall: payload.hall.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      expectedGuests: payload.expectedGuests,
      quotedAmount: payload.quotedAmount,
      ...normalizeCarSelection(payload.carType, payload.carPrice),
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      bookingStatus: 'pending',
      eventDetailStatus: 'approved_controller',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
      pastBookingSubmission: true,
      pastBookingApprovalStatus: 'pending_cashier_1',
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, id), {
        ...record,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Past booking recorded successfully.' };
    } catch {
      setBookings((prev) => [record, ...prev]);
      queuePendingAction({ type: 'set', bookingId: id, record });
      return { ok: true, message: 'Past booking saved locally. Cloud sync pending.' };
    }
  }, [bookings, hasConflict, queuePendingAction, user]);

  const reviewPastBooking = useCallback(async (
    bookingId: string,
    decision: Extract<PastBookingApprovalStatus, 'approved_cashier_1' | 'rejected_cashier_1'>,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can review past bookings.' };
    }
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };
    if (!target.pastBookingSubmission) return { ok: false, message: 'This booking is not in past-booking review flow.' };
    if (target.pastBookingApprovalStatus && target.pastBookingApprovalStatus !== 'pending_cashier_1') {
      return { ok: false, message: 'Past booking already reviewed.' };
    }

    const bookingStatus: BookingStatus = decision === 'approved_cashier_1' ? 'completed' : 'rejected';
    const patch = {
      bookingStatus,
      pastBookingApprovalStatus: decision,
      pastReviewedAt: new Date().toISOString(),
      pastReviewedByUserId: user.id,
      pastReviewedByRole: user.role,
    };

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: decision === 'approved_cashier_1' ? 'Past booking approved by Cashier 1.' : 'Past booking rejected.' };
    } catch {
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, ...patch } : booking)));
      queuePendingAction({ type: 'patch', bookingId, patch });
      return { ok: true, message: 'Past booking review saved locally. Cloud sync pending.' };
    }
  }, [bookings, queuePendingAction, user]);

  const updateBooking = useCallback(async (bookingId: string, payload: CreateBookingInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const canEditAsRole = user.role === 'assistant_hall_manager' || user.role === 'manager' || user.role === 'controller';
    if (!canEditAsRole) {
      return { ok: false, message: 'Only Assistant Hall Manager, Hall Manager, or Controller can edit bookings.' };
    }
    const target = bookings.find((entry) => entry.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };
    const canEditAny = user.role === 'manager' || user.role === 'controller';
    if (!canEditAny && target.createdByUserId !== user.id) {
      return { ok: false, message: 'You can only edit your own bookings.' };
    }

    if (!payload.customerName || !payload.customerPhone || !payload.eventName || !payload.eventType) {
      return { ok: false, message: 'Customer and event details are required.' };
    }
    if (!payload.hall || !payload.date || !payload.startTime || !payload.endTime) {
      return { ok: false, message: 'Hall, date, and time window are required.' };
    }
    if (toMinutes(payload.endTime) <= toMinutes(payload.startTime)) {
      return { ok: false, message: 'End time must be later than start time.' };
    }
    if (payload.expectedGuests <= 0) {
      return { ok: false, message: 'Expected guests must be greater than zero.' };
    }
    if (payload.quotedAmount <= 0) {
      return { ok: false, message: 'Quoted amount must be greater than zero.' };
    }
    if (hasConflict(payload, bookingId)) {
      return { ok: false, message: 'Booking conflict detected for the selected hall and time.' };
    }

    const patch = {
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      eventName: payload.eventName.trim(),
      eventType: payload.eventType.trim(),
      hall: payload.hall.trim(),
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      expectedGuests: payload.expectedGuests,
      quotedAmount: payload.quotedAmount,
      ...normalizeCarSelection(payload.carType, payload.carPrice),
      notes: payload.notes?.trim() ?? '',
      lastEditedAt: new Date().toISOString(),
      lastEditedByUserId: user.id,
      lastEditedByRole: user.role,
      revision: (target.revision ?? 0) + 1,
      assignedToRole: target.assignedToRole ?? 'cashier_1',
      sentToCashier1At: target.sentToCashier1At ?? new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Booking updated and highlighted across workflow.' };
    } catch {
      setBookings((prev) =>
        prev.map((entry) =>
          entry.id === bookingId
            ? {
                ...entry,
                ...patch,
              }
            : entry,
        ),
      );
      queuePendingAction({ type: 'patch', bookingId, patch });
      return { ok: true, message: 'Booking updated locally. Cloud sync pending.' };
    }
  }, [bookings, hasConflict, queuePendingAction, user]);

  const updateBookingStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    if (status === 'approved' && target.bookingStatus === 'pending') {
      reviewApproval(target.bookingApprovalId ?? '', 'approved', 'Booking approved through workflow');
    }
    if (status === 'rejected' && target.bookingStatus === 'pending') {
      reviewApproval(target.bookingApprovalId ?? '', 'rejected', 'Booking rejected through workflow');
    }

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
        bookingStatus: status,
        updatedAt: serverTimestamp(),
      });
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, bookingStatus: status } : booking)),
      );
      return { ok: true, message: `Booking marked as ${status}.` };
    } catch {
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, bookingStatus: status } : booking)),
      );
      queuePendingAction({ type: 'patch', bookingId, patch: { bookingStatus: status } });
      return { ok: true, message: 'Booking status saved locally. Cloud sync pending.' };
    }
  }, [bookings, queuePendingAction, reviewApproval, user]);

  const deleteBooking = useCallback(async (bookingId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    const isManagerOrController = user.role === 'manager' || user.role === 'controller';
    const isOwner = target.createdByUserId === user.id;
    if (!isManagerOrController && !isOwner) {
      return { ok: false, message: 'You can only delete your own bookings.' };
    }

    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
      return { ok: true, message: 'Booking deleted.' };
    } catch {
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      queuePendingAction({ type: 'delete', bookingId });
      return { ok: true, message: 'Booking deleted locally. Cloud sync pending.' };
    }
  }, [bookings, queuePendingAction, user]);

  const submitEventDetails = useCallback(async (
    bookingId: string,
    eventType: string,
    expectedGuests: number,
    notes: string,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };
    if (!eventType.trim() || expectedGuests <= 0) {
      return { ok: false, message: 'Valid event type and guest count are required.' };
    }

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
        eventType: eventType.trim(),
        expectedGuests,
        notes: notes.trim(),
        eventDetailStatus: 'pending_assistant',
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Event details submitted for approval.' };
    } catch {
      const patch = {
        eventType: eventType.trim(),
        expectedGuests,
        notes: notes.trim(),
        eventDetailStatus: 'pending_assistant' as EventDetailStatus,
      };
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                ...patch,
              }
            : booking,
        ),
      );
      queuePendingAction({ type: 'patch', bookingId, patch });
      return { ok: true, message: 'Event details saved locally. Cloud sync pending.' };
    }
  }, [bookings, queuePendingAction, user]);

  const updateEventDetailStatus = useCallback(async (bookingId: string, status: EventDetailStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    if (status === 'approved_assistant') {
      if (!target.eventApprovalId) return { ok: false, message: 'Missing assistant approval request.' };
      reviewApproval(target.eventApprovalId, 'approved', 'Event details approved by assistant');

      if (policy.finalApprovalRequired) {
        const finalApproval = createApprovalRequest({
          level: 'final',
          module: 'event',
          title: `Final event authorization for ${target.eventName}`,
          description: `${target.eventType}, ${target.expectedGuests} guests`,
          targetReference: `${target.id}-EVENT-FINAL`,
        });

        if (!finalApproval.ok) {
          return { ok: false, message: finalApproval.message };
        }

        try {
          await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
            eventDetailStatus: 'pending_controller',
            eventFinalApprovalId: finalApproval.requestId,
            updatedAt: serverTimestamp(),
          });
          return { ok: true, message: 'Assistant approval recorded, pending controller final approval.' };
        } catch {
          const patch = {
            eventDetailStatus: 'pending_controller' as EventDetailStatus,
            eventFinalApprovalId: finalApproval.requestId,
          };
          setBookings((prev) =>
            prev.map((booking) => (booking.id === bookingId ? { ...booking, ...patch } : booking)),
          );
          queuePendingAction({ type: 'patch', bookingId, patch });
          return { ok: true, message: 'Assistant approval saved locally. Cloud sync pending.' };
        }
      }
    }

    if (status === 'approved_controller') {
      if (!target.eventFinalApprovalId) return { ok: false, message: 'Missing final approval request.' };
      reviewApproval(target.eventFinalApprovalId, 'approved', 'Event details approved by controller');
    }

    if (status === 'rejected') {
      const approvalId = target.eventFinalApprovalId ?? target.eventApprovalId;
      if (!approvalId) return { ok: false, message: 'Missing approval request.' };
      reviewApproval(approvalId, 'rejected', 'Event details rejected');
    }

    if (status === 'pending_controller' && !policy.finalApprovalRequired) {
      return { ok: false, message: 'Controller final approval is disabled in policy.' };
    }

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
        eventDetailStatus: status,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Event detail status updated.' };
    } catch {
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, eventDetailStatus: status } : booking)),
      );
      queuePendingAction({ type: 'patch', bookingId, patch: { eventDetailStatus: status } });
      return { ok: true, message: 'Event detail status saved locally. Cloud sync pending.' };
    }
  }, [bookings, createApprovalRequest, policy.finalApprovalRequired, queuePendingAction, reviewApproval, user]);

  const value = useMemo<BookingContextValue>(() => ({
    bookings,
    createBooking,
    createPastBooking,
    reviewPastBooking,
    createPublicBooking,
    deleteBooking,
    updateBooking,
    updateBookingStatus,
    submitEventDetails,
    updateEventDetailStatus,
    hasConflict,
  }), [
    bookings,
    createBooking,
    createPastBooking,
    reviewPastBooking,
    createPublicBooking,
    deleteBooking,
    hasConflict,
    submitEventDetails,
    updateBooking,
    updateBookingStatus,
    updateEventDetailStatus,
  ]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookings must be used within BookingProvider');
  return context;
}
