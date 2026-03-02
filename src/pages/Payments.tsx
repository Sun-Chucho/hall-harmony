import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { usePayments } from '@/contexts/PaymentContext';
import { BookingPaymentStatus, CreatePaymentInput, PaymentMethod } from '@/types/payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function getDefaultPaidDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const initialForm: CreatePaymentInput = {
  bookingId: '',
  amount: 0,
  method: 'cash',
  notes: '',
  receivedAt: getDefaultPaidDateTime(),
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos', label: 'POS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

const paymentStatuses: BookingPaymentStatus[] = [
  'pending',
  'deposit_paid',
  'partially_paid',
  'fully_paid',
];

function statusLabel(value: string) {
  return value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Payments() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const {
    payments,
    recordPayment,
    setBookingPaymentStatus,
    getBookingFinancials,
    generateReceiptText,
  } = usePayments();

  const [form, setForm] = useState<CreatePaymentInput>(initialForm);
  const [statusBookingId, setStatusBookingId] = useState('');
  const [statusValue, setStatusValue] = useState<BookingPaymentStatus>('pending');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [message, setMessage] = useState('');

  const eligibleBookings = useMemo(
    () => bookings.filter((booking) => booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'rejected'),
    [bookings],
  );

  const selectedFinancials = form.bookingId ? getBookingFinancials(form.bookingId) : null;

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysPayments = payments.filter((payment) => payment.receivedAt.startsWith(today));
    const totalReceived = todaysPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingBookings = eligibleBookings.filter((booking) => getBookingFinancials(booking.id).status === 'pending').length;
    return [
      { title: "Today's Payments", value: `${todaysPayments.length}`, description: 'payments recorded' },
      { title: 'Pending Status', value: `${pendingBookings}`, description: 'bookings awaiting payment progress' },
      { title: 'Total Received', value: `TZS ${totalReceived.toLocaleString()}`, description: "today's collections" },
      { title: 'Payment History', value: `${payments.length}`, description: 'all recorded transactions' },
    ];
  }, [eligibleBookings, getBookingFinancials, payments]);

  const sections = [
    {
      title: 'Cashier 1 Controls',
      bullets: [
        'Record payment method and amount for each booking.',
        'Mark booking payment status: pending, deposit paid, partial, or fully paid.',
        'Generate receipt text with updated booking balance after each payment.',
      ],
    },
  ];

  const canRecordPayments = user?.role === 'cashier_1' || user?.role === 'controller';

  const handleRecordPayment = () => {
    const result = recordPayment(form);
    setMessage(result.message);
    if (result.ok) {
      setForm((prev) => ({ ...initialForm, method: prev.method, receivedAt: getDefaultPaidDateTime() }));
      if (result.paymentId) {
        const receipt = generateReceiptText(result.paymentId);
        if (receipt.ok && receipt.receipt) {
          setReceiptPreview(receipt.receipt);
        }
      }
    }
  };

  const handleSetStatus = () => {
    if (!statusBookingId) {
      setMessage('Select a booking first.');
      return;
    }
    const result = setBookingPaymentStatus(statusBookingId, statusValue);
    setMessage(result.message);
  };

  return (
    <ManagementPageTemplate
      pageTitle="Payments"
      subtitle="Cashier payment collection, receipt generation, and booking payment status management."
      stats={stats}
      sections={sections}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Record Payment</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.bookingId}
                onChange={(event) => setForm((prev) => ({ ...prev, bookingId: event.target.value }))}
              >
                <option value="">Select Booking</option>
                {eligibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id} | {booking.customerName} | {booking.eventName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount (TZS)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.amount || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
              />
              <select
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.method}
                onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value as PaymentMethod }))}
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.receivedAt ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, receivedAt: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={handleRecordPayment} disabled={!canRecordPayments}>
                Record Payment
              </Button>
              {selectedFinancials ? (
                <Badge className="bg-slate-100 text-slate-700">
                  Balance: TZS {selectedFinancials.balance.toLocaleString()}
                </Badge>
              ) : null}
              {selectedFinancials ? (
                <Badge className="bg-slate-100 text-slate-700">
                  Status: {statusLabel(selectedFinancials.status)}
                </Badge>
              ) : null}
              {message ? <span className="text-xs text-slate-500">{message}</span> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Manual Booking Payment Status</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <select
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={statusBookingId}
                onChange={(event) => setStatusBookingId(event.target.value)}
              >
                <option value="">Select Booking</option>
                {eligibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id} | {booking.customerName}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value as BookingPaymentStatus)}
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleSetStatus} disabled={!canRecordPayments}>
                Mark Status
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment History</p>
              <Badge className="bg-slate-100 text-slate-700">{payments.length} records</Badge>
            </div>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No payments recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {payments.map((payment) => {
                  const booking = bookings.find((item) => item.id === payment.bookingId);
                  const financials = getBookingFinancials(payment.bookingId);
                  return (
                    <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {payment.receiptNumber} | TZS {payment.amount.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const receipt = generateReceiptText(payment.id);
                            setMessage(receipt.message);
                            if (receipt.ok && receipt.receipt) {
                              setReceiptPreview(receipt.receipt);
                            }
                          }}
                        >
                          Generate Receipt
                        </Button>
                      </div>
                      <p className="text-slate-500">
                        Booking: {payment.bookingId} | {booking?.customerName ?? 'Unknown Customer'} | Method: {statusLabel(payment.method)}
                      </p>
                      <p className="text-slate-500">
                        Ref: {payment.referenceNumber} | Balance: TZS {financials.balance.toLocaleString()} | Status: {statusLabel(financials.status)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Receipt Preview</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {receiptPreview || 'No receipt generated yet.'}
            </pre>
          </div>
        </div>
      }
    />
  );
}
