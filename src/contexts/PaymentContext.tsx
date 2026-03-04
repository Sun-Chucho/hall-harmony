import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import { BookingPaymentStatus, CreatePaymentInput, PaymentRecord } from '@/types/payment';

interface BookingFinancials {
  totalPaid: number;
  balance: number;
  quotedAmount: number;
  status: BookingPaymentStatus;
}

interface PaymentContextValue {
  payments: PaymentRecord[];
  recordPayment: (input: CreatePaymentInput) => Promise<{ ok: boolean; message: string; paymentId?: string }>;
  setBookingPaymentStatus: (bookingId: string, status: BookingPaymentStatus) => Promise<{ ok: boolean; message: string }>;
  getBookingFinancials: (bookingId: string) => BookingFinancials;
  generateReceiptText: (paymentId: string) => { ok: boolean; message: string; receipt?: string };
}

const DEPOSIT_RATIO = 0.3;
const PAYMENTS_COLLECTION = 'payments';
const PAYMENT_STATUS_COLLECTION = 'payment_status_overrides';

function generateReference(prefix: string) {
  const stamp = Date.now().toString();
  return `${prefix}-${stamp}`;
}

function normalizeActionId(value?: string) {
  const normalized = (value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!normalized) return '';
  return normalized.slice(0, 64);
}

const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { policy } = useAuthorization();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusOverride, setStatusOverride] = useState<Record<string, BookingPaymentStatus>>({});

  useEffect(() => {
    if (!user) {
      setPayments([]);
      return;
    }

    const q = query(collection(db, PAYMENTS_COLLECTION), limit(3000));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => {
            const data = item.data() as Partial<PaymentRecord>;
            return {
              id: item.id,
              clientActionId: data.clientActionId,
              bookingId: data.bookingId ?? '',
              amount: Number(data.amount) || 0,
              method: (data.method ?? 'cash') as PaymentRecord['method'],
              referenceNumber: data.referenceNumber ?? '',
              receivedAt: data.receivedAt ?? new Date(0).toISOString(),
              receivedByUserId: data.receivedByUserId ?? '',
              receiptNumber: data.receiptNumber ?? '',
              notes: data.notes ?? '',
            } as PaymentRecord;
          })
          .filter((entry) => entry.bookingId)
          .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        setPayments(next);
      },
      () => {
        setPayments([]);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setStatusOverride({});
      return;
    }

    const q = query(collection(db, PAYMENT_STATUS_COLLECTION), limit(3000));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next: Record<string, BookingPaymentStatus> = {};
        snapshot.docs.forEach((item) => {
          const data = item.data() as { status?: BookingPaymentStatus };
          if (data.status) {
            next[item.id] = data.status;
          }
        });
        setStatusOverride(next);
      },
      () => {
        setStatusOverride({});
      },
    );

    return () => unsub();
  }, [user]);

  const computeStatus = useCallback((bookingId: string): BookingPaymentStatus => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return 'pending';
    const quotedAmount = Number(booking.quotedAmount) || 0;
    const totalPaid = payments
      .filter((payment) => payment.bookingId === bookingId)
      .reduce((sum, payment) => sum + payment.amount, 0);

    if (totalPaid <= 0) return 'pending';
    if (quotedAmount <= 0) return 'pending';
    if (totalPaid >= quotedAmount) return 'fully_paid';
    if (totalPaid >= quotedAmount * DEPOSIT_RATIO) return 'deposit_paid';
    return 'partially_paid';
  }, [bookings, payments]);

  const getBookingFinancials = useCallback((bookingId: string): BookingFinancials => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) {
      return { totalPaid: 0, balance: 0, quotedAmount: 0, status: 'pending' };
    }
    const quotedAmount = Number(booking.quotedAmount) || 0;
    const totalPaid = payments
      .filter((payment) => payment.bookingId === bookingId)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const balance = Math.max(quotedAmount - totalPaid, 0);
    const autoStatus = computeStatus(bookingId);
    return {
      totalPaid,
      balance,
      quotedAmount,
      status: statusOverride[bookingId] ?? autoStatus,
    };
  }, [bookings, computeStatus, payments, statusOverride]);

  const recordPayment = useCallback(async (input: CreatePaymentInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can record payments.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const booking = bookings.find((item) => item.id === input.bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, message: 'Enter a valid payment amount greater than zero.' };
    }
    const actionId = normalizeActionId(input.actionId) || crypto.randomUUID();
    const duplicate = payments.find((entry) => entry.clientActionId === actionId);
    if (duplicate) {
      return { ok: true, message: 'This payment was already submitted.', paymentId: duplicate.id };
    }

    const paymentId = `PAY-ACT-${actionId}`;
    const receiptNumber = generateReference('RCT');
    const referenceNumber = input.referenceNumber?.trim() || generateReference('PAYREF');
    const amount = Math.round(input.amount);
    const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
    if (Number.isNaN(receivedAt.getTime())) {
      return { ok: false, message: 'Enter a valid paid date and time.' };
    }

    const record: PaymentRecord = {
      id: paymentId,
      clientActionId: actionId,
      bookingId: input.bookingId,
      amount,
      method: input.method,
      referenceNumber,
      receivedAt: receivedAt.toISOString(),
      receivedByUserId: user.id,
      receiptNumber,
      notes: input.notes?.trim() ?? '',
    };

    setPayments((prev) => [record, ...prev]);
    setStatusOverride((prev) => {
      const next = { ...prev };
      delete next[input.bookingId];
      return next;
    });

    try {
      await setDoc(
        doc(db, PAYMENTS_COLLECTION, record.id),
        {
          ...record,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await deleteDoc(doc(db, PAYMENT_STATUS_COLLECTION, input.bookingId));
      return { ok: true, message: 'Payment recorded successfully.', paymentId };
    } catch {
      setPayments((prev) => prev.filter((entry) => entry.id !== record.id));
      return { ok: false, message: 'Payment failed to sync to cloud. Please try again.' };
    }
  }, [bookings, payments, policy.transactionsFrozen, user]);

  const setBookingPaymentStatus = useCallback(async (bookingId: string, status: BookingPaymentStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can set payment status.' };
    }
    if (!bookings.some((item) => item.id === bookingId)) {
      return { ok: false, message: 'Booking not found.' };
    }

    const previousStatus = statusOverride[bookingId];
    setStatusOverride((prev) => ({ ...prev, [bookingId]: status }));
    try {
      await setDoc(
        doc(db, PAYMENT_STATUS_COLLECTION, bookingId),
        {
          bookingId,
          status,
          updatedAt: serverTimestamp(),
          updatedByUserId: user.id,
        },
        { merge: true },
      );
      return { ok: true, message: `Booking marked as ${status.replace('_', ' ')}.` };
    } catch {
      setStatusOverride((prev) => {
        const next = { ...prev };
        if (previousStatus) {
          next[bookingId] = previousStatus;
        } else {
          delete next[bookingId];
        }
        return next;
      });
      return { ok: false, message: 'Failed to update payment status in cloud. Please try again.' };
    }
  }, [bookings, statusOverride, user]);

  const generateReceiptText = useCallback((paymentId: string) => {
    const payment = payments.find((item) => item.id === paymentId);
    if (!payment) return { ok: false, message: 'Payment not found.' };
    const booking = bookings.find((item) => item.id === payment.bookingId);
    if (!booking) return { ok: false, message: 'Booking not found for payment.' };
    const financials = getBookingFinancials(booking.id);

    const receipt = [
      'KURINGE HALLS - PAYMENT RECEIPT',
      `Receipt No: ${payment.receiptNumber}`,
      `Date: ${new Date(payment.receivedAt).toLocaleString()}`,
      `Booking Ref: ${booking.id}`,
      `Customer: ${booking.customerName}`,
      `Event: ${booking.eventName}`,
      `Payment Method: ${payment.method}`,
      `Reference: ${payment.referenceNumber}`,
      `Amount Received: TZS ${payment.amount.toLocaleString()}`,
      `Total Paid: TZS ${financials.totalPaid.toLocaleString()}`,
      `Balance: TZS ${financials.balance.toLocaleString()}`,
      `Payment Status: ${financials.status.replace('_', ' ')}`,
    ].join('\n');

    return { ok: true, message: 'Receipt generated.', receipt };
  }, [bookings, getBookingFinancials, payments]);

  const value = useMemo<PaymentContextValue>(() => ({
    payments,
    recordPayment,
    setBookingPaymentStatus,
    getBookingFinancials,
    generateReceiptText,
  }), [generateReceiptText, getBookingFinancials, payments, recordPayment, setBookingPaymentStatus]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayments must be used within PaymentProvider');
  return context;
}
