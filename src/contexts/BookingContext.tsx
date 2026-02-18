import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { BookingRecord, BookingStatus, CreateBookingInput, EventDetailStatus } from '@/types/booking';

interface BookingContextValue {
  bookings: BookingRecord[];
  createBooking: (payload: CreateBookingInput) => { ok: boolean; message: string };
  updateBookingStatus: (bookingId: string, status: BookingStatus) => { ok: boolean; message: string };
  submitEventDetails: (
    bookingId: string,
    eventType: string,
    expectedGuests: number,
    notes: string,
  ) => { ok: boolean; message: string };
  updateEventDetailStatus: (bookingId: string, status: EventDetailStatus) => { ok: boolean; message: string };
  hasConflict: (payload: CreateBookingInput, ignoreBookingId?: string) => boolean;
}

const STORAGE_KEY = 'kuringe_bookings_v1';
const BookingContext = createContext<BookingContextValue | undefined>(undefined);

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { policy, createApprovalRequest, reviewApproval } = useAuthorization();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setBookings(JSON.parse(raw) as BookingRecord[]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const hasConflict = useCallback((payload: CreateBookingInput, ignoreBookingId?: string) => {
    return bookings.some((booking) => {
      if (ignoreBookingId && booking.id === ignoreBookingId) return false;
      if (booking.hall !== payload.hall) return false;
      if (booking.date !== payload.date) return false;
      if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'rejected') return false;
      return overlaps(booking.startTime, booking.endTime, payload.startTime, payload.endTime);
    });
  }, [bookings]);

  const createBooking = useCallback((payload: CreateBookingInput) => {
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

    const id = `BOOK-${Date.now()}`;
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
      notes: payload.notes?.trim() ?? '',
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
      bookingStatus: 'pending',
      eventDetailStatus: 'pending_assistant',
      bookingApprovalId: bookingApproval.requestId,
      eventApprovalId: eventApproval.requestId,
    };
    setBookings((prev) => [record, ...prev]);
    return { ok: true, message: 'Booking submitted for approval.' };
  }, [createApprovalRequest, hasConflict, policy.finalApprovalRequired, user]);

  const updateBookingStatus = useCallback((bookingId: string, status: BookingStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target) return { ok: false, message: 'Booking not found.' };

    if (status === 'approved' && target.bookingStatus === 'pending') {
      reviewApproval(target.bookingApprovalId ?? '', 'approved', 'Booking approved through workflow');
    }
    if (status === 'rejected' && target.bookingStatus === 'pending') {
      reviewApproval(target.bookingApprovalId ?? '', 'rejected', 'Booking rejected through workflow');
    }

    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? { ...booking, bookingStatus: status } : booking)),
    );
    return { ok: true, message: `Booking marked as ${status}.` };
  }, [bookings, reviewApproval, user]);

  const submitEventDetails = useCallback((
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

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              eventType: eventType.trim(),
              expectedGuests,
              notes: notes.trim(),
              eventDetailStatus: 'pending_assistant',
            }
          : booking,
      ),
    );
    return { ok: true, message: 'Event details submitted for approval.' };
  }, [bookings, policy.finalApprovalRequired, user]);

  const updateEventDetailStatus = useCallback((bookingId: string, status: EventDetailStatus) => {
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

        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  eventDetailStatus: 'pending_controller',
                  eventFinalApprovalId: finalApproval.requestId,
                }
              : booking,
          ),
        );
        return { ok: true, message: 'Assistant approval recorded, pending controller final approval.' };
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

    if (status === 'approved_controller' || status === 'rejected' || status === 'approved_assistant') {
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, eventDetailStatus: status } : booking)),
      );
      return { ok: true, message: 'Event detail status updated.' };
    }

    if (status === 'pending_controller' && !policy.finalApprovalRequired) {
      return { ok: false, message: 'Controller final approval is disabled in policy.' };
    }
    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? { ...booking, eventDetailStatus: status } : booking)),
    );
    return { ok: true, message: 'Event detail status updated.' };
  }, [bookings, createApprovalRequest, policy.finalApprovalRequired, reviewApproval, user]);

  const value = useMemo<BookingContextValue>(() => ({
    bookings,
    createBooking,
    updateBookingStatus,
    submitEventDetails,
    updateEventDetailStatus,
    hasConflict,
  }), [bookings, createBooking, hasConflict, submitEventDetails, updateBookingStatus, updateEventDetailStatus]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookings must be used within BookingProvider');
  return context;
}
