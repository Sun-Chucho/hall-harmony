import { useMemo, useRef, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { useToast } from '@/hooks/use-toast';
import { CashDistributionCategory } from '@/types/eventFinance';

const distributionCategories: { value: CashDistributionCategory; label: string }[] = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'stationary', label: 'Stationery' },
  { value: 'repairs_maintenance', label: 'Repairs and Maintenance' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'cooling', label: 'Cooling' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
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
  const {
    cashTransfers,
    cashDistributions,
    sendCashToCashier2,
    recordCashDistribution,
  } = useEventFinance();

  const [message, setMessage] = useState('');
  const [moveCashAmount, setMoveCashAmount] = useState(0);
  const [moveCashPurpose, setMoveCashPurpose] = useState('');
  const [moveCashDateTime, setMoveCashDateTime] = useState(() => toDateTimeLocal(new Date().toISOString()));
  const [distributionCategory, setDistributionCategory] = useState<CashDistributionCategory>('cleaning');
  const [distributionAmount, setDistributionAmount] = useState(0);
  const [distributionReason, setDistributionReason] = useState('');
  const [distributionOtherDetails, setDistributionOtherDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastActionAtRef = useRef(0);

  const canRunAction = () => {
    if (Date.now() - lastActionAtRef.current < 900) return false;
    lastActionAtRef.current = Date.now();
    return true;
  };

  const movementRows = useMemo(
    () => [...cashTransfers].sort(
      (a, b) => new Date(b.receivedAt ?? b.sentAt ?? b.requestedAt).getTime() - new Date(a.receivedAt ?? a.sentAt ?? a.requestedAt).getTime(),
    ),
    [cashTransfers],
  );

  const utilizationRows = useMemo(
    () => [...cashDistributions].sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()),
    [cashDistributions],
  );

  const totalMoved = movementRows.reduce((sum, item) => sum + (item.approvedAmount || item.requestedAmount), 0);
  const totalUtilized = utilizationRows.reduce((sum, item) => sum + item.amount, 0);
  const waitingReceipts = movementRows.filter((item) => item.status === 'sent_to_cashier_2').length;

  const stats = [
    { title: 'Total Moved', value: `TZS ${totalMoved.toLocaleString()}`, description: 'all cash movement records' },
    { title: 'Waiting Receipt', value: `${waitingReceipts}`, description: 'sent but not yet confirmed' },
    { title: 'Total Utilized', value: `TZS ${totalUtilized.toLocaleString()}`, description: 'recorded fund usage' },
    { title: 'Utilization Rows', value: `${utilizationRows.length}`, description: 'reasons and categories saved' },
  ];

  if (user?.role !== 'cashier_1' && user?.role !== 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Cash Movement"
        subtitle="Cash movement is available only to the cashier and accountant desks."
        stats={stats}
        sections={[]}
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
      subtitle="Move cash, allocate it clearly, and record exactly how the funds are being used."
      stats={stats}
      sections={[
        {
          title: 'Cashier Workflow',
          bullets: [
            'Move Cash records where money has been sent.',
            'Fund Utilization records what the money is being used for and why.',
            'History keeps the movement trail simple and visible.',
          ],
        },
      ]}
      action={
        <div className="space-y-6">
          {message ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
          ) : null}

          <Tabs defaultValue="move-cash" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="move-cash">Move Cash</TabsTrigger>
              <TabsTrigger value="utilization">Fund Utilization</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="move-cash">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Send Cash</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      type="number"
                      placeholder="Amount to move (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={moveCashAmount || ''}
                      onChange={(event) => setMoveCashAmount(Number(event.target.value))}
                    />
                    <input
                      type="text"
                      placeholder="Purpose of this movement"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={moveCashPurpose}
                      onChange={(event) => setMoveCashPurpose(event.target.value)}
                    />
                    <input
                      type="datetime-local"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={moveCashDateTime}
                      onChange={(event) => setMoveCashDateTime(event.target.value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (isSubmitting) return;
                        if (!canRunAction()) return;
                        if (!Number.isFinite(moveCashAmount) || moveCashAmount <= 0) {
                          const description = 'Enter a valid amount greater than zero.';
                          setMessage(description);
                          toast({ title: 'Invalid amount', description, variant: 'destructive' });
                          return;
                        }
                        if (!moveCashPurpose.trim()) {
                          const description = 'Enter the purpose for this cash movement.';
                          setMessage(description);
                          toast({ title: 'Purpose required', description, variant: 'destructive' });
                          return;
                        }
                        if (!moveCashDateTime || Number.isNaN(new Date(moveCashDateTime).getTime())) {
                          const description = 'Enter a valid movement date and time.';
                          setMessage(description);
                          toast({ title: 'Invalid date/time', description, variant: 'destructive' });
                          return;
                        }

                        setIsSubmitting(true);
                        const result = await sendCashToCashier2({
                          amount: moveCashAmount,
                          comment: moveCashPurpose,
                          transferDateTime: moveCashDateTime,
                          actionId: crypto.randomUUID(),
                        });
                        setMessage(result.message);
                        toast({
                          title: result.ok ? 'Cash movement saved' : 'Cash movement failed',
                          description: result.message,
                          variant: result.ok ? 'default' : 'destructive',
                        });
                        if (result.ok) {
                          setMoveCashAmount(0);
                          setMoveCashPurpose('');
                          setMoveCashDateTime(toDateTimeLocal(new Date().toISOString()));
                        }
                        setIsSubmitting(false);
                      }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Cash Movement'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Movement Summary</p>
                    <Badge className="bg-slate-100 text-slate-700">{movementRows.length} records</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {movementRows.length === 0 ? (
                      <p className="text-sm text-slate-600">No cash movement records yet.</p>
                    ) : (
                      movementRows.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">TZS {(item.approvedAmount || item.requestedAmount).toLocaleString()}</p>
                            <Badge className="bg-slate-200 text-slate-900">{statusLabel(item.status)}</Badge>
                          </div>
                          <p className="mt-1 text-slate-600">{item.requestComment || '-'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(item.receivedAt ?? item.sentAt ?? item.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="utilization">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Allocate Funds</p>
                  <div className="mt-4 grid gap-3">
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
                      placeholder="Amount allocated (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionAmount || ''}
                      onChange={(event) => setDistributionAmount(Number(event.target.value))}
                    />
                    {distributionCategory === 'other' ? (
                      <input
                        type="text"
                        placeholder="State the other use"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={distributionOtherDetails}
                        onChange={(event) => setDistributionOtherDetails(event.target.value)}
                      />
                    ) : null}
                    <textarea
                      placeholder="Reason: how are these funds being utilized?"
                      className="min-h-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={distributionReason}
                      onChange={(event) => setDistributionReason(event.target.value)}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (isSubmitting) return;
                        if (!canRunAction()) return;
                        if (!Number.isFinite(distributionAmount) || distributionAmount <= 0) {
                          const description = 'Enter a valid allocation amount greater than zero.';
                          setMessage(description);
                          toast({ title: 'Invalid amount', description, variant: 'destructive' });
                          return;
                        }
                        if (!distributionReason.trim()) {
                          const description = 'State clearly how the funds are being utilized.';
                          setMessage(description);
                          toast({ title: 'Reason required', description, variant: 'destructive' });
                          return;
                        }
                        if (distributionCategory === 'other' && !distributionOtherDetails.trim()) {
                          const description = 'State the other utilization category.';
                          setMessage(description);
                          toast({ title: 'Other details required', description, variant: 'destructive' });
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
                          title: result.ok ? 'Fund utilization saved' : 'Save failed',
                          description: result.message,
                          variant: result.ok ? 'default' : 'destructive',
                        });
                        if (result.ok) {
                          setDistributionAmount(0);
                          setDistributionReason('');
                          setDistributionOtherDetails('');
                        }
                        setIsSubmitting(false);
                      }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Utilization'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">How Funds Were Used</p>
                    <Badge className="bg-slate-100 text-slate-700">{utilizationRows.length} rows</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {utilizationRows.length === 0 ? (
                      <p className="text-sm text-slate-600">No utilization records yet.</p>
                    ) : (
                      utilizationRows.slice(0, 10).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {item.category === 'other'
                                ? item.customCategoryLabel ?? 'Other'
                                : statusLabel(item.category)}
                            </p>
                            <Badge className="bg-slate-200 text-slate-900">TZS {item.amount.toLocaleString()}</Badge>
                          </div>
                          <p className="mt-1 text-slate-600">{item.reason}</p>
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
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Full Cash Movement History</p>
                  <Badge className="bg-slate-100 text-slate-700">{movementRows.length} records</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {movementRows.length === 0 ? (
                    <p className="text-sm text-slate-600">No cash movement history yet.</p>
                  ) : (
                    movementRows.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.id}</p>
                          <Badge className="bg-slate-200 text-slate-900">{statusLabel(item.status)}</Badge>
                        </div>
                        <p className="mt-1 text-slate-600">Amount: TZS {(item.approvedAmount || item.requestedAmount).toLocaleString()}</p>
                        <p className="text-slate-500">Purpose: {item.requestComment || '-'}</p>
                        <p className="text-slate-500">Decision note: {item.decisionComment || '-'}</p>
                        <p className="text-slate-500">Receipt note: {item.receiveComment || '-'}</p>
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
