import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventFinance } from '@/contexts/EventFinanceContext';

export default function ManagingDirectorTransfer() {
  const { mdTransfers, recordManagingDirectorTransfer } = useEventFinance();
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const total = mdTransfers.reduce((sum, item) => sum + item.amount, 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = mdTransfers.filter((item) => item.transferredAt.slice(0, 10) === today).length;
    return [
      { title: 'Total Transfers', value: `${mdTransfers.length}`, description: 'all MD transfers' },
      { title: 'Total Amount', value: `TZS ${total.toLocaleString()}`, description: 'moved to managing director' },
      { title: "Today's Transfers", value: `${todayCount}`, description: 'recorded today' },
      { title: 'Latest Ref', value: mdTransfers[0]?.reference ?? '-', description: 'most recent transfer reference' },
    ];
  }, [mdTransfers]);

  return (
    <ManagementPageTemplate
      pageTitle="Managing Director"
      subtitle="Enter and track funds moved to Managing Director."
      stats={stats}
      sections={[]}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Record Transfer</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                type="number"
                placeholder="Amount (TZS)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={amount || ''}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={async () => {
                  const result = await recordManagingDirectorTransfer({ amount, notes });
                  setMessage(result.message);
                  if (result.ok) {
                    setAmount(0);
                    setNotes('');
                  }
                }}
              >
                Submit Transfer
              </Button>
              {message ? <span className="text-xs text-slate-600">{message}</span> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Transfer History</p>
              <Badge className="bg-slate-100 text-slate-700">{mdTransfers.length} records</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {mdTransfers.length === 0 ? (
                <p className="text-sm text-slate-600">No transfers recorded yet.</p>
              ) : (
                mdTransfers.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{item.reference}</p>
                      <Badge className="bg-slate-200 text-slate-900">MD Transfer</Badge>
                    </div>
                    <p className="text-slate-600">Amount: TZS {item.amount.toLocaleString()}</p>
                    <p className="text-slate-500">Notes: {item.notes || '-'}</p>
                    <p className="text-xs text-slate-500">{new Date(item.transferredAt).toLocaleString()}</p>
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
