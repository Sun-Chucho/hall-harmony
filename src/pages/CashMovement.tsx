import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { usePayments } from '@/contexts/PaymentContext';

function statusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function CashMovement() {
  const { user } = useAuth();
  const { sendManagerAlert } = useMessages();
  const { payments } = usePayments();
  const {
    cashTransfers,
    mdTransfers,
    cashDistributions,
    sendCashToCashier2,
    requestCashTransferFromCashier2,
    approveCashTransferRequest,
    declineCashTransferRequest,
    confirmCashTransferReceived,
  } = useEventFinance();

  const [message, setMessage] = useState('');
  const [moveCashAmount, setMoveCashAmount] = useState(0);
  const [moveCashComment, setMoveCashComment] = useState('');
  const [requestAmount, setRequestAmount] = useState(0);
  const [requestComment, setRequestComment] = useState('');
  const [decisionAmount, setDecisionAmount] = useState<Record<string, number>>({});
  const [decisionComment, setDecisionComment] = useState<Record<string, string>>({});
  const [receiveComment, setReceiveComment] = useState<Record<string, string>>({});
  const [oversightComment, setOversightComment] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const stats = [
    { title: 'Pending Requests', value: `${pendingRequests.length}`, description: 'waiting cashier 1 decision' },
    { title: 'Sent Transfers', value: `${sentTransfers.filter((item) => item.status === 'sent_to_cashier_2').length}`, description: 'waiting cashier 2 confirmation' },
    { title: 'Received', value: `${sentTransfers.filter((item) => item.status === 'received_by_cashier_2').length}`, description: 'confirmed by cashier 2' },
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
                                placeholder="Receive comment"
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                value={receiveComment[item.id] ?? ''}
                                onChange={(event) => setReceiveComment((prev) => ({ ...prev, [item.id]: event.target.value }))}
                              />
                              <Button
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => {
                                  if (isSubmitting) return;
                                  setIsSubmitting(true);
                                  const result = confirmCashTransferReceived(item.id, receiveComment[item.id] ?? '');
                                  setMessage(result.message);
                                  setIsSubmitting(false);
                                }}
                              >
                                Received
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
                        disabled={isSubmitting}
                        onClick={() => {
                          if (isSubmitting) return;
                          if (!Number.isFinite(requestAmount) || requestAmount <= 0) {
                            setMessage('Enter a valid requested amount greater than zero.');
                            return;
                          }
                          setIsSubmitting(true);
                          const result = requestCashTransferFromCashier2({ amount: requestAmount, comment: requestComment });
                          setMessage(result.message);
                          if (result.ok) {
                            setRequestAmount(0);
                            setRequestComment('');
                          }
                          setIsSubmitting(false);
                        }}
                      >
                        Send for Approval
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
            'Track waiting and received statuses with date/time and comments.',
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
            </TabsList>

            <TabsContent value="move-cash">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Send Cash to Cashier 2</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="number" placeholder="Amount to Move (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={moveCashAmount || ''} onChange={(event) => setMoveCashAmount(Number(event.target.value))} />
                  <input type="text" placeholder="Comment" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={moveCashComment} onChange={(event) => setMoveCashComment(event.target.value)} />
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (isSubmitting) return;
                      if (!Number.isFinite(moveCashAmount) || moveCashAmount <= 0) {
                        setMessage('Enter a valid amount greater than zero.');
                        return;
                      }
                      setIsSubmitting(true);
                      const result = sendCashToCashier2({ amount: moveCashAmount, comment: moveCashComment });
                      setMessage(result.message);
                      if (result.ok) {
                        setMoveCashAmount(0);
                        setMoveCashComment('');
                      }
                      setIsSubmitting(false);
                    }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send'}
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
                            onClick={() => {
                              if (isSubmitting) return;
                              const amount = decisionAmount[item.id] || 0;
                              if (!Number.isFinite(amount) || amount <= 0) {
                                setMessage('Enter a valid approved amount greater than zero.');
                                return;
                              }
                              setIsSubmitting(true);
                              const result = approveCashTransferRequest(item.id, amount, decisionComment[item.id] ?? '');
                              setMessage(result.message);
                              setIsSubmitting(false);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                              if (isSubmitting) return;
                              setIsSubmitting(true);
                              const result = declineCashTransferRequest(item.id, decisionComment[item.id] ?? '');
                              setMessage(result.message);
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
          </Tabs>
        </div>
      }
    />
  );
}
