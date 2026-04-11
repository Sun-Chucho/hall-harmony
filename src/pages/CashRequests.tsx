import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { confirmAction } from '@/lib/confirmAction';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
import {
  CASH_REQUEST_WORKFLOW_COLLECTION,
  CashRequestWorkflow,
  DOCUMENT_OUTPUTS_COLLECTION,
  createCashRequestStage,
  getCashRequestStatusLabel,
  normalizeCashRequest,
  parseCurrencyAmount,
} from '@/lib/requestWorkflows';
import { canAccessDeskScopedWorkflowEntry, isManagerCashRequestQueueEntry } from '@/lib/staffRecordVisibility';
import { ROLE_LABELS } from '@/types/auth';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

type DialogMode = 'review' | 'voucher' | null;

interface VoucherFormState {
  voucherNumber: string;
  payeeName: string;
  department: string;
  date: string;
  amount: string;
  description: string;
  posCode: string;
  address: string;
  tin: string;
  invoiceNumber: string;
  invoiceDate: string;
}

function inputClass(extra = '') {
  return `h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm ${extra}`;
}

function statusBadgeClass(status: CashRequestWorkflow['currentStatus']) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'declined':
      return 'bg-rose-100 text-rose-800';
    case 'sent_to_accountant':
      return 'bg-blue-100 text-blue-800';
    case 'pending_halls_manager':
      return 'bg-violet-100 text-violet-800';
    case 'pending_cashier':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-200 text-slate-800';
  }
}

function createVoucherDefaults(request: CashRequestWorkflow): VoucherFormState {
  return {
    voucherNumber: request.paymentVoucherNumber ?? '',
    payeeName: request.fields.full_name ?? '',
    department: request.fields.designation ?? '',
    date: new Date().toISOString().slice(0, 10),
    amount: request.fields.total_requested ?? '',
    description: request.fields.requester_declaration
      ? `Voucher for cash request ${request.reference}. ${request.fields.requester_declaration}`
      : `Voucher for cash request ${request.reference}.`,
    posCode: '',
    address: '',
    tin: '',
    invoiceNumber: '',
    invoiceDate: '',
  };
}

function renderFieldsList(fields: Record<string, string>) {
  const visible = Object.entries(fields).filter(([_, value]) => value && value.trim() !== '');
  if (visible.length === 0) return null;

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {visible.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{key.replace(/_/g, ' ')}:</span> {value}
        </div>
      ))}
    </div>
  );
}

function renderRequestTable(
  rows: CashRequestWorkflow[],
  actionLabel?: string,
  onAction?: (request: CashRequestWorkflow) => void,
) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Reference</th>
            <th className="px-3 py-3">Requester</th>
            <th className="px-3 py-3">Role</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Current Stage</th>
            <th className="px-3 py-3">Submitted</th>
            <th className="px-3 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-slate-500" colSpan={8}>No cash requests found.</td>
            </tr>
          ) : (
            rows.map((entry) => {
              const latestStage = entry.stages[entry.stages.length - 1];
              return (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                  <td className="px-3 py-3 text-slate-700">{entry.fields.full_name ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{ROLE_LABELS[entry.submittedByRole]}</td>
                  <td className="px-3 py-3 text-slate-700">{entry.fields.total_requested ?? '-'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.currentStatus)}`}>
                      {getCashRequestStatusLabel(entry.currentStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{latestStage?.label ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    {onAction && actionLabel ? (
                      <Button size="sm" variant="outline" onClick={() => onAction(entry)}>
                        {actionLabel}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CashRequests() {
  const { user } = useAuth();
  const { sendManagerAlert, sendUserNotification } = useMessages();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-requests');
  const [selectedRequest, setSelectedRequest] = useState<CashRequestWorkflow | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>({
    voucherNumber: '',
    payeeName: '',
    department: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    description: '',
    posCode: '',
    address: '',
    tin: '',
    invoiceNumber: '',
    invoiceDate: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);

  const refreshPageAfterApproval = () => {
    if (typeof window === 'undefined') return;
    setIsRefreshingPage(true);
    window.setTimeout(() => {
      if (window.location.search) {
        window.location.assign(window.location.pathname);
        return;
      }
      window.location.reload();
    }, 450);
  };

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
        reportSnapshotError('cash-requests', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'cashier_1') setActiveTab('approved-requests');
    else if (user.role === 'accountant') setActiveTab('all-requests');
    else if (user.role === 'manager') setActiveTab('manager-queue');
    else setActiveTab('my-requests');
  }, [user]);

  const canCreate = user?.role === 'assistant_hall_manager'
    || user?.role === 'store_keeper'
    || user?.role === 'cashier_1'
    || user?.role === 'accountant';

  const myRequests = useMemo(
    () => cashRequests.filter((entry) => canAccessDeskScopedWorkflowEntry(entry, user)),
    [cashRequests, user],
  );
  const accountantRequests = useMemo(
    () => cashRequests,
    [cashRequests],
  );
  const managerQueue = useMemo(
    () => cashRequests.filter((entry) => isManagerCashRequestQueueEntry(entry)),
    [cashRequests],
  );
  const cashierApprovedRequests = useMemo(
    () => cashRequests.filter((entry) => entry.currentStatus === 'pending_cashier' && entry.submittedBy !== user?.id),
    [cashRequests, user?.id],
  );
  const completedRequests = useMemo(
    () => cashRequests.filter((entry) => entry.currentStatus === 'completed'),
    [cashRequests],
  );

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogMode(null);
    setReviewComment('');
    setVoucherForm({
      voucherNumber: '',
      payeeName: '',
      department: '',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      description: '',
      posCode: '',
      address: '',
      tin: '',
      invoiceNumber: '',
      invoiceDate: '',
    });
  };

  const openReviewDialog = (request: CashRequestWorkflow) => {
    setSelectedRequest(request);
    setDialogMode('review');
    setReviewComment(
      user?.role === 'accountant'
        ? request.accountantComment ?? ''
        : request.hallsManagerComment ?? '',
    );
  };

  const openVoucherDialog = (request: CashRequestWorkflow) => {
    setSelectedRequest(request);
    setDialogMode('voucher');
    setVoucherForm(createVoucherDefaults(request));
  };

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canCreate || isSaving) return;
    if (!confirmAction('Submit this cash request to Accountant?')) return;
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const normalized = String(value).trim();
      if (!normalized) continue;
      fields[key] = fields[key] ? `${fields[key]}, ${normalized}` : normalized;
    }

    const requestDoc = doc(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION));
    const submittedAt = new Date().toISOString();
    const reference = `CR-${requestDoc.id.slice(0, 6).toUpperCase()}`;
    const stages = [
      createCashRequestStage('submitted', user.id, user.role, undefined, submittedAt),
      createCashRequestStage('moved_to_accountant', user.id, user.role, undefined, submittedAt),
    ];

    const payload = {
      reference,
      submittedAt,
      submittedBy: user.id,
      submittedByRole: user.role,
      fields,
      currentStatus: 'pending_accountant',
      status: 'pending_accountant',
      currentAssigneeRole: 'accountant',
      stages,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(requestDoc, payload);
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'cash_request',
        formTitle: 'Cash Request',
        submittedAt,
        submittedBy: user.id,
        submittedByRole: user.role,
        fields: {
          ...fields,
          reference,
        },
        updatedAt: serverTimestamp(),
      });
      await sendUserNotification({
        userId: user.id,
        title: 'Cash request submitted',
        body: `Your cash request ${reference} has been moved to Accountant.`,
        relatedId: requestDoc.id,
        relatedType: 'cash_request',
        link: '/cash-requests',
      });
      event.currentTarget.reset();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountantDecision = async (decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'accountant' || !selectedRequest || isSaving || isRefreshingPage) return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    setIsSaving(true);

    const now = new Date().toISOString();
    const nextStages = decision === 'approve'
      ? [
          ...selectedRequest.stages,
          createCashRequestStage('approved_by_accountant', user.id, user.role, reviewComment.trim() || 'Approved by accountant.', now),
          createCashRequestStage('moved_to_halls_manager', user.id, user.role, undefined, now),
        ]
      : [
          ...selectedRequest.stages,
          createCashRequestStage('declined_accountant', user.id, user.role, reviewComment.trim() || 'Declined by accountant.', now),
        ];

    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, selectedRequest.id), {
        currentStatus: decision === 'approve' ? 'pending_halls_manager' : 'declined',
        status: decision === 'approve' ? 'pending_halls_manager' : 'declined_accountant',
        currentAssigneeRole: decision === 'approve' ? 'manager' : null,
        accountantReviewedAt: now,
        accountantReviewedBy: user.id,
        accountantComment: reviewComment.trim() || (decision === 'approve' ? 'Approved by accountant.' : 'Declined by accountant.'),
        stages: nextStages,
        updatedAt: serverTimestamp(),
      });
      const followUpTasks = [
        sendUserNotification({
          userId: selectedRequest.submittedBy,
          title: decision === 'approve' ? 'Cash request approved by Accountant' : 'Cash request declined by Accountant',
          body: decision === 'approve'
            ? `Your cash request ${selectedRequest.reference} has been approved by Accountant and moved to Halls Manager.`
            : `Your cash request ${selectedRequest.reference} was declined by Accountant.`,
          relatedId: selectedRequest.id,
          relatedType: 'cash_request',
          link: '/cash-requests',
        }),
      ];
      if (decision === 'approve') {
        followUpTasks.push(sendManagerAlert({
          title: 'Cash request awaiting manager review',
          body: `Cash request ${selectedRequest.reference} from ${selectedRequest.fields.full_name ?? 'requester'} has been approved by Accountant and moved to Halls Manager.`,
          link: '/cash-requests',
        }));
      }
      await Promise.allSettled(followUpTasks);
      closeDialog();
      if (decision === 'approve') refreshPageAfterApproval();
    } finally {
      setIsSaving(false);
    }
  };

  const handleManagerDecision = async (decision: 'approve' | 'decline') => {
    if (!user || user.role !== 'manager' || !selectedRequest || isSaving || isRefreshingPage) return;
    if (!reviewComment.trim()) return;
    if (!confirmAction(`Are you sure you want to ${decision} this cash request?`)) return;
    setIsSaving(true);

    const now = new Date().toISOString();
    const nextStages = decision === 'approve'
      ? [
          ...selectedRequest.stages,
          createCashRequestStage('approved_by_halls_manager', user.id, user.role, reviewComment.trim(), now),
          createCashRequestStage('moved_to_cashier', user.id, user.role, undefined, now),
        ]
      : [
          ...selectedRequest.stages,
          createCashRequestStage('declined_halls_manager', user.id, user.role, reviewComment.trim(), now),
        ];

    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, selectedRequest.id), {
        currentStatus: decision === 'approve' ? 'pending_cashier' : 'declined',
        status: decision === 'approve' ? 'pending_cashier' : 'declined_halls_manager',
        currentAssigneeRole: decision === 'approve' ? 'cashier_1' : null,
        hallsManagerReviewedAt: now,
        hallsManagerReviewedBy: user.id,
        hallsManagerComment: reviewComment.trim(),
        stages: nextStages,
        updatedAt: serverTimestamp(),
      });
      await Promise.allSettled([
        sendUserNotification({
          userId: selectedRequest.submittedBy,
          title: decision === 'approve' ? 'Cash request approved by Halls Manager' : 'Cash request declined by Halls Manager',
          body: decision === 'approve'
            ? `Your cash request ${selectedRequest.reference} has been approved by Halls Manager and moved to Cashier.`
            : `Your cash request ${selectedRequest.reference} was declined by Halls Manager.`,
          relatedId: selectedRequest.id,
          relatedType: 'cash_request',
          link: '/cash-requests',
        }),
      ]);
      closeDialog();
      if (decision === 'approve') refreshPageAfterApproval();
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoucherSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.role !== 'cashier_1' || !selectedRequest || isSaving || isRefreshingPage) return;
    if (!confirmAction(`Create payment voucher for ${selectedRequest.reference} and send it to Accountant?`)) return;
    setIsSaving(true);

    const now = new Date().toISOString();
    const voucherNote = voucherForm.voucherNumber.trim()
      ? `Payment voucher ${voucherForm.voucherNumber.trim()}`
      : 'Payment voucher created';

    const nextStages = [
      ...selectedRequest.stages,
      createCashRequestStage('payment_voucher_created', user.id, user.role, voucherNote, now),
      createCashRequestStage('sent_to_accountant', user.id, user.role, voucherNote, now),
      createCashRequestStage('completed', user.id, user.role, 'Payment processed and request completed.', now),
    ];

    try {
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, selectedRequest.id), {
        currentStatus: 'completed',
        status: 'completed',
        currentAssigneeRole: null,
        cashierReviewedAt: now,
        cashierReviewedBy: user.id,
        paymentVoucherNumber: voucherForm.voucherNumber.trim(),
        paymentVoucherCreatedAt: now,
        completedAt: now,
        stages: nextStages,
        updatedAt: serverTimestamp(),
      });
      const voucherDoc = await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'payment_voucher',
        formTitle: 'Payment Voucher',
        submittedAt: now,
        submittedBy: user.id,
        submittedByRole: user.role,
        fields: {
          request_reference: selectedRequest.reference,
          request_number: selectedRequest.id,
          voucher_number: voucherForm.voucherNumber.trim(),
          payee_name: voucherForm.payeeName.trim(),
          department: voucherForm.department.trim(),
          date: voucherForm.date,
          amount: voucherForm.amount.trim(),
          description: voucherForm.description.trim(),
          pos_code: voucherForm.posCode.trim(),
          address: voucherForm.address.trim(),
          tin: voucherForm.tin.trim(),
          invoice_number: voucherForm.invoiceNumber.trim(),
          invoice_date: voucherForm.invoiceDate.trim(),
        },
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, CASH_REQUEST_WORKFLOW_COLLECTION, selectedRequest.id), {
        paymentVoucherId: voucherDoc.id,
        updatedAt: serverTimestamp(),
      });
      await sendUserNotification({
        userId: selectedRequest.submittedBy,
        title: 'Payment processed',
        body: `Your cash request ${selectedRequest.reference} has been processed. Payment voucher ${voucherForm.voucherNumber.trim() || 'created'} was sent to Accountant.`,
        relatedId: selectedRequest.id,
        relatedType: 'payment_voucher',
        link: '/cash-requests',
      });
      closeDialog();
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Cash Requests"
      subtitle="Track cash requests through Accountant, Halls Manager, Cashier, and payment voucher completion."
      stats={[
        { title: user.role === 'assistant_hall_manager' ? 'Desk Requests' : 'My Requests', value: `${myRequests.length}`, description: user.role === 'assistant_hall_manager' ? 'cash requests visible to assistant hall desk' : 'cash requests you submitted' },
        { title: 'Pending Action', value: `${cashRequests.filter((entry) => entry.currentStatus !== 'completed' && entry.currentStatus !== 'declined').length}`, description: 'requests still moving in workflow' },
        { title: 'Completed', value: `${completedRequests.length}`, description: 'disbursed and closed requests' },
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="approved-requests">Approved Requests</TabsTrigger>
                <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                <TabsTrigger value="create">New Request</TabsTrigger>
                <TabsTrigger value="cash-disbursements">Cash Disbursements</TabsTrigger>
              </TabsList>
              <TabsContent value="approved-requests">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderRequestTable(cashierApprovedRequests, 'Open Payment Voucher', openVoucherDialog)}
                </div>
              </TabsContent>
              <TabsContent value="my-requests">
                <div className="space-y-4">
                  {myRequests.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{entry.reference}</p>
                          <p className="text-sm text-slate-600">Submitted {new Date(entry.submittedAt).toLocaleString()}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.currentStatus)}`}>
                          {getCashRequestStatusLabel(entry.currentStatus)}
                        </span>
                      </div>
                      <div className="mt-4">{renderFieldsList(entry.fields)}</div>
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {entry.stages.map((stage) => (
                          <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{stage.label}</p>
                            <p>{new Date(stage.at).toLocaleString()}</p>
                            {stage.note ? <p className="mt-1 text-xs text-slate-500">{stage.note}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {myRequests.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                      You have not submitted any cash requests yet.
                    </div>
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="create">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <form className="space-y-4" onSubmit={handleCreateRequest}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="pef_no" className={inputClass()} placeholder="PEF No" required />
                      <input name="date" className={inputClass()} defaultValue={new Date().toISOString().slice(0, 10)} required />
                      <input name="full_name" className={inputClass()} placeholder="Full Name" defaultValue={user.name} required />
                      <input name="designation" className={inputClass()} placeholder="Designation" defaultValue={ROLE_LABELS[user.role]} required />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                        <p>No</p>
                        <p>Item</p>
                        <p>Qty</p>
                        <p>Price</p>
                        <p>Amount</p>
                      </div>
                      {[1, 2, 3, 4].map((index) => (
                        <div key={index} className="mt-2 grid grid-cols-5 gap-2">
                          <input name={`row_${index}`} className={inputClass()} defaultValue={String(index)} />
                          <input name={`item_${index}`} className={inputClass()} />
                          <input name={`qty_${index}`} className={inputClass()} />
                          <input name={`price_${index}`} className={inputClass()} />
                          <input name={`amount_${index}`} className={inputClass()} />
                        </div>
                      ))}
                      <input name="total_requested" className={`${inputClass()} mt-3`} placeholder="Total Amount Requested (TZS)" required />
                      <textarea name="amount_words" className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Amount in Words" required />
                      <textarea name="requester_declaration" className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Requester Declaration / Reason" required />
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Submit Cash Request'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="cash-disbursements">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderRequestTable(completedRequests)}
                </div>
              </TabsContent>
            </Tabs>
          ) : user.role === 'accountant' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all-requests">All Requests</TabsTrigger>
                <TabsTrigger value="create">New Request</TabsTrigger>
              </TabsList>
              <TabsContent value="all-requests">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderRequestTable(accountantRequests, 'Open Request', openReviewDialog)}
                </div>
              </TabsContent>
              <TabsContent value="create">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <form className="space-y-4" onSubmit={handleCreateRequest}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="pef_no" className={inputClass()} placeholder="PEF No" required />
                      <input name="date" className={inputClass()} defaultValue={new Date().toISOString().slice(0, 10)} required />
                      <input name="full_name" className={inputClass()} placeholder="Full Name" defaultValue={user.name} required />
                      <input name="designation" className={inputClass()} placeholder="Designation" defaultValue={ROLE_LABELS[user.role]} required />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                        <p>No</p>
                        <p>Item</p>
                        <p>Qty</p>
                        <p>Price</p>
                        <p>Amount</p>
                      </div>
                      {[1, 2, 3, 4].map((index) => (
                        <div key={index} className="mt-2 grid grid-cols-5 gap-2">
                          <input name={`row_${index}`} className={inputClass()} defaultValue={String(index)} />
                          <input name={`item_${index}`} className={inputClass()} />
                          <input name={`qty_${index}`} className={inputClass()} />
                          <input name={`price_${index}`} className={inputClass()} />
                          <input name={`amount_${index}`} className={inputClass()} />
                        </div>
                      ))}
                      <input name="total_requested" className={`${inputClass()} mt-3`} placeholder="Total Amount Requested (TZS)" required />
                      <textarea name="amount_words" className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Amount in Words" required />
                      <textarea name="requester_declaration" className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Requester Declaration / Reason" required />
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Submit Cash Request'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          ) : user.role === 'manager' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              {renderRequestTable(managerQueue, 'Open Request', openReviewDialog)}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="my-requests">{user.role === 'assistant_hall_manager' ? 'Desk Requests' : 'My Requests'}</TabsTrigger>
                {canCreate ? <TabsTrigger value="create">New Request</TabsTrigger> : null}
              </TabsList>
              <TabsContent value="my-requests">
                <div className="space-y-4">
                  {myRequests.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{entry.reference}</p>
                          <p className="text-sm text-slate-600">Submitted {new Date(entry.submittedAt).toLocaleString()}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.currentStatus)}`}>
                          {getCashRequestStatusLabel(entry.currentStatus)}
                        </span>
                      </div>
                      <div className="mt-4">{renderFieldsList(entry.fields)}</div>
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {entry.stages.map((stage) => (
                          <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{stage.label}</p>
                            <p>{new Date(stage.at).toLocaleString()}</p>
                            {stage.note ? <p className="mt-1 text-xs text-slate-500">{stage.note}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {myRequests.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                      {user.role === 'assistant_hall_manager'
                        ? 'No cash requests are visible to the assistant hall desk yet.'
                        : 'You have not submitted any cash requests yet.'}
                    </div>
                  ) : null}
                </div>
              </TabsContent>
              {canCreate ? (
                <TabsContent value="create">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form className="space-y-4" onSubmit={handleCreateRequest}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input name="pef_no" className={inputClass()} placeholder="PEF No" required />
                        <input name="date" className={inputClass()} defaultValue={new Date().toISOString().slice(0, 10)} required />
                        <input name="full_name" className={inputClass()} placeholder="Full Name" defaultValue={user.name} required />
                        <input name="designation" className={inputClass()} placeholder="Designation" defaultValue={ROLE_LABELS[user.role]} required />
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                          <p>No</p>
                          <p>Item</p>
                          <p>Qty</p>
                          <p>Price</p>
                          <p>Amount</p>
                        </div>
                        {[1, 2, 3, 4].map((index) => (
                          <div key={index} className="mt-2 grid grid-cols-5 gap-2">
                            <input name={`row_${index}`} className={inputClass()} defaultValue={String(index)} />
                            <input name={`item_${index}`} className={inputClass()} />
                            <input name={`qty_${index}`} className={inputClass()} />
                            <input name={`price_${index}`} className={inputClass()} />
                            <input name={`amount_${index}`} className={inputClass()} />
                          </div>
                        ))}
                        <input name="total_requested" className={`${inputClass()} mt-3`} placeholder="Total Amount Requested (TZS)" required />
                        <textarea name="amount_words" className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Amount in Words" required />
                        <textarea name="requester_declaration" className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Requester Declaration / Reason" required />
                      </div>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Submit Cash Request'}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              ) : null}
            </Tabs>
          )}

          <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>{dialogMode === 'voucher' ? 'Payment Voucher' : 'Cash Request Details'}</DialogTitle>
                <DialogDescription>
                  {dialogMode === 'voucher'
                    ? 'This voucher is opened for a Halls Manager-approved request and will be sent to Accountant when you submit it.'
                    : 'Review the request details and complete the next approval action.'}
                </DialogDescription>
              </DialogHeader>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{selectedRequest.reference}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(selectedRequest.currentStatus)}`}>
                        {getCashRequestStatusLabel(selectedRequest.currentStatus)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedRequest.fields.full_name ?? '-'} | {ROLE_LABELS[selectedRequest.submittedByRole]} | Requested TZS {parseCurrencyAmount(selectedRequest.fields.total_requested).toLocaleString()}
                    </p>
                    <div className="mt-4">{renderFieldsList(selectedRequest.fields)}</div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {selectedRequest.stages.map((stage) => (
                        <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{stage.label}</p>
                          <p>{new Date(stage.at).toLocaleString()}</p>
                          {stage.note ? <p className="mt-1 text-xs text-slate-500">{stage.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {dialogMode === 'review' && user.role === 'accountant' ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <textarea className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Accountant comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => void handleAccountantDecision('approve')} disabled={isSaving || isRefreshingPage}>
                          {isRefreshingPage ? 'Refreshing...' : isSaving ? 'Saving...' : 'Approve & Move to Halls Manager'}
                        </Button>
                        <Button variant="outline" onClick={() => void handleAccountantDecision('decline')} disabled={isSaving || isRefreshingPage}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {dialogMode === 'review' && user.role === 'manager' ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <textarea className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Halls Manager comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => void handleManagerDecision('approve')} disabled={isSaving || isRefreshingPage || !reviewComment.trim()}>
                          {isRefreshingPage ? 'Refreshing...' : isSaving ? 'Saving...' : 'Approve & Move to Cashier'}
                        </Button>
                        <Button variant="outline" onClick={() => void handleManagerDecision('decline')} disabled={isSaving || isRefreshingPage || !reviewComment.trim()}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {dialogMode === 'voucher' && user.role === 'cashier_1' ? (
                    <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={(event) => void handleVoucherSubmit(event)}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className={inputClass()} placeholder="Voucher Number" value={voucherForm.voucherNumber} onChange={(event) => setVoucherForm((prev) => ({ ...prev, voucherNumber: event.target.value }))} required />
                        <input className={inputClass()} placeholder="Payee Name" value={voucherForm.payeeName} onChange={(event) => setVoucherForm((prev) => ({ ...prev, payeeName: event.target.value }))} required />
                        <input className={inputClass()} placeholder="Department" value={voucherForm.department} onChange={(event) => setVoucherForm((prev) => ({ ...prev, department: event.target.value }))} />
                        <input className={inputClass()} type="date" value={voucherForm.date} onChange={(event) => setVoucherForm((prev) => ({ ...prev, date: event.target.value }))} required />
                        <input className={inputClass()} placeholder="Amount" value={voucherForm.amount} onChange={(event) => setVoucherForm((prev) => ({ ...prev, amount: event.target.value }))} required />
                        <input className={inputClass()} placeholder="POS Code" value={voucherForm.posCode} onChange={(event) => setVoucherForm((prev) => ({ ...prev, posCode: event.target.value }))} />
                        <input className={inputClass()} placeholder="Address" value={voucherForm.address} onChange={(event) => setVoucherForm((prev) => ({ ...prev, address: event.target.value }))} />
                        <input className={inputClass()} placeholder="TIN" value={voucherForm.tin} onChange={(event) => setVoucherForm((prev) => ({ ...prev, tin: event.target.value }))} />
                        <input className={inputClass()} placeholder="Invoice Number" value={voucherForm.invoiceNumber} onChange={(event) => setVoucherForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))} />
                        <input className={inputClass()} type="date" value={voucherForm.invoiceDate} onChange={(event) => setVoucherForm((prev) => ({ ...prev, invoiceDate: event.target.value }))} />
                        <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Description" value={voucherForm.description} onChange={(event) => setVoucherForm((prev) => ({ ...prev, description: event.target.value }))} required />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="submit" disabled={isSaving || isRefreshingPage}>
                          {isRefreshingPage ? 'Refreshing...' : isSaving ? 'Saving...' : 'Send Voucher to Accountant'}
                        </Button>
                        <Button type="button" variant="outline" onClick={closeDialog}>
                          Close
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
