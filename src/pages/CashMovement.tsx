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
import { CashDistributionCategory } from '@/types/eventFinance';
import { PaymentMethod } from '@/types/payment';

const distributionCategories: { value: CashDistributionCategory; label: string }[] = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'stationary', label: 'Stationary' },
  { value: 'repairs_maintenance', label: 'Repairs and Maintenance' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'cooling', label: 'Cooling' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Others' },
];

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
    recordCashDistribution,
  } = useEventFinance();

  const [message, setMessage] = useState('');
  const [moveCashAmount, setMoveCashAmount] = useState(0);
  const [moveCashComment, setMoveCashComment] = useState('');
  const [moveCashDateTime, setMoveCashDateTime] = useState(() => toDateTimeLocal(new Date().toISOString()));
  const [requestAmount, setRequestAmount] = useState(0);
  const [requestComment, setRequestComment] = useState('');
  const [distributionCategory, setDistributionCategory] = useState<CashDistributionCategory>('cleaning');
  const [distributionAmount, setDistributionAmount] = useState(0);
  const [distributionReason, setDistributionReason] = useState('');
  const [distributionOtherDetails, setDistributionOtherDetails] = useState('');
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
    () => cashTransfers.filter((item) => item.status === 'pending_cashier_1_approval'),
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
    { title: 'Pending Requests', value: `${pendingRequests.length}`, description: 'waiting decision' },
    { title: 'Sent Transfers', value: `${sentTransfers.filter((item) => item.status === 'sent_to_cashier_2').length}`, description: 'awaiting confirmation' },
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

  if (user?.role !== 'cashier_1' && user?.role !== 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Cash Movement"
        subtitle="Cash movement actions are available only to the cashier desk and accountant control desk."
        stats={stats}
        sections={[
          {
            title: 'Access',
            bullets: [
              'Use the cashier desk for send, approve, decline, and distribution actions.',
              'Use the accountant desk for oversight and control actions.',
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
      subtitle="Manage cashier cash movement, approvals, and distribution records."
      stats={stats}
      sections={[
          {
            title: 'Cashier Actions',
            bullets: [
              'Record outgoing cash movement and approvals from one cashier desk.',
              'Review requested cash and approve with amount or decline.',
              'Use the Distribution tab to capture all distribution work inside the single cashier desk.',
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
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="history">Cash Moved</TabsTrigger>
              <TabsTrigger value="cancelled-denied">Cancelled/Denied</TabsTrigger>
            </TabsList>

            <TabsContent value="move-cash">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Record Cash Movement</p>
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
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Requested Cash</p>
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

            <TabsContent value="distribution">
              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Distribution</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionCategory}
                      onChange={(event) => setDistributionCategory(event.target.value as CashDistributionCategory)}
                    >
                      {distributionCategories.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionAmount || ''}
                      onChange={(event) => setDistributionAmount(Number(event.target.value))}
                    />
                    {distributionCategory === 'other' ? (
                      <input
                        type="text"
                        placeholder="Others details"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                        value={distributionOtherDetails}
                        onChange={(event) => setDistributionOtherDetails(event.target.value)}
                      />
                    ) : null}
                    <input
                      type="text"
                      placeholder="Reason / Comment"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                      value={distributionReason}
                      onChange={(event) => setDistributionReason(event.target.value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={isSubmitting || isRefreshingPage}
                      onClick={async () => {
                        if (isSubmitting || isRefreshingPage) return;
                        if (!canRunAction()) return;
                        if (!Number.isFinite(distributionAmount) || distributionAmount <= 0) {
                          const invalidMessage = 'Enter a valid distribution amount greater than zero.';
                          setMessage(invalidMessage);
                          toast({ title: 'Invalid amount', description: invalidMessage, variant: 'destructive' });
                          return;
                        }
                        if (!distributionReason.trim()) {
                          const invalidMessage = 'Distribution reason is required.';
                          setMessage(invalidMessage);
                          toast({ title: 'Missing reason', description: invalidMessage, variant: 'destructive' });
                          return;
                        }
                        if (distributionCategory === 'other' && !distributionOtherDetails.trim()) {
                          const invalidMessage = 'Enter details for Others category.';
                          setMessage(invalidMessage);
                          toast({ title: 'Missing details', description: invalidMessage, variant: 'destructive' });
                          return;
                        }
                        setIsSubmitting(true);
                        const result = await recordCashDistribution({
                          actionId: crypto.randomUUID(),
                          category: distributionCategory,
                          amount: distributionAmount,
                          reason: distributionReason,
                          otherDetails: distributionOtherDetails,
                        });
                        setMessage(result.message);
                        toast({
                          title: result.ok ? 'Distribution saved' : 'Distribution failed',
                          description: result.message,
                          variant: result.ok ? 'default' : 'destructive',
                        });
                        if (result.ok) {
                          setDistributionAmount(0);
                          setDistributionReason('');
                          setDistributionOtherDetails('');
                          refreshPageAfterSend('Distribution recorded. Refreshing page...');
                        }
                        setIsSubmitting(false);
                      }}
                    >
                      {isSubmitting ? 'Saving...' : isRefreshingPage ? 'Refreshing...' : 'Save Distribution'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Distribution History</p>
                    <Badge className="bg-slate-100 text-slate-700">{cashDistributions.length} records</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {cashDistributions.length === 0 ? (
                      <p className="text-sm text-slate-600">No distribution records yet.</p>
                    ) : (
                      cashDistributions.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {item.category === 'other'
                                ? `Others - ${item.customCategoryLabel ?? 'Unspecified'}`
                                : item.category.replace(/_/g, ' ')}
                            </p>
                            <Badge className="bg-slate-200 text-slate-900">TZS {item.amount.toLocaleString()}</Badge>
                          </div>
                          <p className="text-slate-500">Reason: {item.reason}</p>
                          <p className="text-xs text-slate-500">{new Date(item.distributedAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
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
                            <Badge className="bg-rose-100 text-rose-700">Receipt Denied</Badge>
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
                            <Badge className="bg-rose-100 text-rose-700">Receipt Denied</Badge>
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
