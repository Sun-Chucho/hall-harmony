import { useMemo, useRef, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useMessages } from '@/contexts/MessageContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { usePayments } from '@/contexts/PaymentContext';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/types/payment';

function statusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CashMovement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendManagerAlert } = useMessages();
  const { bookings } = useBookings();
  const { payments, getBookingFinancials, updatePayment } = usePayments();
  const {
    cashTransfers,
    mdTransfers,
    cashDistributions,
    sendCashToCashier2,
    requestCashTransferFromCashier2,
    approveCashTransferRequest,
    declineCashTransferRequest,
    confirmCashTransferReceived,
    denyCashTransferReceived,
  } = useEventFinance();

  const [message, setMessage] = useState('');
  const [moveCashAmount, setMoveCashAmount] = useState(0);
  const [moveCashComment, setMoveCashComment] = useState('');
  const [moveCashDateTime, setMoveCashDateTime] = useState(() => toDateTimeLocal(new Date().toISOString()));
  const [requestAmount, setRequestAmount] = useState(0);
  const [requestComment, setRequestComment] = useState('');
  const [decisionAmount, setDecisionAmount] = useState<Record<string, number>>({});
  const [decisionComment, setDecisionComment] = useState<Record<string, string>>({});
  const [receiveComment, setReceiveComment] = useState<Record<string, string>>({});
  const [oversightComment, setOversightComment] = useState<Record<string, string>>({});
  const [selectedPaymentBookingId, setSelectedPaymentBookingId] = useState('');
  const [paymentEditAmount, setPaymentEditAmount] = useState<Record<string, number>>({});
  const [paymentEditMethod, setPaymentEditMethod] = useState<Record<string, PaymentMethod>>({});
  const [paymentEditDateTime, setPaymentEditDateTime] = useState<Record<string, string>>({});
  const [paymentEditNotes, setPaymentEditNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const lastActionAtRef = useRef(0);

  const refreshPageAfterSend = (notice?: string) => {
    setIsRefreshingPage(true);
    setMessage(notice ?? 'Update saved. Refreshing page...');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.reload();
      }, 1600);
    }
  };
  const canRunAction = () => {
    if (Date.now() - lastActionAtRef.current < 900) return false;
    lastActionAtRef.current = Date.now();
    return true;
  };

  const pendingRequests = useMemo(
    () => cashTransfers.filter((item) => item.status === 'pending_cashier_1_approval' && item.initiatedByRole === 'cashier_2'),
    [cashTransfers],
  );
  const sentTransfers = useMemo(
    () => cashTransfers.filter((item) => item.status === 'sent_to_cashier_2' || item.status === 'received_by_cashier_2'),
    [cashTransfers],
  );
  const incomingForCashier2 = useMemo(
    () => cashTransfers.filter((item) => item.status === 'sent_to_cashier_2'),
    [cashTransfers],
  );
  const deniedOrCancelledTransfers = useMemo(
    () => cashTransfers.filter((item) => item.status === 'declined_by_cashier_1' || item.status === 'denied_by_cashier_2'),
    [cashTransfers],
  );

  const stats = [
    { title: 'Pending Requests', value: `${pendingRequests.length}`, description: 'waiting cashier 1 decision' },
    { title: 'Sent Transfers', value: `${sentTransfers.filter((item) => item.status === 'sent_to_cashier_2').length}`, description: 'waiting cashier 2 confirmation' },
    { title: 'Received', value: `${sentTransfers.filter((item) => item.status === 'received_by_cashier_2').length}`, description: 'receipt confirmed' },
    { title: 'Total Records', value: `${cashTransfers.length}`, description: 'cash movement trail' },
  ];

  if (user?.role === 'accountant') {
    const rows = [
      ...payments.map((item) => ({
        id: item.id,
        type: 'Payment',
        amount: item.amount,
        date: item.receivedAt,
        detail: `${item.bookingId} | ${item.referenceNumber} | ${item.notes || '-'}`,
      })),
      ...cashTransfers.map((item) => ({
        id: item.id,
        type: `Cash Movement (${statusLabel(item.status)})`,
        amount: item.approvedAmount || item.requestedAmount,
        date: item.receivedAt ?? item.sentAt ?? item.requestedAt,
        detail: [item.requestComment, item.decisionComment, item.receiveComment].filter(Boolean).join(' | ') || '-',
      })),
      ...mdTransfers.map((item) => ({
        id: item.id,
        type: 'Managing Director Transfer',
        amount: item.amount,
        date: item.transferredAt,
        detail: `${item.reference} | ${item.notes || '-'}`,
      })),
      ...cashDistributions.map((item) => ({
        id: item.id,
        type: `Distribution (${item.category.replace(/_/g, ' ')})`,
        amount: item.amount,
        date: item.distributedAt,
        detail: item.reason,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <ManagementPageTemplate
        pageTitle="Money Oversight"
        subtitle="View-only oversight of money movement with comment submission."
        stats={[
          { title: 'Payments', value: `${payments.length}`, description: 'recorded payment rows' },
          { title: 'Cash Moves', value: `${cashTransfers.length}`, description: 'cash transfer rows' },
          { title: 'MD Transfers', value: `${mdTransfers.length}`, description: 'managing director transfers' },
          { title: 'Distributions', value: `${cashDistributions.length}`, description: 'cash distribution rows' },
        ]}
        sections={[
          {
            title: 'Accountant Oversight',
            bullets: [
              'All rows are view-only.',
              'Use comments to raise observations on specific movement rows.',
            ],
          },
        ]}
        action={
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Movement Oversight</p>
            <div className="mt-3 space-y-3">
              {rows.length === 0 ? (
                <p className="text-sm text-slate-600">No movement records yet.</p>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{row.type}</p>
                      <Badge className="bg-slate-200 text-slate-900">TZS {row.amount.toLocaleString()}</Badge>
                    </div>
                    <p className="text-slate-600">{new Date(row.date).toLocaleString()}</p>
                    <p className="text-slate-500">{row.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Comment on this movement"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs w-[320px]"
                        value={oversightComment[row.id] ?? ''}
                        onChange={(event) => setOversightComment((prev) => ({ ...prev, [row.id]: event.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const text = oversightComment[row.id]?.trim();
                          if (!text) {
                            setMessage('Enter a comment first.');
                            return;
                          }
                          const result = await sendManagerAlert({
                            title: `Accountant movement comment: ${row.type}`,
                            body: `Reference ${row.id}: ${text}`,
                          });
                          setMessage(result.message);
                          if (result.ok) {
                            setOversightComment((prev) => ({ ...prev, [row.id]: '' }));
                          }
                        }}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {message ? <p className="mt-3 text-xs text-slate-600">{message}</p> : null}
          </div>
        }
      />
    );
  }

  if (user?.role === 'cashier_2') {
    const waitingApproval = cashTransfers.filter((item) => item.status === 'pending_cashier_1_approval' && item.initiatedByRole === 'cashier_2');
    const paymentBookings = bookings
      .filter((booking) => payments.some((payment) => payment.bookingId === booking.id))
      .sort((a, b) => a.eventName.localeCompare(b.eventName));
    const selectedPaymentBooking = paymentBookings.find((booking) => booking.id === selectedPaymentBookingId) ?? null;
    const selectedPaymentFinancials = selectedPaymentBooking ? getBookingFinancials(selectedPaymentBooking.id) : null;
    const selectedPaymentRows = selectedPaymentBooking
      ? payments
          .filter((payment) => payment.bookingId === selectedPaymentBooking.id)
          .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      : [];
    return (
      <ManagementPageTemplate
        pageTitle="Cash Movement"
        subtitle="Money received from Cashier 1 and cash request approvals."
        stats={stats}
        sections={[
          {
            title: 'Cashier 2 Actions',
            bullets: [
              'Confirm money sent from Cashier 1 by pressing Received.',
              'Request amount with reason and send for approval.',
              'Pending requests stay in a grey waiting box until approved.',
            ],
          },
        ]}
        action={
          <div className="space-y-6">
            {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div> : null}
            <Tabs defaultValue="move-cash" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="move-cash">Move Cash</TabsTrigger>
                <TabsTrigger value="edit-payments">Edit Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="move-cash">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Money Received from Cashier 1</p>
                    <div className="mt-3 space-y-3">
                      {incomingForCashier2.length === 0 ? (
                        <p className="text-sm text-slate-600">No transfers waiting confirmation.</p>
                      ) : (
                        incomingForCashier2.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900">{item.id}</p>
                              <Badge className="bg-amber-100 text-amber-800">Waiting</Badge>
                            </div>
                            <p className="text-slate-600">Amount sent: TZS {(item.approvedAmount || item.requestedAmount).toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Sent: {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                placeholder="Receive or deny comment"
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={receiveComment[item.id] ?? ''}
                                onChange={(event) => setReceiveComment((prev) => ({ ...prev, [item.id]: event.target.value }))}
                              />
                              <Button
                                size="sm"
                                disabled={isSubmitting || isRefreshingPage}
                                onClick={async () => {
                                  if (isSubmitting || isRefreshingPage) return;
                                  if (!canRunAction()) return;
                                  if (!(receiveComment[item.id] ?? '').trim()) {
                                    const invalidMessage = 'Receive comment is required before confirming.';
                                    setMessage(invalidMessage);
                                    toast({ title: 'Missing comment', description: invalidMessage, variant: 'destructive' });
                                    return;
                                  }
                                  setIsSubmitting(true);
                                  const result = await confirmCashTransferReceived(item.id, receiveComment[item.id] ?? '', crypto.randomUUID());
                                  setMessage(result.message);
                                  toast({
                                    title: result.ok ? 'Receipt submitted' : 'Receipt failed',
                                    description: result.message,
                                    variant: result.ok ? 'default' : 'destructive',
                                  });
                                  if (result.ok) {
                                    refreshPageAfterSend('Cash received confirmation sent. Refreshing page...');
                                  }
                                  setIsSubmitting(false);
                                }}
                              >
                                Received
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSubmitting || isRefreshingPage}
                                onClick={async () => {
                                  if (isSubmitting || isRefreshingPage) return;
                                  if (!canRunAction()) return;
                                  if (!(receiveComment[item.id] ?? '').trim()) {
                                    const invalidMessage = 'Deny comment is required before denying.';
                                    setMessage(invalidMessage);
                                    toast({ title: 'Missing comment', description: invalidMessage, variant: 'destructive' });
                                    return;
                                  }
                                  setIsSubmitting(true);
                                  const result = await denyCashTransferReceived(item.id, receiveComment[item.id] ?? '', crypto.randomUUID());
                                  setMessage(result.message);
                                  toast({
                                    title: result.ok ? 'Movement denied' : 'Deny failed',
                                    description: result.message,
                                    variant: result.ok ? 'default' : 'destructive',
                                  });
                                  if (result.ok) {
                                    refreshPageAfterSend('Cash movement denied. Refreshing page...');
                                  }
                                  setIsSubmitting(false);
                                }}
                              >
                                Deny
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Request Amount</p>
                    <div className="mt-3 grid gap-3">
                      <input type="number" placeholder="Requested Amount (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={requestAmount || ''} onChange={(event) => setRequestAmount(Number(event.target.value))} />
                      <input type="text" placeholder="Reason" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={requestComment} onChange={(event) => setRequestComment(event.target.value)} />
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        disabled={isSubmitting || isRefreshingPage}
                        onClick={async () => {
                          if (isSubmitting || isRefreshingPage) return;
                          if (!canRunAction()) return;
                          if (!Number.isFinite(requestAmount) || requestAmount <= 0) {
                            setMessage('Enter a valid requested amount greater than zero.');
                            toast({ title: 'Invalid amount', description: 'Enter a valid requested amount greater than zero.', variant: 'destructive' });
                            return;
                          }
                          if (!requestComment.trim()) {
                            const invalidMessage = 'Reason is required before sending request.';
                            setMessage(invalidMessage);
                            toast({ title: 'Missing reason', description: invalidMessage, variant: 'destructive' });
                            return;
                          }
                          setIsSubmitting(true);
                          const result = await requestCashTransferFromCashier2({ amount: requestAmount, comment: requestComment, actionId: crypto.randomUUID() });
                          setMessage(result.message);
                          toast({
                            title: result.ok ? 'Request submitted' : 'Request failed',
                            description: result.message,
                            variant: result.ok ? 'default' : 'destructive',
                          });
                          if (result.ok) {
                            setRequestAmount(0);
                            setRequestComment('');
                            refreshPageAfterSend('Cash request sent for approval. Refreshing page...');
                          }
                          setIsSubmitting(false);
                        }}
                      >
                        {isRefreshingPage ? 'Refreshing...' : 'Send for Approval'}
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {waitingApproval.length === 0 ? null : waitingApproval.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-300 bg-slate-200 p-3 text-xs text-slate-700">
                          <p className="font-semibold">Waiting for approval</p>
                          <p>{item.id} | TZS {item.requestedAmount.toLocaleString()}</p>
                          <p>{item.requestComment || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit-payments">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Edit Booking Installments</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={selectedPaymentBookingId}
                      onChange={(event) => setSelectedPaymentBookingId(event.target.value)}
                    >
                      <option value="">Select booking</option>
                      {paymentBookings.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.id} | {booking.customerName} | {booking.eventName}
                        </option>
                      ))}
                    </select>
                    {selectedPaymentFinancials ? (
                      <Badge className="bg-slate-100 text-slate-700 self-center">
                        Total Paid: TZS {selectedPaymentFinancials.totalPaid.toLocaleString()} | Due: TZS {selectedPaymentFinancials.quotedAmount.toLocaleString()}
                      </Badge>
                    ) : null}
                  </div>

                  {selectedPaymentBooking ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p><span className="font-semibold">Event:</span> {selectedPaymentBooking.eventName}</p>
                        <p><span className="font-semibold">Customer:</span> {selectedPaymentBooking.customerName} ({selectedPaymentBooking.customerPhone})</p>
                        <p><span className="font-semibold">Hall/Date:</span> {selectedPaymentBooking.hall} | {selectedPaymentBooking.date}</p>
                      </div>

                      {selectedPaymentRows.length === 0 ? (
                        <p className="text-sm text-slate-600">No installments found for this booking.</p>
                      ) : (
                        selectedPaymentRows.map((payment) => (
                          <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900">{payment.id}</p>
                              <Badge className="bg-slate-200 text-slate-900">Installment</Badge>
                            </div>
                            <div className="mt-2 grid gap-2 md:grid-cols-4">
                              <input
                                type="number"
                                placeholder="Amount"
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={paymentEditAmount[payment.id] ?? payment.amount}
                                onChange={(event) => setPaymentEditAmount((prev) => ({ ...prev, [payment.id]: Number(event.target.value) }))}
                              />
                              <select
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={paymentEditMethod[payment.id] ?? payment.method}
                                onChange={(event) => setPaymentEditMethod((prev) => ({ ...prev, [payment.id]: event.target.value as PaymentMethod }))}
                              >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="pos">POS</option>
                              </select>
                              <input
                                type="datetime-local"
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={paymentEditDateTime[payment.id] ?? toDateTimeLocal(payment.receivedAt)}
                                onChange={(event) => setPaymentEditDateTime((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                              />
                              <input
                                type="text"
                                placeholder="Notes"
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={paymentEditNotes[payment.id] ?? payment.notes}
                                onChange={(event) => setPaymentEditNotes((prev) => ({ ...prev, [payment.id]: event.target.value }))}
                              />
                            </div>
                            <div className="mt-2">
                              <Button
                                size="sm"
                                disabled={isSubmitting || isRefreshingPage}
                                onClick={async () => {
                                  if (isSubmitting || isRefreshingPage) return;
                                  if (!canRunAction()) return;
                                  const amount = paymentEditAmount[payment.id] ?? payment.amount;
                                  const method = paymentEditMethod[payment.id] ?? payment.method;
                                  const receivedAt = paymentEditDateTime[payment.id] ?? toDateTimeLocal(payment.receivedAt);
                                  const notes = paymentEditNotes[payment.id] ?? payment.notes;
                                  setIsSubmitting(true);
                                  const result = await updatePayment(payment.id, { amount, method, receivedAt, notes });
                                  setMessage(result.message);
                                  toast({
                                    title: result.ok ? 'Installment updated' : 'Update failed',
                                    description: result.message,
                                    variant: result.ok ? 'default' : 'destructive',
                                  });
                                  setIsSubmitting(false);
                                }}
                              >
                                {isSubmitting ? 'Saving...' : 'Confirm Changes'}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">Select a booking to load installments for editing.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    );
  }

  if (user?.role !== 'cashier_1' && user?.role !== 'controller') {
    return (
      <ManagementPageTemplate
        pageTitle="Cash Movement"
        subtitle="Cash movement actions are available only to Cashier 1 / Controller and Cashier 2."
        stats={stats}
        sections={[
          {
            title: 'Access',
            bullets: [
              'Use Cashier 1/Controller for send/approve/decline actions.',
              'Use Cashier 2 for request/received confirmation actions.',
            ],
          },
        ]}
        action={
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            You have view access only for this role.
          </div>
        }
      />
    );
  }

  return (
    <ManagementPageTemplate
      pageTitle="Cash Movement"
      subtitle="Move cash to Cashier 2 and manage requested cash approvals."
      stats={stats}
      sections={[
          {
            title: 'Cashier 1 Actions',
            bullets: [
              'Send cash directly to Cashier 2.',
              'Review requested cash from Cashier 2 and approve with amount or decline.',
              'Track waiting, received, and denied statuses with date/time and comments.',
            ],
          },
        ]}
      action={
        <div className="space-y-6">
          {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div> : null}
          <Tabs defaultValue="move-cash" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="move-cash">Move Cash</TabsTrigger>
              <TabsTrigger value="requested-cash">Requested Cash</TabsTrigger>
              <TabsTrigger value="history">Cash Moved</TabsTrigger>
              <TabsTrigger value="cancelled-denied">Cancelled/Denied</TabsTrigger>
            </TabsList>

            <TabsContent value="move-cash">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Send Cash to Cashier 2</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <input type="number" placeholder="Amount to Move (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={moveCashAmount || ''} onChange={(event) => setMoveCashAmount(Number(event.target.value))} />
                  <input type="text" placeholder="Comment" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={moveCashComment} onChange={(event) => setMoveCashComment(event.target.value)} />
                  <input type="datetime-local" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={moveCashDateTime} onChange={(event) => setMoveCashDateTime(event.target.value)} />
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    disabled={isSubmitting || isRefreshingPage}
                    onClick={async () => {
                      if (isSubmitting || isRefreshingPage) return;
                      if (!canRunAction()) return;
                      if (!Number.isFinite(moveCashAmount) || moveCashAmount <= 0) {
                        setMessage('Enter a valid amount greater than zero.');
                        toast({ title: 'Invalid amount', description: 'Enter a valid amount greater than zero.', variant: 'destructive' });
                        return;
                      }
                      if (!moveCashComment.trim()) {
                        const invalidMessage = 'Comment is required before sending cash.';
                        setMessage(invalidMessage);
                        toast({ title: 'Missing comment', description: invalidMessage, variant: 'destructive' });
                        return;
                      }
                      if (!moveCashDateTime || Number.isNaN(new Date(moveCashDateTime).getTime())) {
                        const invalidMessage = 'Transfer date/time is required.';
                        setMessage(invalidMessage);
                        toast({ title: 'Missing date/time', description: invalidMessage, variant: 'destructive' });
                        return;
                      }
                      setIsSubmitting(true);
                      const result = await sendCashToCashier2({
                        amount: moveCashAmount,
                        comment: moveCashComment,
                        transferDateTime: moveCashDateTime,
                        actionId: crypto.randomUUID(),
                      });
                      setMessage(result.message);
                      toast({
                        title: result.ok ? 'Cash sent' : 'Send failed',
                        description: result.message,
                        variant: result.ok ? 'default' : 'destructive',
                      });
                      if (result.ok) {
                        setMoveCashAmount(0);
                        setMoveCashComment('');
                        setMoveCashDateTime(toDateTimeLocal(new Date().toISOString()));
                        refreshPageAfterSend('Cash sent successfully. Refreshing page...');
                      }
                      setIsSubmitting(false);
                    }}
                  >
                    {isSubmitting ? 'Sending...' : isRefreshingPage ? 'Refreshing...' : 'Send'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requested-cash">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Requested Cash from Cashier 2</p>
                <div className="mt-3 space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-sm text-slate-600">No pending cash requests.</p>
                  ) : (
                    pendingRequests.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.id}</p>
                          <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                        </div>
                        <p className="text-slate-600">Requested: TZS {item.requestedAmount.toLocaleString()}</p>
                        <p className="text-slate-500">Comment: {item.requestComment || '-'}</p>
                        <p className="text-xs text-slate-500">{new Date(item.requestedAt).toLocaleString()}</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                          <input
                            type="number"
                            placeholder="Approved amount"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                            value={decisionAmount[item.id] || ''}
                            onChange={(event) => setDecisionAmount((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))}
                          />
                          <input
                            type="text"
                            placeholder="Decision comment"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                            value={decisionComment[item.id] ?? ''}
                            onChange={(event) => setDecisionComment((prev) => ({ ...prev, [item.id]: event.target.value }))}
                          />
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={async () => {
                              if (isSubmitting) return;
                              if (!canRunAction()) return;
                              const amount = decisionAmount[item.id] || 0;
                              if (!Number.isFinite(amount) || amount <= 0) {
                                setMessage('Enter a valid approved amount greater than zero.');
                                toast({ title: 'Invalid approved amount', description: 'Enter a valid approved amount greater than zero.', variant: 'destructive' });
                                return;
                              }
                              if (!(decisionComment[item.id] ?? '').trim()) {
                                const invalidMessage = 'Decision comment is required.';
                                setMessage(invalidMessage);
                                toast({ title: 'Missing decision comment', description: invalidMessage, variant: 'destructive' });
                                return;
                              }
                              setIsSubmitting(true);
                              const result = await approveCashTransferRequest(item.id, amount, decisionComment[item.id] ?? '', crypto.randomUUID());
                              setMessage(result.message);
                              toast({
                                title: result.ok ? 'Request approved' : 'Approval failed',
                                description: result.message,
                                variant: result.ok ? 'default' : 'destructive',
                              });
                              setIsSubmitting(false);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={async () => {
                              if (isSubmitting) return;
                              if (!canRunAction()) return;
                              if (!(decisionComment[item.id] ?? '').trim()) {
                                const invalidMessage = 'Decision comment is required.';
                                setMessage(invalidMessage);
                                toast({ title: 'Missing decision comment', description: invalidMessage, variant: 'destructive' });
                                return;
                              }
                              setIsSubmitting(true);
                              const result = await declineCashTransferRequest(item.id, decisionComment[item.id] ?? '', crypto.randomUUID());
                              setMessage(result.message);
                              toast({
                                title: result.ok ? 'Request declined' : 'Decline failed',
                                description: result.message,
                                variant: result.ok ? 'default' : 'destructive',
                              });
                              setIsSubmitting(false);
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cash Moved</p>
                <div className="mt-3 space-y-3">
                  {cashTransfers.length === 0 ? (
                    <p className="text-sm text-slate-600">No cash movement records yet.</p>
                  ) : (
                    cashTransfers.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.id}</p>
                          {item.status === 'sent_to_cashier_2' ? (
                            <Badge className="bg-amber-100 text-amber-800">Waiting</Badge>
                          ) : item.status === 'received_by_cashier_2' ? (
                            <Badge className="bg-emerald-100 text-emerald-700">Received</Badge>
                          ) : item.status === 'denied_by_cashier_2' ? (
                            <Badge className="bg-rose-100 text-rose-700">Denied by Cashier 2</Badge>
                          ) : item.status === 'declined_by_cashier_1' ? (
                            <Badge className="bg-rose-100 text-rose-700">Declined</Badge>
                          ) : (
                            <Badge className="bg-slate-200 text-slate-900">{statusLabel(item.status)}</Badge>
                          )}
                        </div>
                        <p className="text-slate-600">Amount: TZS {(item.approvedAmount || item.requestedAmount).toLocaleString()}</p>
                        <p className="text-slate-500">Request comment: {item.requestComment || '-'}</p>
                        <p className="text-slate-500">Decision comment: {item.decisionComment || '-'}</p>
                        <p className="text-slate-500">Receive comment: {item.receiveComment || '-'}</p>
                        <p className="text-xs text-slate-500">
                          Requested: {new Date(item.requestedAt).toLocaleString()} | Sent: {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'} | Received: {item.receivedAt ? new Date(item.receivedAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cancelled-denied">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cancelled / Denied Movements</p>
                <div className="mt-3 space-y-3">
                  {deniedOrCancelledTransfers.length === 0 ? (
                    <p className="text-sm text-slate-600">No cancelled or denied movements.</p>
                  ) : (
                    deniedOrCancelledTransfers.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.id}</p>
                          {item.status === 'denied_by_cashier_2' ? (
                            <Badge className="bg-rose-100 text-rose-700">Denied by Cashier 2</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-700">Declined by Cashier 1</Badge>
                          )}
                        </div>
                        <p className="text-slate-600">Amount: TZS {(item.approvedAmount || item.requestedAmount).toLocaleString()}</p>
                        <p className="text-slate-500">Request comment: {item.requestComment || '-'}</p>
                        <p className="text-slate-500">Decision comment: {item.decisionComment || '-'}</p>
                        <p className="text-slate-500">Receive/Deny comment: {item.receiveComment || '-'}</p>
                        <p className="text-xs text-slate-500">
                          Requested: {new Date(item.requestedAt).toLocaleString()} | Sent: {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'} | Denied: {item.deniedAt ? new Date(item.deniedAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
