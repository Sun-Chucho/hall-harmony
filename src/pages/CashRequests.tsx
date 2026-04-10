import { FormEvent, useEffect, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { confirmAction } from '@/lib/confirmAction';
import { db } from '@/lib/firebase';
import { ROLE_LABELS, UserRole } from '@/types/auth';

type CashRequestStatus =
  | 'pending_accountant'
  | 'declined_accountant'
  | 'pending_halls_manager'
  | 'approved_halls_manager'
  | 'declined_halls_manager'
  | 'pending_cashier'
  | 'distribution_recorded';

interface CashRequestWorkflow {
  id: string;
  submittedAt: string;
  submittedBy: string;
  submittedByRole: UserRole;
  fields: Record<string, string>;
  status: CashRequestStatus;
  accountantReviewedAt?: string;
  accountantReviewedBy?: string;
  accountantComment?: string;
  hallsManagerReviewedAt?: string;
  hallsManagerReviewedBy?: string;
  hallsManagerComment?: string;
  cashierReviewedAt?: string;
  cashierReviewedBy?: string;
  paymentVoucherNumber?: string;
}

const CASH_REQUEST_WORKFLOW_COLLECTION = 'cash_request_workflow';
const DOCUMENT_OUTPUTS_COLLECTION = 'document_form_outputs';

function normalizeCashRequest(entry: CashRequestWorkflow): CashRequestWorkflow {
  const legacyEntry = entry as any;
  let normalizedStatus = entry.status;
  if (legacyEntry.status === 'voucher_recorded') normalizedStatus = 'distribution_recorded';
  else if (legacyEntry.status === 'approved_halls_manager') normalizedStatus = 'pending_cashier';
  
  return {
    ...entry,
    status: normalizedStatus as CashRequestStatus,
  };
}

function inputClass(extra = '') {
  return `h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm ${extra}`;
}

function renderFieldsList(fields: Record<string, string>) {
  const visible = Object.entries(fields).filter(([_, v]) => v && v.trim() !== '');
  if (visible.length === 0) return null;
  return (
    <div className="mt-2 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
      <div className="grid gap-1 md:grid-cols-2 max-h-[250px] overflow-y-auto pr-2">
        {visible.map(([key, value]) => (
          <p key={key} className="break-words">
            <span className="font-semibold capitalize text-slate-900">{key.replace(/_/g, ' ')}:</span> {value}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function CashRequests() {
  const { user } = useAuth();
  const { sendManagerAlert } = useMessages();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [accountantComment, setAccountantComment] = useState<Record<string, string>>({});
  const [managerComment, setManagerComment] = useState<Record<string, string>>({});
  const [voucherForm, setVoucherForm] = useState<Record<string, { request_number: string, voucher_number: string, payee_name: string, department: string, pos_code: string, date: string, address: string, tin: string, invoice_number: string, invoice_date: string, amount: string, description: string }>>({});
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [activeTab, setActiveTab] = useState('my-requests');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc'), limit(300));
    const unsub = onSnapshot(q, (snapshot) => {
      setCashRequests(snapshot.docs.map((item) => normalizeCashRequest({ id: item.id, ...item.data() } as CashRequestWorkflow)));
    });
    return () => unsub();
  }, [user]);

  const refreshPageAfterSave = () => {
    setTimeout(() => { setIsSavingAction(false); }, 700);
  };

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || isSavingAction) return;
    if (!confirmAction('Submit cash request?')) return;
    setIsSavingAction(true);

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const normalized = String(value).trim();
      if (!normalized) continue;
      if (fields[key]) fields[key] = `${fields[key]}, ${normalized}`;
      else fields[key] = normalized;
    }

    const payload = {
      submittedAt: new Date().toISOString(),
      submittedBy: user.id,
      submittedByRole: user.role,
      fields,
      status: 'pending_accountant',
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), payload);
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'cash_request',
        formTitle: 'Cash Request Form',
        submittedAt: payload.submittedAt,
        submittedBy: payload.submittedBy,
        submittedByRole: payload.submittedByRole,
        fields,
        updatedAt: serverTimestamp(),
      });
      event.currentTarget.reset();
      refreshPageAfterSave();
    } catch {
      setIsSavingAction(false);
    }
  };

  const handleAccountantDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'accountant' || isSavingAction) return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    setIsSavingAction(true);
    
    const request = cashRequests.find((entry) => entry.id === requestId);
    const comment = accountantComment[requestId]?.trim() ?? '';
    
    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, requestId), {
        status: decision === 'approve' ? 'pending_halls_manager' : 'declined_accountant',
        accountantReviewedAt: new Date().toISOString(),
        accountantReviewedBy: user.id,
        accountantComment: comment || (decision === 'approve' ? 'Approved by accountant and sent to Halls Manager.' : 'Declined by accountant.'),
        updatedAt: serverTimestamp(),
      });
      if (decision === 'approve' && request) {
        await sendManagerAlert({
          title: 'Cash Request Pending Halls Manager',
          body: `Cash request approved by accountant. Requested amount: TZS ${request.fields.total_requested ?? '0'}.`,
        });
      }
      refreshPageAfterSave();
    } catch {
      setIsSavingAction(false);
    }
  };

  const handleManagerDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'manager' || isSavingAction) return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    setIsSavingAction(true);
    
    const comment = managerComment[requestId]?.trim() ?? '';
    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, requestId), {
        status: decision === 'approve' ? 'pending_cashier' : 'declined_halls_manager',
        hallsManagerReviewedAt: new Date().toISOString(),
        hallsManagerReviewedBy: user.id,
        hallsManagerComment: comment,
        updatedAt: serverTimestamp(),
      });
      refreshPageAfterSave();
    } catch {
      setIsSavingAction(false);
    }
  };

  const handleCashierRecordVoucher = async (requestId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.role !== 'cashier_1' || isSavingAction) return;
    if (!confirmAction(`Record this payment voucher and mark cash distributed?`)) return;
    setIsSavingAction(true);

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      fields[key] = String(value).trim();
    }
    
    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, requestId), {
        status: 'distribution_recorded',
        paymentVoucherNumber: fields.voucher_number,
        cashierReviewedAt: new Date().toISOString(),
        cashierReviewedBy: user.id,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'payment_voucher',
        formTitle: 'Payment Voucher',
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
        submittedByRole: user.role,
        fields: {
          request_number: requestId,
          ...fields,
          source: 'cash_request_workflow',
        },
        updatedAt: serverTimestamp(),
      });
      refreshPageAfterSave();
    } catch {
      setIsSavingAction(false);
    }
  };

  const myRequests = cashRequests.filter(r => r.submittedBy === user?.id);
  const accountantIntake = cashRequests.filter(r => r.status === 'pending_accountant');
  const managerIntake = cashRequests.filter(r => r.status === 'pending_halls_manager');
  const cashierDistribution = cashRequests.filter(r => r.status === 'pending_cashier');

  const canCreate = user?.role === 'cashier_1' || user?.role === 'store_keeper' || user?.role === 'assistant_hall_manager' || user?.role === 'accountant';

  if (!user) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Cash Requests"
      subtitle="Create, review, and track the status of all cash requests here."
      stats={[
        { title: 'My Requests', value: String(myRequests.length), description: 'requests submitted by you' },
        { title: 'Pending Approval', value: String(cashRequests.filter(r => r.status.includes('pending')).length), description: 'total requests awaiting action' },
      ]}
      sections={[]}
      action={
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="my-requests">My Requests</TabsTrigger>
              {canCreate && <TabsTrigger value="create">New Request</TabsTrigger>}
              {user.role === 'accountant' && <TabsTrigger value="accountant-queue">Accountant Queue ({accountantIntake.length})</TabsTrigger>}
              {user.role === 'manager' && <TabsTrigger value="manager-queue">Manager Queue ({managerIntake.length})</TabsTrigger>}
              {user.role === 'cashier_1' && <TabsTrigger value="cashier-queue">Cashier Disbursement ({cashierDistribution.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="my-requests" className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">My Cash Requests</p>
                <div className="mt-3 space-y-3">
                  {myRequests.length === 0 ? (
                    <p className="text-sm text-slate-500">You haven't submitted any cash requests.</p>
                  ) : (
                    myRequests.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {new Date(entry.submittedAt).toLocaleString()}
                          </p>
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {entry.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {renderFieldsList(entry.fields)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {canCreate && (
              <TabsContent value="create" className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Fill Cash Request</p>
                  <form className="space-y-3" onSubmit={handleCreateRequest}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="pef_no" className={inputClass()} placeholder="PEF No" required />
                      <input name="date" className={inputClass()} placeholder="Date / Tarehe" required />
                      <input name="full_name" className={inputClass()} placeholder="Full Name / Jina Kamili" required />
                      <input name="designation" className={inputClass()} placeholder="Designation / Cheo" required />
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs uppercase text-slate-500 font-semibold mt-4">
                      <p>No</p><p>Item / Maelezo</p><p>Qty</p><p>Price</p><p>Amount</p>
                    </div>
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="mt-2 grid grid-cols-5 gap-2">
                        <input name={`row_${i}`} className={inputClass()} defaultValue={String(i)} />
                        <input name={`item_${i}`} className={inputClass()} />
                        <input name={`qty_${i}`} className={inputClass()} type="number" />
                        <input name={`price_${i}`} className={inputClass()} type="number" />
                        <input name={`amount_${i}`} className={inputClass()} type="number" />
                      </div>
                    ))}
                    <input name="total_requested" className={`${inputClass()} w-full mt-3`} placeholder="Total Amount Requested (TZS)" required type="number" />
                    <textarea name="amount_words" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} placeholder="Amount in Words" required />
                    <textarea name="requester_declaration" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} placeholder="Requester Declaration / Sababu" required />
                    <div className="mt-2">
                      <Button type="submit" disabled={isSavingAction}>Submit Cash Request</Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            )}

            {user.role === 'accountant' && (
              <TabsContent value="accountant-queue" className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {accountantIntake.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending requests.</p>
                  ) : (
                    accountantIntake.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm mb-3">
                        <p className="font-semibold text-slate-900">
                          {ROLE_LABELS[entry.submittedByRole]} | {new Date(entry.submittedAt).toLocaleString()}
                        </p>
                        {renderFieldsList(entry.fields)}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            className={inputClass('w-[320px]')}
                            placeholder="Accountant note (optional)"
                            value={accountantComment[entry.id] ?? ''}
                            onChange={(e) => setAccountantComment({ ...accountantComment, [entry.id]: e.target.value })}
                          />
                          <Button size="sm" disabled={isSavingAction} onClick={() => handleAccountantDecision(entry.id, 'approve')}>Forward to Manager</Button>
                          <Button size="sm" variant="outline" disabled={isSavingAction} onClick={() => handleAccountantDecision(entry.id, 'decline')}>Decline</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

            {user.role === 'manager' && (
              <TabsContent value="manager-queue" className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {managerIntake.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending requests.</p>
                  ) : (
                    managerIntake.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm mb-3">
                        <p className="font-semibold text-slate-900">
                          {ROLE_LABELS[entry.submittedByRole]} | {new Date(entry.submittedAt).toLocaleString()}
                        </p>
                        <p className="text-slate-500 mb-2">Accountant Note: {entry.accountantComment ?? '-'}</p>
                        {renderFieldsList(entry.fields)}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            className={inputClass('w-[320px]')}
                            placeholder="Manager note (required if declining)"
                            value={managerComment[entry.id] ?? ''}
                            onChange={(e) => setManagerComment({ ...managerComment, [entry.id]: e.target.value })}
                          />
                          <Button size="sm" disabled={isSavingAction} onClick={() => handleManagerDecision(entry.id, 'approve')}>Approve & Send to Cashier</Button>
                          <Button size="sm" variant="outline" disabled={isSavingAction} onClick={() => handleManagerDecision(entry.id, 'decline')}>Decline</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

            {user.role === 'cashier_1' && (
              <TabsContent value="cashier-queue" className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Distribute Cash & Fill Voucher</p>
                  {cashierDistribution.length === 0 ? (
                    <p className="text-sm text-slate-500">No requests awaiting distribution.</p>
                  ) : (
                    cashierDistribution.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm mb-3">
                        <p className="font-semibold text-slate-900 leading-none">
                          Authorized Request: {new Date(entry.submittedAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-slate-500">Manager Note: {entry.hallsManagerComment ?? '-'}</p>
                        <div className="mt-3">
                          {renderFieldsList(entry.fields)}
                        </div>
                        
                        <div className="mt-6 border-t border-slate-300 pt-4">
                          <p className="font-bold text-slate-800 mb-3">Fill Payment Voucher</p>
                          <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => handleCashierRecordVoucher(entry.id, e)}>
                            <input name="amount" className={inputClass()} defaultValue={entry.fields.total_requested} readOnly required />
                            <input name="payee_name" className={inputClass()} defaultValue={entry.fields.full_name} placeholder="Customer / Payee Name" required />
                            <input name="voucher_number" className={inputClass()} placeholder="Payment Voucher Number" required />
                            <input name="department" className={inputClass()} defaultValue={entry.fields.designation} placeholder="Company / Department" required />
                            <input name="pos_code" className={inputClass()} placeholder="POS Code" />
                            <input name="date" className={inputClass()} defaultValue={new Date().toISOString().slice(0, 10)} required />
                            <input name="address" className={inputClass()} placeholder="Address" />
                            <input name="tin" className={inputClass()} placeholder="Customer TIN" />
                            <input name="invoice_number" className={inputClass()} placeholder="Invoice Number" />
                            <input name="invoice_date" className={inputClass()} type="date" />
                            <textarea
                              name="description"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                              rows={2}
                              defaultValue={`Voucher for Cash Request distribution. Details: ${entry.fields.requester_declaration || '-'}`}
                              required
                            />
                            <div className="md:col-span-2 mt-2">
                              <Button type="submit" className="w-full md:w-auto" disabled={isSavingAction}>Record Distribution & Save Voucher</Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      }
    />
  );
}
