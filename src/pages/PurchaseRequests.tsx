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
import {
  DOCUMENT_OUTPUTS_COLLECTION,
  PURCHASE_REQUEST_WORKFLOW_COLLECTION,
  PurchaseRequestWorkflow,
  getPurchaseRequestStatusLabel,
  normalizePurchaseRequest,
} from '@/lib/requestWorkflows';
import { confirmAction } from '@/lib/confirmAction';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
import { canAccessDeskScopedWorkflowEntry } from '@/lib/staffRecordVisibility';
import { ROLE_LABELS } from '@/types/auth';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

function inputClass(extra = '') {
  return `h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm ${extra}`;
}

function statusBadgeClass(status: PurchaseRequestWorkflow['currentStatus']) {
  switch (status) {
    case 'purchase_done':
      return 'bg-emerald-100 text-emerald-800';
    case 'declined':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-amber-100 text-amber-800';
  }
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

function renderTable(rows: PurchaseRequestWorkflow[], onOpen?: (request: PurchaseRequestWorkflow) => void) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3">Reference</th>
            <th className="px-3 py-3">Requested By</th>
            <th className="px-3 py-3">Role</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Submitted</th>
            <th className="px-3 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-slate-500" colSpan={7}>No purchase requests found.</td>
            </tr>
          ) : (
            rows.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                <td className="px-3 py-3 text-slate-700">{entry.fields.requested_by ?? '-'}</td>
                <td className="px-3 py-3 text-slate-700">{ROLE_LABELS[entry.submittedByRole]}</td>
                <td className="px-3 py-3 text-slate-700">{entry.fields.total_amount ?? '-'}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.currentStatus)}`}>
                    {getPurchaseRequestStatusLabel(entry.currentStatus)}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                <td className="px-3 py-3">
                  {onOpen ? (
                    <Button size="sm" variant="outline" onClick={() => onOpen(entry)}>
                      Open Request
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">View only</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PurchaseRequests() {
  const { user } = useAuth();
  const { sendUserNotification } = useMessages();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestWorkflow[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-requests');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestWorkflow | null>(null);
  const [purchaseReference, setPurchaseReference] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purchaseComment, setPurchaseComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setPurchaseRequests([]);
      setListenerError(null);
      return undefined;
    }

    const requestsQuery = query(collection(db, PURCHASE_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setListenerError(null);
        setPurchaseRequests(snapshot.docs.map((item) => normalizePurchaseRequest({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('purchase-requests', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => unsub();
  }, [user]);

  const canCreate = user?.role === 'assistant_hall_manager' || user?.role === 'store_keeper';
  const isPurchaser = user?.role === 'purchaser';
  const myRequests = useMemo(
    () => purchaseRequests.filter((entry) => canAccessDeskScopedWorkflowEntry(entry, user)),
    [purchaseRequests, user],
  );
  const pendingRequests = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'pending_purchaser'),
    [purchaseRequests],
  );
  const completedRequests = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'purchase_done'),
    [purchaseRequests],
  );

  const handleSubmitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canCreate || isSaving) return;
    if (!confirmAction('Submit this purchase request to purchaser?')) return;
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      const normalized = String(value).trim();
      if (!normalized) continue;
      fields[key] = fields[key] ? `${fields[key]}, ${normalized}` : normalized;
    }

    const requestDoc = doc(collection(db, PURCHASE_REQUEST_WORKFLOW_COLLECTION));
    const submittedAt = new Date().toISOString();
    const reference = `PR-${requestDoc.id.slice(0, 6).toUpperCase()}`;

    const payload = {
      reference,
      submittedAt,
      submittedBy: user.id,
      submittedByRole: user.role,
      fields,
      currentStatus: 'pending_purchaser',
      status: 'pending_purchaser',
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(requestDoc, payload);
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'purchase_request',
        formTitle: 'Purchase Request',
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
        title: 'Purchase request submitted',
        body: `Your purchase request ${reference} has been sent to Purchaser.`,
        relatedId: requestDoc.id,
        relatedType: 'purchase_request',
        link: '/purchase-requests',
      });
      event.currentTarget.reset();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchaseDone = async () => {
    if (!user || user.role !== 'purchaser' || !selectedRequest || isSaving) return;
    if (!purchaseReference.trim()) return;
    if (!confirmAction(`Mark purchase request ${selectedRequest.reference} as purchase done?`)) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, PURCHASE_REQUEST_WORKFLOW_COLLECTION, selectedRequest.id), {
        currentStatus: 'purchase_done',
        status: 'purchase_done',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        reviewComment: purchaseComment.trim() || 'Purchase done by purchaser.',
        purchaseReference: purchaseReference.trim(),
        purchaseSupplier: purchaseSupplier.trim(),
        purchaseDate,
        purchaseComment: purchaseComment.trim() || 'Purchase done by purchaser.',
        purchaseRecordedAt: new Date().toISOString(),
        purchaseRecordedBy: user.id,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, DOCUMENT_OUTPUTS_COLLECTION), {
        formId: 'purchase_request',
        formTitle: 'Purchase Done',
        submittedAt: new Date().toISOString(),
        submittedBy: user.id,
        submittedByRole: user.role,
        fields: {
          reference: selectedRequest.reference,
          purchase_reference: purchaseReference.trim(),
          purchase_supplier: purchaseSupplier.trim(),
          purchase_date: purchaseDate,
          requested_by: selectedRequest.fields.requested_by ?? '',
          total_amount: selectedRequest.fields.total_amount ?? '',
          purchase_comment: purchaseComment.trim() || 'Purchase done by purchaser.',
        },
        updatedAt: serverTimestamp(),
      });
      await sendUserNotification({
        userId: selectedRequest.submittedBy,
        title: 'Purchase completed',
        body: `Your purchase request ${selectedRequest.reference} has been marked as Purchase Done.`,
        relatedId: selectedRequest.id,
        relatedType: 'purchase_request',
        link: '/purchase-requests',
      });
      setSelectedRequest(null);
      setPurchaseReference('');
      setPurchaseSupplier('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setPurchaseComment('');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Purchase Requests"
      subtitle={
        isPurchaser
          ? 'Review submitted purchase requests, capture purchase details, and mark them as Purchase Done.'
          : 'Create purchase requests and track their progress after submission to Purchaser.'
      }
      stats={[
        { title: isPurchaser ? 'Requests Received' : user.role === 'assistant_hall_manager' ? 'Desk Requests' : 'My Requests', value: `${isPurchaser ? pendingRequests.length : myRequests.length}`, description: isPurchaser ? 'awaiting purchaser action' : user.role === 'assistant_hall_manager' ? 'purchase requests visible to assistant hall desk' : 'purchase requests you submitted' },
        { title: 'Purchase Done', value: `${completedRequests.length}`, description: 'completed purchase request records' },
      ]}
      sections={[]}
      action={
        <div className="space-y-6">
          {listenerError ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listenerError}
            </div>
          ) : null}
          {canCreate ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="my-requests">{user.role === 'assistant_hall_manager' ? 'Desk Requests' : 'My Requests'}</TabsTrigger>
                <TabsTrigger value="create">New Purchase Request</TabsTrigger>
              </TabsList>
              <TabsContent value="my-requests">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderTable(myRequests)}
                </div>
              </TabsContent>
              <TabsContent value="create">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <form className="space-y-4" onSubmit={handleSubmitRequest}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="request_date" className={inputClass()} placeholder="Request Date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                      <input name="requested_by" className={inputClass()} placeholder="Requested By" defaultValue={user.name} required />
                      <input name="department" className={inputClass()} placeholder="Department" defaultValue={ROLE_LABELS[user.role]} required />
                      <input name="needed_by" className={inputClass()} placeholder="Needed By Date" type="date" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-5 gap-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                        <p>No</p>
                        <p>Item</p>
                        <p>Qty</p>
                        <p>Estimated Price</p>
                        <p>Amount</p>
                      </div>
                      {[1, 2, 3, 4].map((index) => (
                        <div key={index} className="mt-2 grid grid-cols-5 gap-2">
                          <input name={`row_${index}`} className={inputClass()} defaultValue={String(index)} />
                          <input name={`item_${index}`} className={inputClass()} />
                          <input name={`qty_${index}`} className={inputClass()} />
                          <input name={`estimated_price_${index}`} className={inputClass()} />
                          <input name={`amount_${index}`} className={inputClass()} />
                        </div>
                      ))}
                      <input name="total_amount" className={`${inputClass()} mt-3`} placeholder="Total Amount Requested (TZS)" required />
                      <textarea name="request_notes" className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Purchase notes / reason" required />
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Submit Purchase Request'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          {isPurchaser ? (
            <Tabs defaultValue="requests-received" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="requests-received">Requests Received</TabsTrigger>
                <TabsTrigger value="purchase-done">Purchase Done</TabsTrigger>
              </TabsList>
              <TabsContent value="requests-received">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderTable(pendingRequests, (request) => {
                    setSelectedRequest(request);
                    setPurchaseReference(request.purchaseReference ?? '');
                    setPurchaseSupplier(request.purchaseSupplier ?? '');
                    setPurchaseDate(request.purchaseDate ?? new Date().toISOString().slice(0, 10));
                    setPurchaseComment(request.purchaseComment ?? '');
                  })}
                </div>
              </TabsContent>
              <TabsContent value="purchase-done">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {renderTable(completedRequests)}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Purchase Request Details</DialogTitle>
                <DialogDescription>
                  Review the request, capture purchase details, then mark the request as Purchase Done.
                </DialogDescription>
              </DialogHeader>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{selectedRequest.reference}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(selectedRequest.currentStatus)}`}>
                        {getPurchaseRequestStatusLabel(selectedRequest.currentStatus)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Requested by {selectedRequest.fields.requested_by ?? '-'} | {ROLE_LABELS[selectedRequest.submittedByRole]}
                    </p>
                    <div className="mt-4">
                      {renderFieldsList(selectedRequest.fields)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Purchase Details</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input className={inputClass()} placeholder="Purchase Reference" value={purchaseReference} onChange={(event) => setPurchaseReference(event.target.value)} />
                      <input className={inputClass()} placeholder="Supplier" value={purchaseSupplier} onChange={(event) => setPurchaseSupplier(event.target.value)} />
                      <input className={inputClass()} type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
                      <input className={inputClass()} placeholder="Amount" value={selectedRequest.fields.total_amount ?? ''} readOnly />
                      <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Purchase comment" value={purchaseComment} onChange={(event) => setPurchaseComment(event.target.value)} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => void handlePurchaseDone()} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Mark as Purchase Done'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
