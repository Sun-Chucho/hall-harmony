import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { BookingPaymentStatus, CreatePaymentInput, PaymentRecord } from '@/types/payment';

interface BookingFinancials {
  totalPaid: number;
  balance: number;
  quotedAmount: number;
  status: BookingPaymentStatus;
}

interface PaymentContextValue {
  payments: PaymentRecord[];
  recordPayment: (input: CreatePaymentInput) => { ok: boolean; message: string; paymentId?: string };
  setBookingPaymentStatus: (bookingId: string, status: BookingPaymentStatus) => { ok: boolean; message: string };
  getBookingFinancials: (bookingId: string) => BookingFinancials;
  generateReceiptText: (paymentId: string) => { ok: boolean; message: string; receipt?: string };
}

const PAYMENTS_KEY = 'kuringe_payments_v1';
const STATUS_OVERRIDE_KEY = 'kuringe_payment_status_override_v1';
const DEPOSIT_RATIO = 0.3;

const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { policy } = useAuthorization();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusOverride, setStatusOverride] = useState<Record<string, BookingPaymentStatus>>({});

  useEffect(() => {
    const rawPayments = localStorage.getItem(PAYMENTS_KEY);
    const rawOverride = localStorage.getItem(STATUS_OVERRIDE_KEY);
    if (rawPayments) {
      try {
        setPayments(JSON.parse(rawPayments) as PaymentRecord[]);
      } catch {
        localStorage.removeItem(PAYMENTS_KEY);
      }
    }
    if (rawOverride) {
      try {
        setStatusOverride(JSON.parse(rawOverride) as Record<string, BookingPaymentStatus>);
      } catch {
        localStorage.removeItem(STATUS_OVERRIDE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(statusOverride));
  }, [statusOverride]);

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

  const recordPayment = useCallback((input: CreatePaymentInput) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can record payments.' };
    }
    if (policy.transactionsFrozen && user.role !== 'controller') {
      return { ok: false, message: 'Transactions are frozen by controller.' };
    }
    const booking = bookings.find((item) => item.id === input.bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (input.amount <= 0) return { ok: false, message: 'Amount must be greater than zero.' };
    if (!input.referenceNumber.trim()) return { ok: false, message: 'Reference number is required.' };

    const paymentId = `PAY-${Date.now()}`;
    const receiptNumber = `RCT-${Date.now()}`;

    const record: PaymentRecord = {
      id: paymentId,
      bookingId: input.bookingId,
      amount: input.amount,
      method: input.method,
      referenceNumber: input.referenceNumber.trim(),
      receivedAt: new Date().toISOString(),
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
    return { ok: true, message: 'Payment recorded successfully.', paymentId };
  }, [bookings, policy.transactionsFrozen, user]);

  const setBookingPaymentStatus = useCallback((bookingId: string, status: BookingPaymentStatus) => {
    if (!user) return { ok: false, message: 'Authentication required.' };
    if (user.role !== 'cashier_1' && user.role !== 'controller') {
      return { ok: false, message: 'Only Cashier 1 or Controller can set payment status.' };
    }
    if (!bookings.some((item) => item.id === bookingId)) {
      return { ok: false, message: 'Booking not found.' };
    }
    setStatusOverride((prev) => ({ ...prev, [bookingId]: status }));
    return { ok: true, message: `Booking marked as ${status.replace('_', ' ')}.` };
  }, [bookings, user]);

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
