import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
import {
  CASH_REQUEST_WORKFLOW_COLLECTION,
  CashRequestWorkflow,
  buildMoneyMovementRows,
  downloadCsv,
  normalizeCashRequest,
} from '@/lib/requestWorkflows';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { CashDistributionCategory } from '@/types/eventFinance';

const cashUseCategories: Array<{ value: CashDistributionCategory; label: string }> = [
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
  { value: 'other', label: 'Other' },
];

export default function CashMovement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    mdTransfers,
    cashDistributions,
    recordManagingDirectorTransfer,
    recordCashDistribution,
  } = useEventFinance();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [mdAmount, setMdAmount] = useState('');
  const [mdNotes, setMdNotes] = useState('');
  const [cashUseAmount, setCashUseAmount] = useState('');
  const [cashUseCategory, setCashUseCategory] = useState<CashDistributionCategory | ''>('');
  const [cashUseOtherDetails, setCashUseOtherDetails] = useState('');
  const [cashUseReason, setCashUseReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setCashRequests([]);
      return undefined;
    }

    const requestsQuery = query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setListenerError(null);
        setCashRequests(snapshot.docs.map((item) => normalizeCashRequest({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('cash-movement', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => unsub();
  }, [user]);

  const rows = useMemo(
    () => buildMoneyMovementRows(cashRequests, mdTransfers, cashDistributions),
    [cashDistributions, cashRequests, mdTransfers],
  );

  if (!user || (user.role !== 'cashier_1' && user.role !== 'accountant')) {
    return (
      <ManagementPageTemplate
        pageTitle="History of Money Movement"
        subtitle="Access Restricted"
        stats={[]}
        sections={[]}
        action={
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            You do not have permission to view this page.
          </div>
        }
      />
    );
  }

  const handleSaveMdTransfer = async () => {
    const amount = Number(mdAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setIsSaving(true);
    const result = await recordManagingDirectorTransfer({
      amount,
      notes: mdNotes.trim(),
      actionId: crypto.randomUUID(),
    });
    toast({ title: result.ok ? 'Saved' : 'Failed', description: result.message, variant: result.ok ? 'default' : 'destructive' });
    if (result.ok) {
      setMdAmount('');
      setMdNotes('');
    }
    setIsSaving(false);
  };

  const handleSaveCashUse = async () => {
    const amount = Number(cashUseAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!cashUseCategory) {
      toast({ title: 'Missing category', description: 'Select a cash use category first.', variant: 'destructive' });
      return;
    }
    if (cashUseCategory === 'other' && !cashUseOtherDetails.trim()) {
      toast({ title: 'Missing details', description: 'Enter the Other cash-use details.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const result = await recordCashDistribution({
      amount,
      category: cashUseCategory,
      reason: cashUseReason.trim(),
      otherDetails: cashUseCategory === 'other' ? cashUseOtherDetails.trim() : undefined,
      actionId: crypto.randomUUID(),
    });
    toast({ title: result.ok ? 'Saved' : 'Failed', description: result.message, variant: result.ok ? 'default' : 'destructive' });
    if (result.ok) {
      setCashUseAmount('');
      setCashUseCategory('');
      setCashUseOtherDetails('');
      setCashUseReason('');
    }
    setIsSaving(false);
  };

  return (
    <ManagementPageTemplate
      pageTitle={user.role === 'cashier_1' ? 'Cash Use' : 'History of Money Movement'}
      subtitle={
        user.role === 'cashier_1'
          ? 'Record cash use, move cash to MD, and review the full movement history in one place.'
          : 'Table history of payment vouchers, disbursements, MD movements, and related cash actions.'
      }
      stats={[
        { title: 'History Rows', value: `${rows.length}`, description: 'combined cash movement records' },
        { title: 'Moved to MD', value: `${mdTransfers.length}`, description: 'managing director transfer records' },
        { title: 'Cash Use', value: `${cashDistributions.length}`, description: 'recorded cash use rows' },
      ]}
      sections={[]}
      action={
        <div className="space-y-6">
          {listenerError ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listenerError}
            </div>
          ) : null}
          {user.role === 'cashier_1' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Move to MD</p>
                <div className="mt-4 grid gap-3">
                  <input className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" placeholder="Amount moved to MD (TZS)" value={mdAmount} onChange={(event) => setMdAmount(event.target.value)} />
                  <textarea className="min-h-24 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" placeholder="Notes" value={mdNotes} onChange={(event) => setMdNotes(event.target.value)} />
                  <Button onClick={() => void handleSaveMdTransfer()} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save MD Movement'}
                  </Button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cash Use</p>
                <div className="mt-4 grid gap-3">
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={cashUseCategory}
                    onChange={(event) => setCashUseCategory(event.target.value as CashDistributionCategory | '')}
                  >
                    <option value="">Select cash use category</option>
                    {cashUseCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {cashUseCategory === 'other' ? (
                    <input
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      placeholder="Other cash use details"
                      value={cashUseOtherDetails}
                      onChange={(event) => setCashUseOtherDetails(event.target.value)}
                    />
                  ) : null}
                  <input className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" placeholder="Amount used (TZS)" value={cashUseAmount} onChange={(event) => setCashUseAmount(event.target.value)} />
                  <textarea className="min-h-24 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" placeholder="Reason / notes" value={cashUseReason} onChange={(event) => setCashUseReason(event.target.value)} />
                  <Button onClick={() => void handleSaveCashUse()} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Cash Use'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">History of Money Movement</p>
                <p className="mt-1 text-sm text-slate-600">Includes amount moved to MD, payment voucher creation, funds disbursed, and other cash movement actions.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadCsv('money-movement-history.csv', [
                ['Date', 'Reference', 'Amount', 'Movement Stage', 'Notes'],
                ...rows.map((entry) => [entry.date, entry.reference, entry.amount, entry.movementStage, entry.notes]),
              ])}>
                Download as CSV
              </Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Request / Voucher Reference</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Movement Stage</th>
                    <th className="px-3 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={5}>No money movement history recorded yet.</td>
                    </tr>
                  ) : (
                    rows.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-700">{new Date(entry.date).toLocaleString()}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                        <td className="px-3 py-3 text-slate-700">{Number(entry.amount).toLocaleString()}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.movementStage}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.notes}</td>
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
