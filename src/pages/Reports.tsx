import { useMemo } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments } from '@/contexts/PaymentContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';

interface AuditRow {
  date: string;
  category: string;
  amount: number;
  comment: string;
  reference: string;
}

function isInLastDays(iso: string, days: number): boolean {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  return now - ts <= days * 24 * 60 * 60 * 1000;
}

function toTableRows(rows: AuditRow[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Category</th>
            <th className="px-2 py-2">Amount (TZS)</th>
            <th className="px-2 py-2">Comment</th>
            <th className="px-2 py-2">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-2 py-3 text-slate-600" colSpan={5}>No records for this period.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.reference}-${index}`} className="border-b border-slate-100">
                <td className="px-2 py-2 text-slate-700">{new Date(row.date).toLocaleString()}</td>
                <td className="px-2 py-2 text-slate-700">{row.category}</td>
                <td className="px-2 py-2 text-slate-700">{row.amount.toLocaleString()}</td>
                <td className="px-2 py-2 text-slate-700">{row.comment || '-'}</td>
                <td className="px-2 py-2 text-slate-700">{row.reference}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const { payments } = usePayments();
  const { cashTransfers, mdTransfers, logs } = useEventFinance();

  const auditRows = useMemo<AuditRow[]>(() => {
    const paymentRows: AuditRow[] = payments.map((entry) => ({
      date: entry.receivedAt,
      category: 'Payment Received',
      amount: entry.amount,
      comment: entry.notes,
      reference: `${entry.bookingId} / ${entry.referenceNumber}`,
    }));

    const cashMoveRows: AuditRow[] = cashTransfers.map((entry) => ({
      date: entry.receivedAt ?? entry.sentAt ?? entry.requestedAt,
      category: `Cash Movement (${entry.status.replace(/_/g, ' ')})`,
      amount: entry.approvedAmount || entry.requestedAmount,
      comment: [entry.requestComment, entry.decisionComment, entry.receiveComment].filter(Boolean).join(' | '),
      reference: entry.id,
    }));

    const mdRows: AuditRow[] = mdTransfers.map((entry) => ({
      date: entry.transferredAt,
      category: 'Managing Director Transfer',
      amount: entry.amount,
      comment: entry.notes,
      reference: entry.reference,
    }));

    const logRows: AuditRow[] = logs.map((entry) => ({
      date: entry.timestamp,
      category: `Audit: ${entry.action}`,
      amount: 0,
      comment: entry.detail,
      reference: entry.referenceId,
    }));

    return [...paymentRows, ...cashMoveRows, ...mdRows, ...logRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [cashTransfers, logs, mdTransfers, payments]);

  const dailyRows = auditRows.filter((row) => row.date.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const weeklyRows = auditRows.filter((row) => isInLastDays(row.date, 7));
  const monthlyRows = auditRows.filter((row) => isInLastDays(row.date, 30));

  const stats = [
    { title: 'Daily Records', value: `${dailyRows.length}`, description: 'today' },
    { title: 'Weekly Records', value: `${weeklyRows.length}`, description: 'last 7 days' },
    { title: 'Monthly Records', value: `${monthlyRows.length}`, description: 'last 30 days' },
    { title: 'Total Audit Rows', value: `${auditRows.length}`, description: 'all tracked actions' },
  ];

  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle="Audit table of operational activity grouped by daily, weekly, and monthly periods."
      stats={stats}
      sections={[]}
      action={
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">{toTableRows(dailyRows)}</TabsContent>
            <TabsContent value="weekly">{toTableRows(weeklyRows)}</TabsContent>
            <TabsContent value="monthly">{toTableRows(monthlyRows)}</TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
