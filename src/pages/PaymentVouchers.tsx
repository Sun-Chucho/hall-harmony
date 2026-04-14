import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
import { DOCUMENT_OUTPUTS_COLLECTION, DocumentOutput, downloadCsv, normalizeDocumentOutput } from '@/lib/requestWorkflows';
import { ROLE_LABELS } from '@/types/auth';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

export default function PaymentVouchers() {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<DocumentOutput[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOutputs([]);
      return undefined;
    }

    const outputsQuery = query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      outputsQuery,
      (snapshot) => {
        setListenerError(null);
        setOutputs(snapshot.docs.map((item) => normalizeDocumentOutput({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('payment-vouchers', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => unsub();
  }, [user]);

  const vouchers = useMemo(
    () => outputs.filter((entry) => entry.formId === 'payment_voucher'),
    [outputs],
  );

  if (!user || user.role !== 'accountant') {
    return (
      <ManagementPageTemplate
        pageTitle="Payment Vouchers"
        subtitle="Access Restricted"
        stats={[]}
        sections={[]}
        action={
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            You do not have permission to view the payment voucher register.
          </div>
        }
      />
    );
  }

  return (
    <ManagementPageTemplate
      pageTitle="Payment Vouchers"
      subtitle="Table register of all payment vouchers sent to Accountant, including manual entries from Documents."
      stats={[
        { title: 'Total Vouchers', value: `${vouchers.length}`, description: 'payment vouchers recorded in the system' },
      ]}
      sections={[]}
      action={
        <div className="space-y-4">
          {listenerError ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listenerError}
            </div>
          ) : null}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Voucher Register</p>
                <p className="mt-1 text-sm text-slate-600">Download the full register as CSV or review it directly in the table.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadCsv('payment-vouchers.csv', [
                  ['Date', 'Reference Number', 'Voucher Number', 'Request Reference', 'Payee', 'Amount', 'Department', 'Submitted By', 'Description'],
                  ...vouchers.map((entry) => [
                    entry.submittedAt,
                    entry.reference ?? '',
                    entry.fields.voucher_number ?? '',
                    entry.fields.request_reference ?? entry.fields.request_number ?? '',
                    entry.fields.payee_name ?? '',
                    entry.fields.amount ?? '',
                    entry.fields.department ?? '',
                    ROLE_LABELS[entry.submittedByRole] ?? entry.submittedByRole,
                    entry.fields.description ?? '',
                  ]),
                ])}
              >
                Download as CSV
              </Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1240px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Reference Number</th>
                    <th className="px-3 py-3">Voucher Number</th>
                    <th className="px-3 py-3">Request Reference</th>
                    <th className="px-3 py-3">Payee</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Submitted By</th>
                    <th className="px-3 py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={9}>No payment vouchers recorded yet.</td>
                    </tr>
                  ) : (
                    vouchers.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference ?? '-'}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900">{entry.fields.voucher_number ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.fields.request_reference ?? entry.fields.request_number ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.fields.payee_name ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.fields.amount ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.fields.department ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{ROLE_LABELS[entry.submittedByRole]}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.fields.description ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
}
