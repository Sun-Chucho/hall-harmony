import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { useInventory } from '@/contexts/InventoryContext';
import { usePayments } from '@/contexts/PaymentContext';
import { db } from '@/lib/firebase';
import { LIVE_SYNC_WARNING, reportSnapshotError } from '@/lib/firestoreListeners';
import {
  CASH_REQUEST_WORKFLOW_COLLECTION,
  CashRequestWorkflow,
  DOCUMENT_OUTPUTS_COLLECTION,
  DocumentOutput,
  getCashRequestStatusLabel,
  normalizeCashRequest,
  normalizeDocumentOutput,
  parseCurrencyAmount,
} from '@/lib/requestWorkflows';
import { ROLE_LABELS } from '@/types/auth';
import { Banknote, Calendar, FileText, Package, ReceiptText, ShieldCheck, Users } from 'lucide-react';

export type ManagingDirectorDashboardSection =
  | 'overview'
  | 'stock-overview'
  | 'halls-payment-booking'
  | 'cash-requests-vouchers';

interface ManagingDirectorDashboardProps {
  section?: ManagingDirectorDashboardSection;
}

type MdAuditItem = {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  detail: string;
};

const SECTION_COPY: Record<ManagingDirectorDashboardSection, { title: string; description: string; layoutTitle: string }> = {
  overview: {
    title: 'Managing Director Overview',
    description: 'Executive finance visibility and full cross-module audit feed.',
    layoutTitle: 'Managing Director Dashboard',
  },
  'stock-overview': {
    title: 'Stock Overview',
    description: 'Read-only inventory position with stock levels, allocations, and latest movements.',
    layoutTitle: 'MD Stock Overview',
  },
  'halls-payment-booking': {
    title: 'Halls Payment and Booking',
    description: 'Read-only booking register showing every hall booking and payment position.',
    layoutTitle: 'MD Halls Payment and Booking',
  },
  'cash-requests-vouchers': {
    title: 'Cash Requests and Vouchers',
    description: 'Read-only cash request workflow and payment voucher register.',
    layoutTitle: 'MD Cash Requests and Vouchers',
  },
};

function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function humanize(value?: string): string {
  return value ? value.replace(/_/g, ' ') : '-';
}

function bookingStatusClass(status: string) {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-200 text-slate-800';
  }
}

function paymentStatusClass(status: string) {
  switch (status) {
    case 'fully_paid':
      return 'bg-emerald-100 text-emerald-800';
    case 'deposit_paid':
    case 'partially_paid':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-slate-200 text-slate-800';
  }
}

function cashRequestStatusClass(status: CashRequestWorkflow['currentStatus']) {
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

function stockStatus(item: { currentQuantity: number; reorderLevel: number }) {
  if (item.currentQuantity <= 0) return 'Out of stock';
  if (item.currentQuantity <= item.reorderLevel) return 'Low stock';
  return 'In stock';
}

function stockStatusClass(status: string) {
  switch (status) {
    case 'Out of stock':
      return 'bg-rose-100 text-rose-800';
    case 'Low stock':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
}

export default function ManagingDirectorDashboard({ section = 'overview' }: ManagingDirectorDashboardProps) {
  const { bookings } = useBookings();
  const { payments, getBookingFinancials } = usePayments();
  const { mdTransfers, cashTransfers, logs } = useEventFinance();
  const { items, movements, allocations: inventoryAllocations } = useInventory();
  const { approvals, auditLog } = useAuthorization();
  const [cashRequests, setCashRequests] = useState<CashRequestWorkflow[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<DocumentOutput[]>([]);
  const [workflowListenerError, setWorkflowListenerError] = useState<string | null>(null);

  useEffect(() => {
    const cashUnsub = onSnapshot(
      query(collection(db, CASH_REQUEST_WORKFLOW_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        setWorkflowListenerError(null);
        setCashRequests(snapshot.docs.map((item) => normalizeCashRequest({ id: item.id, ...item.data() })));
      },
      (error) => {
        reportSnapshotError('md-dashboard-cash-requests', error);
        setWorkflowListenerError(LIVE_SYNC_WARNING);
      },
    );

    const voucherUnsub = onSnapshot(
      query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => {
        setWorkflowListenerError(null);
        setPaymentVouchers(
          snapshot.docs
            .map((item) => normalizeDocumentOutput({ id: item.id, ...item.data() }))
            .filter((entry) => entry.formId === 'payment_voucher'),
        );
      },
      (error) => {
        reportSnapshotError('md-dashboard-payment-vouchers', error);
        setWorkflowListenerError(LIVE_SYNC_WARNING);
      },
    );

    return () => {
      cashUnsub();
      voucherUnsub();
    };
  }, []);

  const metrics = useMemo(() => {
    const approvedBookings = bookings.filter((item) => item.bookingStatus === 'approved').length;
    const activeCustomers = new Set(
      bookings
        .filter((item) => item.bookingStatus !== 'rejected' && item.bookingStatus !== 'cancelled')
        .map((item) => item.customerName),
    ).size;
    const totalReceived = payments.reduce((sum, item) => sum + item.amount, 0);
    const totalTransferredToMd = mdTransfers.reduce((sum, item) => sum + item.amount, 0);
    const pendingApprovals = approvals.filter((item) => item.status === 'pending').length;

    return {
      approvedBookings,
      activeCustomers,
      totalReceived,
      totalTransferredToMd,
      pendingApprovals,
    };
  }, [approvals, bookings, mdTransfers, payments]);

  const consolidatedAudit = useMemo<MdAuditItem[]>(() => {
    const bookingItems: MdAuditItem[] = bookings.map((item) => ({
      id: `booking-${item.id}`,
      timestamp: item.createdAt,
      category: 'Booking',
      title: `${item.bookingStatus.toUpperCase()} | ${item.eventName}`,
      detail: `${item.id} | ${item.customerName} | ${item.hall} | ${item.date} ${item.startTime}-${item.endTime}`,
    }));

    const paymentItems: MdAuditItem[] = payments.map((item) => ({
      id: `payment-${item.id}`,
      timestamp: item.receivedAt,
      category: 'Payment',
      title: `${formatTZS(item.amount)} | ${item.method.toUpperCase()}`,
      detail: `${item.bookingId} | Ref: ${item.referenceNumber} | Receipt: ${item.receiptNumber}`,
    }));

    const transferItems: MdAuditItem[] = mdTransfers.map((item) => ({
      id: `md-transfer-${item.id}`,
      timestamp: item.transferredAt,
      category: 'MD Transfer',
      title: `${formatTZS(item.amount)} | ${item.reference}`,
      detail: item.notes || 'Cashier transfer to managing director',
    }));

    const approvalItems: MdAuditItem[] = approvals.map((item) => ({
      id: `approval-${item.id}`,
      timestamp: item.updatedAt || item.createdAt,
      category: 'Approval',
      title: `${item.status.toUpperCase()} | ${item.module}`,
      detail: `${item.title} | Ref: ${item.targetReference} | Level: ${item.level}`,
    }));

    const authAuditItems: MdAuditItem[] = auditLog.map((item) => ({
      id: `auth-audit-${item.id}`,
      timestamp: item.timestamp,
      category: 'Authorization Audit',
      title: `${item.action} | ${item.module}`,
      detail: `${item.actorRole} | ${item.detail}`,
    }));

    const financeAuditItems: MdAuditItem[] = logs.map((item) => ({
      id: `finance-audit-${item.id}`,
      timestamp: item.timestamp,
      category: 'Finance Audit',
      title: `${item.action} | ${item.referenceId}`,
      detail: `${item.actorRole} | ${item.detail}`,
    }));

    return [
      ...bookingItems,
      ...paymentItems,
      ...transferItems,
      ...approvalItems,
      ...authAuditItems,
      ...financeAuditItems,
    ]
      .sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp))
      .slice(0, 120);
  }, [approvals, auditLog, bookings, logs, mdTransfers, payments]);

  const moneyMovementRows = useMemo(
    () => cashTransfers
      .filter((item) => item.initiatedByRole === 'cashier_1' || Boolean(item.sentByUserId))
      .sort((a, b) => toTimestamp(b.sentAt ?? b.requestedAt) - toTimestamp(a.sentAt ?? a.requestedAt))
      .slice(0, 120),
    [cashTransfers],
  );

  const allocationQtyByItemId = useMemo(() => {
    const next = new Map<string, number>();
    inventoryAllocations
      .filter((allocation) => allocation.status === 'allocated')
      .forEach((allocation) => {
        next.set(allocation.itemId, (next.get(allocation.itemId) ?? 0) + allocation.quantity);
      });
    return next;
  }, [inventoryAllocations]);

  const latestMovementByItemId = useMemo(() => {
    const next = new Map<string, typeof movements[number]>();
    movements.forEach((movement) => {
      const current = next.get(movement.itemId);
      if (!current || toTimestamp(movement.createdAt) > toTimestamp(current.createdAt)) {
        next.set(movement.itemId, movement);
      }
    });
    return next;
  }, [movements]);

  const stockRows = useMemo(
    () => items
      .map((item) => ({
        item,
        allocatedOpen: allocationQtyByItemId.get(item.id) ?? 0,
        latestMovement: latestMovementByItemId.get(item.id),
        status: stockStatus(item),
      }))
      .sort((a, b) => {
        const statusRank = { 'Out of stock': 0, 'Low stock': 1, 'In stock': 2 };
        const statusDelta = statusRank[a.status] - statusRank[b.status];
        if (statusDelta !== 0) return statusDelta;
        return a.item.name.localeCompare(b.item.name);
      }),
    [allocationQtyByItemId, items, latestMovementByItemId],
  );

  const inventorySummary = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.currentQuantity, 0);
    const lowStockItems = items.filter((item) => item.currentQuantity <= item.reorderLevel).length;
    const allocatedOpen = inventoryAllocations
      .filter((allocation) => allocation.status === 'allocated')
      .reduce((sum, allocation) => sum + allocation.quantity, 0);

    return {
      totalItems: items.length,
      totalUnits,
      lowStockItems,
      allocatedOpen,
    };
  }, [inventoryAllocations, items]);

  const paymentsByBookingId = useMemo(() => {
    const next = new Map<string, typeof payments>();
    payments.forEach((payment) => {
      next.set(payment.bookingId, [...(next.get(payment.bookingId) ?? []), payment]);
    });
    return next;
  }, [payments]);

  const bookingPaymentRows = useMemo(
    () => bookings
      .map((booking) => {
        const relatedPayments = paymentsByBookingId.get(booking.id) ?? [];
        return {
          booking,
          financials: getBookingFinancials(booking.id),
          paymentCount: relatedPayments.length,
          lastPayment: relatedPayments[0],
        };
      })
      .sort((a, b) => toTimestamp(b.booking.date || b.booking.createdAt) - toTimestamp(a.booking.date || a.booking.createdAt)),
    [bookings, getBookingFinancials, paymentsByBookingId],
  );

  const bookingPaymentSummary = useMemo(() => {
    const totalQuoted = bookings.reduce((sum, booking) => sum + (Number(booking.quotedAmount) || 0) + (Number(booking.carPrice) || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const fullyPaidBookings = bookingPaymentRows.filter((row) => row.financials.status === 'fully_paid').length;

    return {
      bookings: bookings.length,
      totalQuoted,
      totalPaid,
      outstanding: Math.max(totalQuoted - totalPaid, 0),
      fullyPaidBookings,
    };
  }, [bookingPaymentRows, bookings, payments]);

  const cashRequestSummary = useMemo(() => {
    const open = cashRequests.filter((item) => item.currentStatus !== 'completed' && item.currentStatus !== 'declined').length;
    const completed = cashRequests.filter((item) => item.currentStatus === 'completed').length;
    const requestedTotal = cashRequests.reduce((sum, item) => sum + parseCurrencyAmount(item.fields.total_requested), 0);
    const voucherTotal = paymentVouchers.reduce((sum, item) => sum + parseCurrencyAmount(item.fields.amount), 0);

    return {
      cashRequests: cashRequests.length,
      open,
      completed,
      requestedTotal,
      vouchers: paymentVouchers.length,
      voucherTotal,
    };
  }, [cashRequests, paymentVouchers]);

  const currentSection = SECTION_COPY[section];

  const renderExecutiveMetricCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Transferred to MD</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(metrics.totalTransferredToMd)}</div>
          <p className="text-xs text-slate-600">From cashier fund distributions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(metrics.totalReceived)}</div>
          <p className="text-xs text-slate-600">All recorded payments</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Approved Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.approvedBookings}</div>
          <p className="text-xs text-slate-600">Events approved for operations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
          <p className="text-xs text-slate-600">Customers with active bookings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
          <p className="text-xs text-slate-600">Workflow actions awaiting decisions</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderOverview = () => (
    <Tabs defaultValue="money-movement" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="money-movement">Money Movement</TabsTrigger>
        <TabsTrigger value="executive-audit">Executive Audit</TabsTrigger>
      </TabsList>

      <TabsContent value="money-movement">
        <Card>
          <CardHeader>
            <CardTitle>Money Movement From Cashier</CardTitle>
            <CardDescription>
              Live cash movement records synced from backend `cash_transfers`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {moneyMovementRows.length === 0 ? (
              <p className="text-sm text-slate-500">No cashier money movements recorded yet.</p>
            ) : (
              moneyMovementRows.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.id}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-200 text-slate-900">{humanize(item.status)}</Badge>
                      <Badge className="bg-emerald-100 text-emerald-700">{formatTZS(item.approvedAmount || item.requestedAmount)}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Requested: {formatDateTime(item.requestedAt)} | Sent: {formatDateTime(item.sentAt)} | Received: {formatDateTime(item.receivedAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Request: {item.requestComment || '-'} | Decision: {item.decisionComment || '-'} | Receive/Deny: {item.receiveComment || '-'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="executive-audit">
        <Card>
          <CardHeader>
            <CardTitle>Full Executive Audit Feed</CardTitle>
            <CardDescription>
              Unified live feed from bookings, payments, approvals, authorization audit, finance audit, and MD transfers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {consolidatedAudit.length === 0 ? (
              <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
            ) : (
              consolidatedAudit.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.category}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(item.timestamp)}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderStockOverview = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.totalItems}</div>
            <p className="text-xs text-slate-600">Rows in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.totalUnits}</div>
            <p className="text-xs text-slate-600">Units currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.lowStockItems}</div>
            <p className="text-xs text-slate-600">At or below reorder level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.allocatedOpen}</div>
            <p className="text-xs text-slate-600">Units allocated to active events</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Register
              </CardTitle>
              <CardDescription>View-only stock table for managing director oversight.</CardDescription>
            </div>
            <Badge className="bg-slate-200 text-slate-900">View only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead className="text-right">Open Allocated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latest Movement</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-500">No inventory items recorded yet.</TableCell>
                </TableRow>
              ) : (
                stockRows.map(({ item, allocatedOpen, latestMovement, status }) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.currentQuantity}</TableCell>
                    <TableCell className="text-right">{item.reorderLevel}</TableCell>
                    <TableCell className="text-right">{allocatedOpen}</TableCell>
                    <TableCell>
                      <Badge className={stockStatusClass(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      {latestMovement
                        ? `${humanize(latestMovement.type)} | ${latestMovement.quantity} | ${latestMovement.reference}`
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderHallsPaymentBooking = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingPaymentSummary.bookings}</div>
            <p className="text-xs text-slate-600">All booking records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quoted Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(bookingPaymentSummary.totalQuoted)}</div>
            <p className="text-xs text-slate-600">Hall and car quoted amounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(bookingPaymentSummary.totalPaid)}</div>
            <p className="text-xs text-slate-600">Recorded booking payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(bookingPaymentSummary.outstanding)}</div>
            <p className="text-xs text-slate-600">{bookingPaymentSummary.fullyPaidBookings} bookings fully paid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings and Payment Register
              </CardTitle>
              <CardDescription>View-only table showing what has been booked and what has been paid.</CardDescription>
            </div>
            <Badge className="bg-slate-200 text-slate-900">View only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1320px]">
            <TableHeader>
              <TableRow>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Hall</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Booking Status</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Last Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingPaymentRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-slate-500">No bookings recorded yet.</TableCell>
                </TableRow>
              ) : (
                bookingPaymentRows.map(({ booking, financials, paymentCount, lastPayment }) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-semibold text-slate-900">{booking.id}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.eventName}</TableCell>
                    <TableCell>{booking.hall}</TableCell>
                    <TableCell>{booking.date} {booking.startTime}-{booking.endTime}</TableCell>
                    <TableCell>
                      <Badge className={bookingStatusClass(booking.bookingStatus)}>{humanize(booking.bookingStatus)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatTZS(financials.quotedAmount)}</TableCell>
                    <TableCell className="text-right">{formatTZS(financials.totalPaid)}</TableCell>
                    <TableCell className="text-right">{formatTZS(financials.balance)}</TableCell>
                    <TableCell>
                      <Badge className={paymentStatusClass(financials.status)}>{humanize(financials.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {lastPayment
                        ? `${formatTZS(lastPayment.amount)} | ${lastPayment.receiptNumber} | ${formatDateTime(lastPayment.receivedAt)}`
                        : paymentCount > 0 ? `${paymentCount} payments recorded` : 'No payment'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashRequestsVouchers = () => (
    <div className="space-y-4">
      {workflowListenerError ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {workflowListenerError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashRequestSummary.cashRequests}</div>
            <p className="text-xs text-slate-600">{cashRequestSummary.open} open requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requested Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(cashRequestSummary.requestedTotal)}</div>
            <p className="text-xs text-slate-600">{cashRequestSummary.completed} completed requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashRequestSummary.vouchers}</div>
            <p className="text-xs text-slate-600">Vouchers submitted to Accountant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voucher Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTZS(cashRequestSummary.voucherTotal)}</div>
            <p className="text-xs text-slate-600">From payment voucher amounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cash Request Register
              </CardTitle>
              <CardDescription>View-only workflow table for cash requests.</CardDescription>
            </div>
            <Badge className="bg-slate-200 text-slate-900">View only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-500">No cash requests recorded yet.</TableCell>
                </TableRow>
              ) : (
                cashRequests.map((entry) => {
                  const latestStage = entry.stages[entry.stages.length - 1];
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-semibold text-slate-900">{entry.reference}</TableCell>
                      <TableCell>{entry.fields.full_name ?? '-'}</TableCell>
                      <TableCell>{ROLE_LABELS[entry.submittedByRole] ?? entry.submittedByRole}</TableCell>
                      <TableCell className="text-right">{formatTZS(parseCurrencyAmount(entry.fields.total_requested))}</TableCell>
                      <TableCell>
                        <Badge className={cashRequestStatusClass(entry.currentStatus)}>
                          {getCashRequestStatusLabel(entry.currentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{latestStage?.label ?? '-'}</TableCell>
                      <TableCell>{entry.paymentVoucherNumber ?? entry.paymentVoucherId ?? '-'}</TableCell>
                      <TableCell>{formatDateTime(entry.submittedAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                Payment Voucher Register
              </CardTitle>
              <CardDescription>View-only table of vouchers created from cash requests and document entries.</CardDescription>
            </div>
            <Badge className="bg-slate-200 text-slate-900">View only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1240px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference Number</TableHead>
                <TableHead>Voucher Number</TableHead>
                <TableHead>Request Reference</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-slate-500">No payment vouchers recorded yet.</TableCell>
                </TableRow>
              ) : (
                paymentVouchers.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDateTime(entry.submittedAt)}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{entry.reference ?? '-'}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{entry.fields.voucher_number ?? '-'}</TableCell>
                    <TableCell>{entry.fields.request_reference ?? entry.fields.request_number ?? '-'}</TableCell>
                    <TableCell>{entry.fields.payee_name ?? '-'}</TableCell>
                    <TableCell className="text-right">{formatTZS(parseCurrencyAmount(entry.fields.amount))}</TableCell>
                    <TableCell>{entry.fields.department ?? '-'}</TableCell>
                    <TableCell>{ROLE_LABELS[entry.submittedByRole] ?? entry.submittedByRole}</TableCell>
                    <TableCell>{entry.fields.description ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const sectionContent = section === 'stock-overview'
    ? renderStockOverview()
    : section === 'halls-payment-booking'
      ? renderHallsPaymentBooking()
      : section === 'cash-requests-vouchers'
        ? renderCashRequestsVouchers()
        : renderOverview();

  return (
    <DashboardLayout title={currentSection.layoutTitle}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentSection.title}</h1>
          <p className="text-sm text-slate-600">{currentSection.description}</p>
        </div>

        {renderExecutiveMetricCards()}

        {sectionContent}
      </div>
    </DashboardLayout>
  );
}
