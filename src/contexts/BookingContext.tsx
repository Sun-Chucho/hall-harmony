import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { sanitizeFirestoreData } from '@/lib/firestoreData';
import { db } from '@/lib/firebase';
import { BookingCarType, BookingRecord, BookingStatus, CreateBookingInput, EventDetailStatus, PastBookingApprovalStatus } from '@/types/booking';
import { ROLE_LABELS, UserRole } from '@/types/auth';

interface BookingContextValue {
  bookings: BookingRecord[];
  syncState: 'live' | 'cached' | 'syncing';
  syncMessage: string | null;
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
const CAR_PRICES: Record<Exclude<BookingCarType, 'none'>, number> = {
  range_rover: 500000,
  lexus: 300000,
  bmw: 300000,
};

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

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && value in ROLE_LABELS;
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
    carBookedBy: data.carBookedBy ?? '',
    carLocation: data.carLocation ?? '',
    notes: data.notes ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
    createdByUserId: data.createdByUserId ?? '',
    createdByRole: isUserRole(data.createdByRole) ? data.createdByRole : undefined,
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

function getSyncFailureMessage(error: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You are offline. Firestore will sync this view when the connection returns.';
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  if (code.includes('permission-denied')) {
    return 'Backend rejected the booking update. Please sign in again and retry.';
  }
  if (code.includes('not-found')) {
    return 'Booking record was not found in backend. Refresh the page and retry.';
  }
  return 'Backend sync failed. Please retry.';
}

function upsertBookingRecord(records: BookingRecord[], record: BookingRecord): BookingRecord[] {
  const withoutTarget = records.filter((entry) => entry.id !== record.id);
  return [record, ...withoutTarget].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { policy, createApprovalRequest, reviewApproval } = useAuthorization();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [syncState, setSyncState] = useState<'live' | 'cached' | 'syncing'>('live');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setSyncState('live');
      setSyncMessage(null);
      return;
    }

    const q = query(collection(db, BOOKINGS_COLLECTION));
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => normalizeBooking(item.data() as Partial<BookingRecord>, item.id))
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
        setBookings(next);
        if (snapshot.metadata.hasPendingWrites) {
          setSyncState('syncing');
          setSyncMessage('Changes are stored locally and will finish syncing when the connection is stable.');
          return;
        }
        if (snapshot.metadata.fromCache) {
          setSyncState('cached');
          setSyncMessage('Showing Firestore cached data while waiting for the latest live update.');
          return;
        }
        setSyncState('live');
        setSyncMessage(null);
      },
      () => {
        setBookings([]);
        setSyncState('cached');
        setSyncMessage('Live booking sync is temporarily unavailable. Firestore cache will refresh when the connection returns.');
      },
    );

    return () => unsub();
  }, [user]);

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
    const bookingApproval = await createApprovalRequest({
      level: 'minor',
      module: 'booking',
      title: `Booking approval for ${payload.eventName}`,
      description: `${payload.hall} on ${payload.date} (${payload.startTime} - ${payload.endTime})`,
      targetReference: id,
    });

    const eventApproval = await createApprovalRequest({
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
      carBookedBy: payload.carBookedBy ?? '',
      carLocation: payload.carLocation ?? '',
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      createdByRole: user.role,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
      bookingApprovalId: bookingApproval.requestId,
      eventApprovalId: eventApproval.requestId,
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, id), sanitizeFirestoreData({
        ...record,
        updatedAt: serverTimestamp(),
      }));
      setBookings((prev) => upsertBookingRecord(prev, record));
      return { ok: true, message: 'Booking submitted for approval.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to save booking right now.') };
    }
  }, [bookings, createApprovalRequest, hasConflict, user]);

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
      carBookedBy: payload.carBookedBy ?? '',
      carLocation: payload.carLocation ?? '',
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: PUBLIC_BOOKING_USER_ID,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, record.id), sanitizeFirestoreData({
        ...record,
        updatedAt: serverTimestamp(),
      }));
      setBookings((prev) => upsertBookingRecord(prev, record));
      return { ok: true, message: 'Booking submitted directly. Staff will review and contact you shortly.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to submit booking right now.') };
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
      carBookedBy: payload.carBookedBy ?? '',
      carLocation: payload.carLocation ?? '',
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      createdByRole: user.role,
      bookingStatus: 'pending',
      eventDetailStatus: 'approved_controller',
      assignedToRole: 'cashier_1',
      sentToCashier1At: new Date().toISOString(),
      pastBookingSubmission: true,
      pastBookingApprovalStatus: 'pending_cashier_1',
    };

    try {
      await setDoc(doc(db, BOOKINGS_COLLECTION, id), sanitizeFirestoreData({
        ...record,
        updatedAt: serverTimestamp(),
      }));
      setBookings((prev) => upsertBookingRecord(prev, record));
      return { ok: true, message: 'Past booking recorded successfully.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to record past booking right now.') };
    }
  }, [bookings, hasConflict, user]);

  const reviewPastBooking = useCallback(async (
    bookingId: string,
    decision: Extract<PastBookingApprovalStatus, 'approved_cashier_1' | 'rejected_cashier_1'>,
  ) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'accountant') {
      return { ok: false, message: 'Only Cashier or Accountant can review past bookings.' };
    }
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };
    if (!target.pastBookingSubmission) return { ok: false, message: 'This booking is not in past-booking review flow.' };
    if (target.pastBookingApprovalStatus && target.pastBookingApprovalStatus !== 'pending_cashier_1') {
      return { ok: false, message: 'Past booking already reviewed.' };
    }

    const bookingStatus: BookingStatus = decision === 'approved_cashier_1' ? 'approved' : 'rejected';
    const patch = {
      bookingStatus,
      pastBookingApprovalStatus: decision,
      pastReviewedAt: new Date().toISOString(),
      pastReviewedByUserId: user.id,
      pastReviewedByRole: user.role,
    };

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
        ...patch,
        updatedAt: serverTimestamp(),
      }));
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, ...patch } : booking)));
      return { ok: true, message: decision === 'approved_cashier_1' ? 'Past booking approved by Cashier and moved to pending payment.' : 'Past booking rejected.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to review past booking right now.') };
    }
  }, [bookings, user]);

  const updateBooking = useCallback(async (bookingId: string, payload: CreateBookingInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const canEditAsRole = user.role === 'assistant_hall_manager' || user.role === 'manager' || user.role === 'accountant' || user.role === 'cashier_1';
    if (!canEditAsRole) {
      return { ok: false, message: 'Only Assistant Hall Manager, Halls Manager, Accountant, or Cashier can edit bookings.' };
    }
    const target = bookings.find((entry) => entry.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };
    const canEditAny = user.role === 'manager' || user.role === 'accountant' || user.role === 'cashier_1';
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
      carBookedBy: payload.carBookedBy ?? '',
      carLocation: payload.carLocation ?? '',
      notes: payload.notes?.trim() ?? '',
      lastEditedAt: new Date().toISOString(),
      lastEditedByUserId: user.id,
      lastEditedByRole: user.role,
      revision: (target.revision ?? 0) + 1,
      assignedToRole: target.assignedToRole ?? 'cashier_1',
      sentToCashier1At: target.sentToCashier1At ?? new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
        ...patch,
        updatedAt: serverTimestamp(),
      }));
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
      return { ok: true, message: 'Booking updated and highlighted across workflow.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to update booking right now.') };
    }
  }, [bookings, hasConflict, user]);

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
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
        bookingStatus: status,
        updatedAt: serverTimestamp(),
      }));
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, bookingStatus: status } : booking)),
      );
      return { ok: true, message: `Booking marked as ${status}.` };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to update booking status right now.') };
    }
  }, [bookings, reviewApproval, user]);

  const deleteBooking = useCallback(async (bookingId: string) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    const canDelete = user.role === 'manager' || user.role === 'accountant';
    if (!canDelete) {
      return { ok: false, message: 'Only Halls Manager or Accountant can delete bookings.' };
    }

    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
      return { ok: true, message: 'Booking deleted.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to delete booking right now.') };
    }
  }, [bookings, user]);

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
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
        eventType: eventType.trim(),
        expectedGuests,
        notes: notes.trim(),
        eventDetailStatus: 'pending_assistant',
        updatedAt: serverTimestamp(),
      }));
      return { ok: true, message: 'Event details submitted for approval.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to submit event details right now.') };
    }
  }, [bookings, user]);

  const updateEventDetailStatus = useCallback(async (bookingId: string, status: EventDetailStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    if (status === 'approved_assistant') {
      if (!target.eventApprovalId) return { ok: false, message: 'Missing assistant approval request.' };
      reviewApproval(target.eventApprovalId, 'approved', 'Event details approved by assistant');

      if (policy.finalApprovalRequired) {
        const finalApproval = await createApprovalRequest({
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
          await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
            eventDetailStatus: 'pending_controller',
            eventFinalApprovalId: finalApproval.requestId,
            updatedAt: serverTimestamp(),
          }));
          return { ok: true, message: 'Assistant approval recorded, pending accountant final approval.' };
        } catch (error) {
          return { ok: false, message: getSyncFailureMessage(error, 'Unable to save assistant approval right now.') };
        }
      }
    }

    if (status === 'approved_controller') {
      if (!target.eventFinalApprovalId) return { ok: false, message: 'Missing final approval request.' };
      reviewApproval(target.eventFinalApprovalId, 'approved', 'Event details approved by accountant');
    }

    if (status === 'rejected') {
      const approvalId = target.eventFinalApprovalId ?? target.eventApprovalId;
      if (!approvalId) return { ok: false, message: 'Missing approval request.' };
      reviewApproval(approvalId, 'rejected', 'Event details rejected');
    }

    if (status === 'pending_controller' && !policy.finalApprovalRequired) {
      return { ok: false, message: 'Final approval is disabled in policy.' };
    }

    try {
      await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), sanitizeFirestoreData({
        eventDetailStatus: status,
        updatedAt: serverTimestamp(),
      }));
      return { ok: true, message: 'Event detail status updated.' };
    } catch (error) {
      return { ok: false, message: getSyncFailureMessage(error, 'Unable to update event detail status right now.') };
    }
  }, [bookings, createApprovalRequest, policy.finalApprovalRequired, reviewApproval, user]);

  const value = useMemo<BookingContextValue>(() => ({
    bookings,
    syncState,
    syncMessage,
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
    syncMessage,
    syncState,
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
