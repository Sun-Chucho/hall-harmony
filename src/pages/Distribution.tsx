import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { CashDistributionCategory } from '@/types/eventFinance';

const categories: { value: CashDistributionCategory; label: string }[] = [
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
];

export default function Distribution() {
  const { cashDistributions, recordCashDistribution } = useEventFinance();
  const [category, setCategory] = useState<CashDistributionCategory>('cleaning');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const total = cashDistributions.reduce((sum, item) => sum + item.amount, 0);
    const byCategory = categories.reduce<Record<string, number>>((acc, item) => {
      acc[item.value] = cashDistributions
        .filter((entry) => entry.category === item.value)
        .reduce((sum, entry) => sum + entry.amount, 0);
      return acc;
    }, {});
    return [
      { title: 'Total Distributions', value: `${cashDistributions.length}`, description: 'all records' },
      { title: 'Total Amount', value: `TZS ${total.toLocaleString()}`, description: 'distributed amount' },
      { title: 'Top Category', value: Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ' ') ?? '-', description: 'highest amount category' },
      { title: 'Latest', value: cashDistributions[0] ? new Date(cashDistributions[0].distributedAt).toLocaleDateString() : '-', description: 'last distribution date' },
    ];
  }, [cashDistributions]);

  return (
    <ManagementPageTemplate
      pageTitle="Distributing Money"
      subtitle="Record distributed cash by approved categories."
      stats={stats}
      sections={[]}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New Distribution</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <select
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value as CashDistributionCategory)}
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount (TZS)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={amount || ''}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <input
                type="text"
                placeholder="Reason / Comment"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  const result = recordCashDistribution({ category, amount, reason });
                  setMessage(result.message);
                  if (result.ok) {
                    setAmount(0);
                    setReason('');
                  }
                }}
              >
                Save Distribution
              </Button>
              {message ? <span className="text-xs text-slate-600">{message}</span> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
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
                      <p className="font-semibold text-slate-900">{item.category.replace(/_/g, ' ')}</p>
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
      }
    />
  );
}
