import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments } from '@/contexts/PaymentContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ROLE_LABELS, UserRole } from '@/types/auth';

interface AuditRow {
  date: string;
  category: string;
  amount: number;
  comment: string;
  reference: string;
}

interface SavedDocumentRow {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
}

function isInLastDays(iso: string, days: number): boolean {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  return now - ts <= days * 24 * 60 * 60 * 1000;
}

function escapeCsv(value: string | number) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, rows: string[][]) {
  if (typeof window === 'undefined') return;
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAuditRowsCsv(filename: string, rows: AuditRow[]) {
  downloadCsv(filename, [
    ['Date', 'Category', 'Amount (TZS)', 'Comment', 'Reference'],
    ...rows.map((row) => [row.date, row.category, row.amount, row.comment, row.reference]),
  ]);
}

function exportSavedDocumentsCsv(filename: string, rows: SavedDocumentRow[]) {
  downloadCsv(filename, [
    ['Date', 'Form', 'Submitted By Role', 'Summary', 'Reference'],
    ...rows.map((row) => [
      row.submittedAt,
      row.formTitle,
      ROLE_LABELS[row.submittedByRole] ?? row.submittedByRole,
      Object.entries(row.fields).map(([key, value]) => `${key}: ${value}`).join(' | '),
      row.id,
    ]),
  ]);
}

function toTableRows(rows: AuditRow[], exportFilename: string) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => exportAuditRowsCsv(exportFilename, rows)}>
          Export CSV
        </Button>
      </div>
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
    </div>
  );
}

function toSavedDocumentsTable(rows: SavedDocumentRow[], exportFilename: string) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => exportSavedDocumentsCsv(exportFilename, rows)}>
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Form</th>
            <th className="px-2 py-2">Submitted By Role</th>
            <th className="px-2 py-2">Summary</th>
            <th className="px-2 py-2">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-2 py-3 text-slate-600" colSpan={5}>No saved document outputs yet.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-2 py-2 text-slate-700">{new Date(row.submittedAt).toLocaleString()}</td>
                <td className="px-2 py-2 text-slate-700">{row.formTitle}</td>
                <td className="px-2 py-2 text-slate-700">{ROLE_LABELS[row.submittedByRole] ?? row.submittedByRole}</td>
                <td className="px-2 py-2 text-slate-700">
                  {Object.entries(row.fields).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(' | ') || '-'}
                </td>
                <td className="px-2 py-2 text-slate-700">{row.id}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const { payments } = usePayments();
  const { cashTransfers, mdTransfers, logs } = useEventFinance();
  const [savedDocuments, setSavedDocuments] = useState<SavedDocumentRow[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'document_form_outputs'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<SavedDocumentRow, 'id'>;
          return {
            id: entry.id,
            ...data,
          } as SavedDocumentRow;
        }).filter((entry) => Boolean(entry.formId && entry.formTitle && entry.submittedAt));
        setSavedDocuments(next);
      },
      () => {
        setSavedDocuments([]);
      },
    );
    return () => unsub();
  }, []);

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
  const allTimeRows = auditRows;
  const savedDocumentRows = useMemo(
    () => [...savedDocuments].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [savedDocuments],
  );

  const stats = [
    { title: 'Daily Records', value: `${dailyRows.length}`, description: 'today' },
    { title: 'Weekly Records', value: `${weeklyRows.length}`, description: 'last 7 days' },
    { title: 'Monthly Records', value: `${monthlyRows.length}`, description: 'last 30 days' },
    { title: 'All Time Records', value: `${allTimeRows.length}`, description: 'full audit history' },
  ];

  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle="Audit table of operational activity grouped by daily, weekly, monthly, and all time periods with CSV export. Saved Documents shows outputs saved from the Documents section."
      stats={stats}
      sections={[]}
      action={
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="saved-documents">Saved Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">{toTableRows(dailyRows, 'reports-daily.csv')}</TabsContent>
            <TabsContent value="weekly">{toTableRows(weeklyRows, 'reports-weekly.csv')}</TabsContent>
            <TabsContent value="monthly">{toTableRows(monthlyRows, 'reports-monthly.csv')}</TabsContent>
            <TabsContent value="all-time">{toTableRows(allTimeRows, 'reports-all-time.csv')}</TabsContent>
            <TabsContent value="saved-documents">{toSavedDocumentsTable(savedDocumentRows, 'reports-saved-documents.csv')}</TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
