import { useEffect, useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
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
  normalizeDocumentOutput,
  normalizePurchaseRequest,
} from '@/lib/requestWorkflows';
import { canAccessDeskScopedBooking, canAccessDeskScopedWorkflowEntry } from '@/lib/staffRecordVisibility';
import { BookingRecord } from '@/types/booking';
import { ROLE_LABELS, UserRole } from '@/types/auth';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

type BookingReportWindow = 'daily' | 'weekly' | 'monthly';

const BOOKING_REPORT_ROLES: UserRole[] = ['manager', 'assistant_hall_manager', 'cashier_1', 'accountant'];

function tableWrap(children: React.ReactNode) {
  return <div className="overflow-x-auto">{children}</div>;
}

function emptyState(text: string) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{text}</div>;
}

function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const dayIndex = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayIndex);
  return start;
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function matchesBookingWindow(value: string, anchorDate: string, window: BookingReportWindow) {
  const bookingDate = parseDateInput(value);
  const anchor = parseDateInput(anchorDate);
  if (!bookingDate || !anchor) return false;

  switch (window) {
    case 'daily':
      return bookingDate.toDateString() === anchor.toDateString();
    case 'weekly': {
      const weekStart = getStartOfWeek(anchor);
      const weekEnd = getEndOfWeek(anchor);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }
    case 'monthly':
      return bookingDate.getFullYear() === anchor.getFullYear() && bookingDate.getMonth() === anchor.getMonth();
  }
}

function formatBookingWindowLabel(anchorDate: string, window: BookingReportWindow) {
  const anchor = parseDateInput(anchorDate);
  if (!anchor) return 'selected period';

  switch (window) {
    case 'daily':
      return anchor.toLocaleDateString();
    case 'weekly': {
      const start = getStartOfWeek(anchor);
      const end = getEndOfWeek(anchor);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    case 'monthly':
      return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
}

function bookingStatusLabel(status: BookingRecord['bookingStatus']) {
  return status.replace(/_/g, ' ');
}

interface BookingReportPanelProps {
  bookings: BookingRecord[];
  bookingWindow: BookingReportWindow;
  anchorDate: string;
  onBookingWindowChange: (value: BookingReportWindow) => void;
  onAnchorDateChange: (value: string) => void;
  exportFilename: string;
}

function BookingReportPanel({
  bookings,
  bookingWindow,
  anchorDate,
  onBookingWindowChange,
  onAnchorDateChange,
  exportFilename,
}: BookingReportPanelProps) {
  const rangeLabel = formatBookingWindowLabel(anchorDate, bookingWindow);
  const approvedCount = bookings.filter((entry) => entry.bookingStatus === 'approved').length;
  const pendingCount = bookings.filter((entry) => entry.bookingStatus === 'pending').length;
  const totalQuotedAmount = bookings.reduce((sum, entry) => sum + entry.quotedAmount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking Reports</p>
            <p className="mt-1 text-sm text-slate-600">
              Filter bookings by event date for {rangeLabel}.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[160px_180px_auto]">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={bookingWindow}
              onChange={(event) => onBookingWindowChange(event.target.value as BookingReportWindow)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input
              type="date"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={anchorDate}
              onChange={(event) => onAnchorDateChange(event.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCsv(exportFilename, [
                ['Booking ID', 'Event Date', 'Event Name', 'Hall', 'Customer', 'Status', 'Quoted Amount', 'Created At'],
                ...bookings.map((entry) => [
                  entry.id,
                  entry.date,
                  entry.eventName,
                  entry.hall,
                  entry.customerName,
                  bookingStatusLabel(entry.bookingStatus),
                  entry.quotedAmount,
                  entry.createdAt,
                ]),
              ])}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bookings</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{bookings.length}</p>
          <p className="text-xs text-slate-600">matching the selected date range</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{approvedCount}</p>
          <p className="text-xs text-slate-600">approved booking records</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</p>
          <p className="text-xs text-slate-600">awaiting decision</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quoted Value</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">TZS {totalQuotedAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-600">quoted amount in this range</p>
        </div>
      </div>

      {bookings.length === 0 ? emptyState(`No bookings found for ${rangeLabel}.`) : tableWrap(
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3">Booking ID</th>
              <th className="px-3 py-3">Event Date</th>
              <th className="px-3 py-3">Event</th>
              <th className="px-3 py-3">Hall</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Quoted Amount</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold text-slate-900">{entry.id}</td>
                <td className="px-3 py-3 text-slate-700">{entry.date}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">{entry.eventName}</td>
                <td className="px-3 py-3 text-slate-700">{entry.hall}</td>
                <td className="px-3 py-3 text-slate-700">{entry.customerName}</td>
                <td className="px-3 py-3 text-slate-700">{bookingStatusLabel(entry.bookingStatus)}</td>
                <td className="px-3 py-3 text-slate-700">TZS {entry.quotedAmount.toLocaleString()}</td>
                <td className="px-3 py-3 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>,
      )}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestWorkflow[]>([]);
  const [outputs, setOutputs] = useState<DocumentOutput[]>([]);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [bookingWindow, setBookingWindow] = useState<BookingReportWindow>('daily');
  const [bookingAnchorDate, setBookingAnchorDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!user) {
      setCashRequests([]);
      setPurchaseRequests([]);
      setOutputs([]);
      setListenerError(null);
      return undefined;
    }

    const cashUnsub = onSnapshot(
      query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        setListenerError(null);
        setCashRequests(snapshot.docs.map((item) => normalizeCashRequest({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('reports-cash-requests', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );
    const purchaseUnsub = onSnapshot(
      query(collection(db, PURCHASE_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        setListenerError(null);
        setPurchaseRequests(snapshot.docs.map((item) => normalizePurchaseRequest({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('reports-purchase-requests', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );
    const outputUnsub = onSnapshot(
      query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        setListenerError(null);
        setOutputs(snapshot.docs.map((item) => normalizeDocumentOutput({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('reports-document-outputs', error);
        setListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => {
      cashUnsub();
      purchaseUnsub();
      outputUnsub();
    };
  }, [user]);

  const myBookings = useMemo(
    () => bookings.filter((entry) => canAccessDeskScopedBooking(entry, user)),
    [bookings, user],
  );
  const myCashRequests = useMemo(
    () => cashRequests.filter((entry) => canAccessDeskScopedWorkflowEntry(entry, user)),
    [cashRequests, user],
  );
  const myPurchaseRequests = useMemo(
    () => purchaseRequests.filter((entry) => canAccessDeskScopedWorkflowEntry(entry, user)),
    [purchaseRequests, user],
  );
  const myDocuments = useMemo(
    () => outputs.filter((entry) => canAccessDeskScopedWorkflowEntry(entry, user)),
    [outputs, user],
  );
  const purchaserPending = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'pending_purchaser'),
    [purchaseRequests],
  );
  const purchaserDone = useMemo(
    () => purchaseRequests.filter((entry) => entry.currentStatus === 'purchase_done'),
    [purchaseRequests],
  );
  const canViewBookingReports = Boolean(user && BOOKING_REPORT_ROLES.includes(user.role));
  const bookingReportSource = useMemo(() => {
    if (!user || !canViewBookingReports) return [];
    return user.role === 'assistant_hall_manager' ? myBookings : bookings;
  }, [bookings, canViewBookingReports, myBookings, user]);
  const filteredBookingReports = useMemo(
    () => bookingReportSource.filter((entry) => matchesBookingWindow(entry.date, bookingAnchorDate, bookingWindow)),
    [bookingAnchorDate, bookingReportSource, bookingWindow],
  );

  if (!user) return null;

  const stats = user.role === 'purchaser'
    ? [
        { title: 'Requests Received', value: `${purchaserPending.length}`, description: 'purchase requests waiting for purchaser' },
        { title: 'Purchase Done', value: `${purchaserDone.length}`, description: 'completed purchase records' },
        { title: 'My Purchase Requests', value: `${myPurchaseRequests.length}`, description: 'records tied to your account' },
        { title: 'Saved Outputs', value: `${myDocuments.length}`, description: 'document outputs you saved' },
      ]
    : canViewBookingReports
      ? [
          { title: 'Bookings in View', value: `${filteredBookingReports.length}`, description: `${bookingWindow} booking records` },
          { title: user.role === 'assistant_hall_manager' ? 'Desk Cash Requests' : 'My Cash Requests', value: `${myCashRequests.length}`, description: user.role === 'assistant_hall_manager' ? 'cash request records tied to assistant hall desk' : 'cash request records tied to your account' },
          { title: user.role === 'assistant_hall_manager' ? 'Desk Purchase Requests' : 'My Purchase Requests', value: `${myPurchaseRequests.length}`, description: user.role === 'assistant_hall_manager' ? 'purchase requests tied to assistant hall desk' : 'purchase requests tied to your account' },
          { title: user.role === 'assistant_hall_manager' ? 'Desk Outputs' : 'Saved Outputs', value: `${myDocuments.length}`, description: user.role === 'assistant_hall_manager' ? 'document outputs visible to assistant hall desk' : 'document outputs you saved' },
        ]
      : [
          { title: 'My Cash Requests', value: `${myCashRequests.length}`, description: 'cash request records tied to your account' },
          { title: 'My Purchase Requests', value: `${myPurchaseRequests.length}`, description: 'purchase requests tied to your account' },
          { title: 'Saved Outputs', value: `${myDocuments.length}`, description: 'document outputs you saved' },
        ];

  const bookingReportPanel = canViewBookingReports ? (
    <BookingReportPanel
      bookings={filteredBookingReports}
      bookingWindow={bookingWindow}
      anchorDate={bookingAnchorDate}
      onBookingWindowChange={setBookingWindow}
      onAnchorDateChange={setBookingAnchorDate}
      exportFilename={`${user.role}-booking-reports.csv`}
    />
  ) : null;

  return (
    <ManagementPageTemplate
      pageTitle="Reports"
      subtitle={
        user.role === 'assistant_hall_manager'
          ? 'Assistant Halls Manager reports include bookings, cash requests, and purchase requests.'
          : user.role === 'purchaser'
            ? 'Purchaser reports focus on requests received and completed purchase records.'
            : canViewBookingReports
              ? 'Role-based report tables with booking filters and saved workflow records.'
              : 'Role-based report tables for your submitted requests and saved outputs.'
      }
      stats={stats}
      sections={[]}
      action={
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {listenerError ? (
            <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listenerError}
            </div>
          ) : null}
          {user.role === 'assistant_hall_manager' ? (
            <Tabs defaultValue="halls-bookings" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="halls-bookings">Booking Reports</TabsTrigger>
                <TabsTrigger value="cash-requests">Cash Requests</TabsTrigger>
                <TabsTrigger value="purchase-requests">Purchase Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="halls-bookings">
                {bookingReportPanel}
              </TabsContent>
              <TabsContent value="cash-requests">
                {myCashRequests.length === 0 ? emptyState('No cash requests visible to the assistant hall desk yet.') : (
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
                {myPurchaseRequests.length === 0 ? emptyState('No purchase requests visible to the assistant hall desk yet.') : (
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
            <Tabs defaultValue={canViewBookingReports ? 'booking-reports' : 'cash-requests'} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                {canViewBookingReports ? <TabsTrigger value="booking-reports">Booking Reports</TabsTrigger> : null}
                <TabsTrigger value="cash-requests">Cash Requests</TabsTrigger>
                <TabsTrigger value="purchase-requests">Purchase Requests</TabsTrigger>
                <TabsTrigger value="my-documents">My Documents</TabsTrigger>
              </TabsList>
              {canViewBookingReports ? (
                <TabsContent value="booking-reports">
                  {bookingReportPanel}
                </TabsContent>
              ) : null}
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
                  <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Form</th>
                        <th className="px-3 py-3">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myDocuments.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 text-slate-700">{new Date(entry.submittedAt).toLocaleString()}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.reference ?? '-'}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{entry.formTitle}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {Object.entries(entry.fields)
                              .filter(([key]) => !['reference_number', 'reference', 'request_reference', 'request_number'].includes(key))
                              .slice(0, 3)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(' | ') || '-'}
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
