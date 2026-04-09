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
    mdTransfers,
    cashDistributions,
    recordManagingDirectorTransfer,
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

  const mdTransferRows = useMemo(
    () => [...mdTransfers].sort((a, b) => new Date(b.transferredAt).getTime() - new Date(a.transferredAt).getTime()),
    [mdTransfers],
  );

  const utilizationRows = useMemo(
    () => [...cashDistributions].sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()),
    [cashDistributions],
  );

  const totalMovedToMd = mdTransferRows.reduce((sum, item) => sum + item.amount, 0);
  const totalUtilized = utilizationRows.reduce((sum, item) => sum + item.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayMdTransfers = mdTransferRows.filter((item) => item.transferredAt.slice(0, 10) === today).length;

  const stats = [
    { title: 'Total To MD', value: `TZS ${totalMovedToMd.toLocaleString()}`, description: 'all managing director transfers' },
    { title: "Today's MD Transfers", value: `${todayMdTransfers}`, description: 'recorded today' },
    { title: 'Total Utilized', value: `TZS ${totalUtilized.toLocaleString()}`, description: 'recorded fund usage' },
    { title: 'Utilization Rows', value: `${utilizationRows.length}`, description: 'reasons and categories saved' },
  ];

  if (user?.role !== 'cashier_1' && user?.role !== 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Move to MD"
        subtitle="Managing Director transfer and utilization is available only to the cashier and accountant desks."
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
      pageTitle="Move to MD"
      subtitle="Move funds to Managing Director, allocate them clearly, and record exactly how the funds are being used."
      stats={stats}
      sections={[
        {
          title: 'Cashier Workflow',
          bullets: [
            'Move to MD records money sent to Managing Director.',
            'Fund Utilization records what the money is being used for and why.',
            'History keeps the Managing Director transfer trail simple and visible.',
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
              <TabsTrigger value="move-cash">Move to MD</TabsTrigger>
              <TabsTrigger value="utilization">Fund Utilization</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="move-cash">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Move to Managing Director</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      type="number"
                      placeholder="Amount to move to MD (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={moveCashAmount || ''}
                      onChange={(event) => setMoveCashAmount(Number(event.target.value))}
                    />
                    <input
                      type="text"
                      placeholder="Purpose / notes for this MD transfer"
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
                          const description = 'Enter the purpose for this MD transfer.';
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
                        const result = await recordManagingDirectorTransfer({
                          amount: moveCashAmount,
                          notes: moveCashPurpose,
                          reference: `MD-${new Date(moveCashDateTime).getTime()}`,
                          actionId: crypto.randomUUID(),
                        });
                        setMessage(result.message);
                        toast({
                          title: result.ok ? 'MD transfer saved' : 'MD transfer failed',
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
                      {isSubmitting ? 'Saving...' : 'Save MD Transfer'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">MD Transfer Summary</p>
                    <Badge className="bg-slate-100 text-slate-700">{mdTransferRows.length} records</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {mdTransferRows.length === 0 ? (
                      <p className="text-sm text-slate-600">No managing director transfers yet.</p>
                    ) : (
                      mdTransferRows.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">TZS {item.amount.toLocaleString()}</p>
                            <Badge className="bg-slate-200 text-slate-900">MD Transfer</Badge>
                          </div>
                          <p className="mt-1 text-slate-600">{item.notes || '-'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(item.transferredAt).toLocaleString()}
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
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Full MD Transfer History</p>
                  <Badge className="bg-slate-100 text-slate-700">{mdTransferRows.length} records</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {mdTransferRows.length === 0 ? (
                    <p className="text-sm text-slate-600">No managing director transfer history yet.</p>
                  ) : (
                    mdTransferRows.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{item.reference}</p>
                          <Badge className="bg-slate-200 text-slate-900">MD Transfer</Badge>
                        </div>
                        <p className="mt-1 text-slate-600">Amount: TZS {item.amount.toLocaleString()}</p>
                        <p className="text-slate-500">Notes: {item.notes || '-'}</p>
                        <p className="text-xs text-slate-500">{new Date(item.transferredAt).toLocaleString()}</p>
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
