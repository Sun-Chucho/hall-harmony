import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import {
  CASH_REQUEST_WORKFLOW_COLLECTION,
  DOCUMENT_OUTPUTS_COLLECTION,
  DocumentOutput,
  PURCHASE_REQUEST_WORKFLOW_COLLECTION,
  PurchaseRequestWorkflow,
  CashRequestWorkflow,
  downloadCsv,
  getCashRequestStatusLabel,
  getPurchaseRequestStatusLabel,
  normalizeCashRequest,
  normalizePurchaseRequest,
} from '@/lib/requestWorkflows';
import { ROLE_LABELS } from '@/types/auth';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

function tableWrap(children: React.ReactNode) {
  return <div className="overflow-x-auto">{children}</div>;
}

function emptyState(text: string) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{text}</div>;
}

export default function Reports() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestWorkflow[]>([]);
  const [outputs, setOutputs] = useState<DocumentOutput[]>([]);

  useEffect(() => {
    if (!user) {
      setCashRequests([]);
      setPurchaseRequests([]);
      setOutputs([]);
      return undefined;
    }

    const cashUnsub = onSnapshot(
      query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => setCashRequests(snapshot.docs.map((item) => normalizeCashRequest({ id: item.id, ...item.data() }))),
      () => setCashRequests([]),
    );
    const purchaseUnsub = onSnapshot(
      query(collection(db, PURCHASE_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => setPurchaseRequests(snapshot.docs.map((item) => normalizePurchaseRequest({ id: item.id, ...item.data() }))),
      () => setPurchaseRequests([]),
    );
    const outputUnsub = onSnapshot(
      query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => setOutputs(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<DocumentOutput, 'id'>) }))),
      () => setOutputs([]),
    );

    return () => {
      cashUnsub();
      purchaseUnsub();
      outputUnsub();
    };
  }, [user]);

  const myBookings = useMemo(
    () => bookings.filter((entry) => entry.createdByUserId === user?.id),
    [bookings, user?.id],
  );
  const myCashRequests = useMemo(
    () => cashRequests.filter((entry) => entry.submittedBy === user?.id),
    [cashRequests, user?.id],
  );
  const myPurchaseRequests = useMemo(
    () => purchaseRequests.filter((entry) => entry.submittedBy === user?.id),
    [purchaseRequests, user?.id],
  );
  const myDocuments = useMemo(
    () => outputs.filter((entry) => entry.submittedBy === user?.id),
    [outputs, user?.id],
  );
  const purchaserPending = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'pending_purchaser'),
    [purchaseRequests],
  );
  const purchaserDone = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'purchase_done'),
    [purchaseRequests],
  );

  if (!user) return null;

  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle={
        user.role === 'assistant_hall_manager'
          ? 'Assistant Halls Manager reports are limited to Halls Bookings, your own Cash Requests, and your Purchase Requests.'
          : user.role === 'purchaser'
            ? 'Purchaser reports focus on requests received and completed purchase records.'
            : 'Role-based report tables for your submitted requests and saved outputs.'
      }
      stats={[
        { title: 'My Cash Requests', value: `${myCashRequests.length}`, description: 'cash request records tied to your account' },
        { title: 'My Purchase Requests', value: `${myPurchaseRequests.length}`, description: 'purchase requests tied to your account' },
        { title: 'Saved Outputs', value: `${myDocuments.length}`, description: 'document outputs you saved' },
      ]}
      sections={[]}
      action={
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {user.role === 'assistant_hall_manager' ? (
            <Tabs defaultValue="halls-bookings" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="halls-bookings">Halls Bookings</TabsTrigger>
                <TabsTrigger value="cash-requests">Cash Requests</TabsTrigger>
                <TabsTrigger value="purchase-requests">Purchase Request</TabsTrigger>
              </TabsList>
              <TabsContent value="halls-bookings">
                {myBookings.length === 0 ? emptyState('No halls bookings submitted by you yet.') : tableWrap(
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Event</th>
                        <th className="px-3 py-3">Hall</th>
                        <th className="px-3 py-3">Customer</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 text-slate-700">{entry.date}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.eventName}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.hall}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.customerName}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.bookingStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
              <TabsContent value="cash-requests">
                {myCashRequests.length === 0 ? emptyState('No cash requests submitted by you yet.') : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => downloadCsv('assistant-cash-requests.csv', [
                        ['Reference', 'Submitted At', 'Amount', 'Status'],
                        ...myCashRequests.map((entry) => [entry.reference, entry.submittedAt, entry.fields.total_requested ?? '', getCashRequestStatusLabel(entry.currentStatus)]),
                      ])}>
                        Export CSV
                      </Button>
                    </div>
                    {tableWrap(
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-3">Reference</th>
                            <th className="px-3 py-3">Submitted</th>
                            <th className="px-3 py-3">Amount</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3">Latest Stage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myCashRequests.map((entry) => (
                            <tr key={entry.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                              <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                              <td className="px-3 py-3 text-slate-700">{entry.fields.total_requested ?? '-'}</td>
                              <td className="px-3 py-3 text-slate-700">{getCashRequestStatusLabel(entry.currentStatus)}</td>
                              <td className="px-3 py-3 text-slate-700">{entry.stages[entry.stages.length - 1]?.label ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>,
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="purchase-requests">
                {myPurchaseRequests.length === 0 ? emptyState('No purchase requests submitted by you yet.') : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => downloadCsv('assistant-purchase-requests.csv', [
                        ['Reference', 'Submitted At', 'Amount', 'Status'],
                        ...myPurchaseRequests.map((entry) => [entry.reference, entry.submittedAt, entry.fields.total_amount ?? '', getPurchaseRequestStatusLabel(entry.currentStatus)]),
                      ])}>
                        Export CSV
                      </Button>
                    </div>
                    {tableWrap(
                      <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-3">Reference</th>
                            <th className="px-3 py-3">Submitted</th>
                            <th className="px-3 py-3">Amount</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3">Purchase Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myPurchaseRequests.map((entry) => (
                            <tr key={entry.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                              <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                              <td className="px-3 py-3 text-slate-700">{entry.fields.total_amount ?? '-'}</td>
                              <td className="px-3 py-3 text-slate-700">{getPurchaseRequestStatusLabel(entry.currentStatus)}</td>
                              <td className="px-3 py-3 text-slate-700">{entry.purchaseReference ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>,
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : user.role === 'purchaser' ? (
            <Tabs defaultValue="requests-received" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="requests-received">Requests Received</TabsTrigger>
                <TabsTrigger value="purchase-done">Purchase Done</TabsTrigger>
              </TabsList>
              <TabsContent value="requests-received">
                {purchaserPending.length === 0 ? emptyState('No purchase requests waiting for purchaser.') : tableWrap(
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Requested By</th>
                        <th className="px-3 py-3">Role</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaserPending.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.fields.requested_by ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{ROLE_LABELS[entry.submittedByRole]}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.fields.total_amount ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
              <TabsContent value="purchase-done">
                {purchaserDone.length === 0 ? emptyState('No purchase done records yet.') : tableWrap(
                  <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Requested By</th>
                        <th className="px-3 py-3">Purchase Ref</th>
                        <th className="px-3 py-3">Supplier</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaserDone.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.fields.requested_by ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.purchaseReference ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.purchaseSupplier ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.purchaseDate ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.purchaseComment ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="cash-requests" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="cash-requests">Cash Requests</TabsTrigger>
                <TabsTrigger value="purchase-requests">Purchase Requests</TabsTrigger>
                <TabsTrigger value="my-documents">My Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="cash-requests">
                {myCashRequests.length === 0 ? emptyState('No cash request records tied to your account yet.') : tableWrap(
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCashRequests.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.fields.total_requested ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{getCashRequestStatusLabel(entry.currentStatus)}</td>
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
              <TabsContent value="purchase-requests">
                {myPurchaseRequests.length === 0 ? emptyState('No purchase request records tied to your account yet.') : tableWrap(
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPurchaseRequests.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference}</td>
                          <td className="px-3 py-3 text-slate-700">{entry.fields.total_amount ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700">{getPurchaseRequestStatusLabel(entry.currentStatus)}</td>
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
              <TabsContent value="my-documents">
                {myDocuments.length === 0 ? emptyState('No saved document outputs tied to your account yet.') : tableWrap(
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Form</th>
                        <th className="px-3 py-3">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myDocuments.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.formTitle}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {Object.entries(entry.fields).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(' | ') || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>,
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      }
    />
  );
}
