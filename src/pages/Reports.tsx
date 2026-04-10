import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ROLE_LABELS, UserRole } from '@/types/auth';

interface SavedDocumentRow {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
}

type PurchaseItemStatus = 'pending_purchaser' | 'approved_purchaser' | 'declined_purchaser' | 'purchased';

interface PurchaseItemWorkflow {
  id: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  status: PurchaseItemStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  purchaseReference?: string;
  purchaseRecordedAt?: string;
  purchaseRecordedBy?: string;
  purchaseComment?: string;
}

const ROLE_REPORT_DOCUMENTS: Partial<Record<UserRole, Array<{ id: string; title: string }>>> = {
  cashier_1: [
    { id: 'payment_voucher', title: 'Payment Voucher' },
    { id: 'tax_invoice', title: 'Tax Invoice' },
    { id: 'petty_cash', title: 'Petty Cash Voucher' },
    { id: 'hall_registration', title: 'Hall Registration' },
    { id: 'cash_request', title: 'Cash Request' },
  ],
  accountant: [
    { id: 'tax_invoice', title: 'Tax Invoice' },
    { id: 'lpo', title: 'Local Purchase Order' },
    { id: 'delivery_note', title: 'Delivery Note' },
    { id: 'grn', title: 'Goods Received Note' },
    { id: 'stores_ledger', title: 'Stores Ledger' },
    { id: 'petty_cash', title: 'Petty Cash Voucher' },
  ],
  assistant_hall_manager: [
    { id: 'cash_request', title: 'Cash Request' },
  ],
  store_keeper: [
    { id: 'purchase_items', title: 'Purchase Items' },
    { id: 'cash_request', title: 'Cash Request' },
  ],
  manager: [
    { id: 'petty_cash', title: 'Petty Cash Voucher' },
    { id: 'hall_registration', title: 'Hall Registration' },
  ],
};

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

function exportPurchaseRowsCsv(filename: string, rows: PurchaseItemWorkflow[]) {
  downloadCsv(filename, [
    ['Request Date', 'Requested By', 'Status', 'Total Amount', 'Review Comment', 'Purchase Reference', 'Purchase Comment', 'Reference'],
    ...rows.map((row) => [
      row.submittedAt,
      row.fields.requested_by ?? '',
      row.status,
      row.fields.total_amount ?? '',
      row.reviewComment ?? '',
      row.purchaseReference ?? '',
      row.purchaseComment ?? '',
      row.id,
    ]),
  ]);
}

function toSavedDocumentsTable(rows: SavedDocumentRow[], exportFilename: string, emptyText: string) {
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
                <td className="px-2 py-3 text-slate-600" colSpan={5}>{emptyText}</td>
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

function toTimedDocumentTabs(rows: SavedDocumentRow[], exportPrefix: string, emptyText: string) {
  const dailyRows = rows.filter((row) => row.submittedAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const weeklyRows = rows.filter((row) => isInLastDays(row.submittedAt, 7));
  const monthlyRows = rows.filter((row) => isInLastDays(row.submittedAt, 30));

  return (
    <Tabs defaultValue="daily" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="all-time">All Time</TabsTrigger>
      </TabsList>
      <TabsContent value="daily">{toSavedDocumentsTable(dailyRows, `${exportPrefix}-daily.csv`, emptyText)}</TabsContent>
      <TabsContent value="weekly">{toSavedDocumentsTable(weeklyRows, `${exportPrefix}-weekly.csv`, emptyText)}</TabsContent>
      <TabsContent value="monthly">{toSavedDocumentsTable(monthlyRows, `${exportPrefix}-monthly.csv`, emptyText)}</TabsContent>
      <TabsContent value="all-time">{toSavedDocumentsTable(rows, `${exportPrefix}-all-time.csv`, emptyText)}</TabsContent>
    </Tabs>
  );
}

function toPurchaseTable(rows: PurchaseItemWorkflow[], exportFilename: string, emptyText: string) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => exportPurchaseRowsCsv(exportFilename, rows)}>
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-2 py-2">Request Date</th>
              <th className="px-2 py-2">Requested By</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Total Amount</th>
              <th className="px-2 py-2">Review</th>
              <th className="px-2 py-2">Purchase Ref</th>
              <th className="px-2 py-2">Purchase Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-slate-600" colSpan={7}>{emptyText}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-700">{new Date(row.submittedAt).toLocaleString()}</td>
                  <td className="px-2 py-2 text-slate-700">{row.fields.requested_by ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-700">{row.status.replace(/_/g, ' ')}</td>
                  <td className="px-2 py-2 text-slate-700">{row.fields.total_amount ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-700">{row.reviewComment ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-700">{row.purchaseReference ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-700">{row.purchaseComment ?? '-'}</td>
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
  const { user } = useAuth();
  const [savedDocuments, setSavedDocuments] = useState<SavedDocumentRow[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemWorkflow[]>([]);

  useEffect(() => {
    if (!user) return undefined;
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
      () => setSavedDocuments([]),
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'purchaser') return undefined;
    const q = query(collection(db, 'purchase_item_workflow'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<PurchaseItemWorkflow, 'id'>;
          return { id: entry.id, ...data } as PurchaseItemWorkflow;
        });
        setPurchaseItems(next);
      },
      () => setPurchaseItems([]),
    );
    return () => unsub();
  }, [user]);

  const myDocuments = useMemo(
    () => savedDocuments
      .filter((entry) => entry.submittedBy === user?.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [savedDocuments, user?.id],
  );

  const dailyRows = myDocuments.filter((row) => row.submittedAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const weeklyRows = myDocuments.filter((row) => isInLastDays(row.submittedAt, 7));
  const monthlyRows = myDocuments.filter((row) => isInLastDays(row.submittedAt, 30));
  const configuredDocumentTabs = ROLE_REPORT_DOCUMENTS[user?.role ?? 'manager'] ?? [];
  const observedDocumentTabs = myDocuments.reduce<Array<{ id: string; title: string }>>((acc, row) => {
    if (acc.some((item) => item.id === row.formId)) return acc;
    return [...acc, { id: row.formId, title: row.formTitle }];
  }, []);
  const documentTabs = [
    { id: 'all_documents', title: 'All Documents' },
    ...configuredDocumentTabs,
    ...observedDocumentTabs.filter((row) => !configuredDocumentTabs.some((item) => item.id === row.id)),
  ];

  const purchaserRequests = useMemo(
    () => purchaseItems.filter((entry) => entry.status !== 'purchased'),
    [purchaseItems],
  );
  const purchaserCompleted = useMemo(
    () => purchaseItems.filter((entry) => entry.status === 'purchased'),
    [purchaseItems],
  );

  const stats = user?.role === 'purchaser'
    ? [
        { title: 'My Documents', value: `${myDocuments.length}`, description: 'documents saved by purchaser' },
        { title: 'Requests Received', value: `${purchaserRequests.length}`, description: 'from storekeeper/event planner' },
        { title: 'Purchases Done', value: `${purchaserCompleted.length}`, description: 'completed purchase records' },
        { title: 'Monthly Documents', value: `${monthlyRows.length}`, description: 'last 30 days' },
      ]
    : [
        { title: 'My Documents', value: `${myDocuments.length}`, description: 'documents saved by this user' },
        { title: 'Today', value: `${dailyRows.length}`, description: 'documents saved today' },
        { title: 'Last 7 Days', value: `${weeklyRows.length}`, description: 'recent document activity' },
        { title: 'Last 30 Days', value: `${monthlyRows.length}`, description: 'monthly document activity' },
      ];

  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle={
        user?.role === 'purchaser'
          ? 'Purchaser reports only: requests received from Storekeeper/Event Planner, completed purchases, and your own saved document records.'
          : 'Personal document reports only. This page no longer shows general system-wide operational activity.'
      }
      stats={stats}
      sections={[]}
      action={
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {user?.role === 'purchaser' ? (
            <Tabs defaultValue="requests-received" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="requests-received">Requests Received</TabsTrigger>
                <TabsTrigger value="purchases-done">Purchases Done</TabsTrigger>
                <TabsTrigger value="my-documents">My Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="requests-received">
                {toPurchaseTable(purchaserRequests, 'purchaser-requests-received.csv', 'No request records assigned to purchaser yet.')}
              </TabsContent>
              <TabsContent value="purchases-done">
                {toPurchaseTable(purchaserCompleted, 'purchaser-purchases-done.csv', 'No completed purchases recorded yet.')}
              </TabsContent>
              <TabsContent value="my-documents">
                {toSavedDocumentsTable(myDocuments, 'purchaser-my-documents.csv', 'No purchaser document records yet.')}
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue={documentTabs[0]?.id ?? 'all_documents'} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                {documentTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>{tab.title}</TabsTrigger>
                ))}
              </TabsList>
              {documentTabs.map((tab) => {
                const rows = tab.id === 'all_documents'
                  ? myDocuments
                  : myDocuments.filter((row) => row.formId === tab.id);
                const emptyText = tab.id === 'all_documents'
                  ? 'No personal document records yet.'
                  : `No ${tab.title.toLowerCase()} records saved yet.`;

                return (
                  <TabsContent key={tab.id} value={tab.id}>
                    {toTimedDocumentTabs(rows, `reports-${tab.id}`, emptyText)}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      }
    />
  );
}
