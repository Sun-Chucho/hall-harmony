import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
  downloadCsv,
  getCashRequestStatusLabel,
  normalizeCashRequest,
  normalizeDocumentOutput,
  parseCurrencyAmount,
} from '@/lib/requestWorkflows';
import { ROLE_LABELS } from '@/types/auth';
import { Banknote, BarChart3, Calendar, Download, FileText, Package, ReceiptText, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export type ManagingDirectorDashboardSection =
  | 'overview'
  | 'analytics'
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
  analytics: {
    title: 'Smart Analytics',
    description: 'Charts and executive figures built from stock, booking, payment, and cash movement activity.',
    layoutTitle: 'MD Smart Analytics',
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

const SECTION_NAV: Array<{ value: ManagingDirectorDashboardSection; label: string; path: string }> = [
  { value: 'overview', label: 'Overview', path: '/managing-director-dashboard' },
  { value: 'analytics', label: 'Analytics', path: '/managing-director-dashboard/analytics' },
  { value: 'stock-overview', label: 'Stock', path: '/managing-director-dashboard/stock-overview' },
  { value: 'halls-payment-booking', label: 'Bookings & Payments', path: '/managing-director-dashboard/halls-payment-booking' },
  { value: 'cash-requests-vouchers', label: 'Cash & Vouchers', path: '/managing-director-dashboard/cash-requests-vouchers' },
];

const REVENUE_CHART_CONFIG = {
  paid: { label: 'Paid revenue', color: '#dc2626' },
  quoted: { label: 'Quoted revenue', color: '#2563eb' },
  bookings: { label: 'Bookings', color: '#0f766e' },
} satisfies ChartConfig;

const STOCK_CHART_CONFIG = {
  value: { label: 'Items', color: '#0f766e' },
} satisfies ChartConfig;

const MOVEMENT_CHART_CONFIG = {
  quantity: { label: 'Quantity moved', color: '#7c3aed' },
  count: { label: 'Events', color: '#d97706' },
} satisfies ChartConfig;

const CASH_FLOW_CHART_CONFIG = {
  amount: { label: 'Amount', color: '#0891b2' },
} satisfies ChartConfig;

const PIE_COLORS = ['#0f766e', '#2563eb', '#d97706', '#dc2626', '#64748b', '#7c3aed'];

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

function getMonthBucket(value?: string) {
  const timestamp = toTimestamp(value);
  const date = timestamp ? new Date(timestamp) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function formatMonthBucket(bucket: string) {
  const [year, month] = bucket.split('-').map((part) => Number(part));
  if (!year || !month) return bucket;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
  });
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function chartHasData(rows: Array<Record<string, unknown>>, key: string) {
  return rows.some((row) => Number(row[key]) > 0);
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
  const navigate = useNavigate();
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

  const revenueTrendData = useMemo(() => {
    const buckets = new Map<string, { bucket: string; month: string; paid: number; quoted: number; bookings: number }>();
    const getBucket = (value?: string) => {
      const bucket = getMonthBucket(value);
      const existing = buckets.get(bucket);
      if (existing) return existing;
      const next = { bucket, month: formatMonthBucket(bucket), paid: 0, quoted: 0, bookings: 0 };
      buckets.set(bucket, next);
      return next;
    };

    bookings.forEach((booking) => {
      const row = getBucket(booking.date || booking.createdAt);
      row.bookings += 1;
      row.quoted += (Number(booking.quotedAmount) || 0) + (Number(booking.carPrice) || 0);
    });

    payments.forEach((payment) => {
      const row = getBucket(payment.receivedAt);
      row.paid += payment.amount;
    });

    return [...buckets.values()]
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .slice(-8);
  }, [bookings, payments]);

  const bookingStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      counts.set(booking.bookingStatus, (counts.get(booking.bookingStatus) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([status, value]) => ({ label: humanize(status), value }))
      .sort((a, b) => b.value - a.value);
  }, [bookings]);

  const stockHealthData = useMemo(() => {
    const outOfStock = items.filter((item) => item.currentQuantity <= 0).length;
    const lowStock = items.filter((item) => item.currentQuantity > 0 && item.currentQuantity <= item.reorderLevel).length;
    const inStock = Math.max(items.length - outOfStock - lowStock, 0);
    return [
      { label: 'In stock', value: inStock, fill: '#0f766e' },
      { label: 'Low stock', value: lowStock, fill: '#d97706' },
      { label: 'Out of stock', value: outOfStock, fill: '#dc2626' },
    ];
  }, [items]);

  const inventoryMovementData = useMemo(() => {
    const grouped = new Map<string, { label: string; quantity: number; count: number }>();
    movements.forEach((movement) => {
      const current = grouped.get(movement.type) ?? {
        label: humanize(movement.type),
        quantity: 0,
        count: 0,
      };
      current.quantity += Math.abs(Number(movement.quantity) || 0);
      current.count += 1;
      grouped.set(movement.type, current);
    });
    return [...grouped.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  }, [movements]);

  const cashFlowData = useMemo(
    () => [
      { label: 'Payments received', amount: metrics.totalReceived },
      { label: 'Transferred to MD', amount: metrics.totalTransferredToMd },
      { label: 'Cash requested', amount: cashRequestSummary.requestedTotal },
      { label: 'Voucher value', amount: cashRequestSummary.voucherTotal },
    ],
    [cashRequestSummary.requestedTotal, cashRequestSummary.voucherTotal, metrics.totalReceived, metrics.totalTransferredToMd],
  );

  const smartFigures = useMemo(() => {
    const collectionRate = bookingPaymentSummary.totalQuoted > 0
      ? (bookingPaymentSummary.totalPaid / bookingPaymentSummary.totalQuoted) * 100
      : 0;
    const approvalRate = bookings.length > 0
      ? (bookings.filter((booking) => booking.bookingStatus === 'approved' || booking.bookingStatus === 'completed').length / bookings.length) * 100
      : 0;
    const stockRiskRate = inventorySummary.totalItems > 0
      ? (inventorySummary.lowStockItems / inventorySummary.totalItems) * 100
      : 0;
    const cashCompletionRate = cashRequestSummary.cashRequests > 0
      ? (cashRequestSummary.completed / cashRequestSummary.cashRequests) * 100
      : 0;
    const latestInventoryMovement = [...movements]
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))[0];

    return [
      {
        title: 'Collection Rate',
        value: formatPercent(collectionRate),
        detail: `${formatTZS(bookingPaymentSummary.totalPaid)} paid against ${formatTZS(bookingPaymentSummary.totalQuoted)} quoted`,
      },
      {
        title: 'Booking Approval Health',
        value: formatPercent(approvalRate),
        detail: `${metrics.approvedBookings} approved bookings from ${bookings.length} total records`,
      },
      {
        title: 'Stock Risk',
        value: formatPercent(stockRiskRate),
        detail: `${inventorySummary.lowStockItems} of ${inventorySummary.totalItems} inventory items need attention`,
      },
      {
        title: 'Cash Request Completion',
        value: formatPercent(cashCompletionRate),
        detail: `${cashRequestSummary.completed} completed from ${cashRequestSummary.cashRequests} cash requests`,
      },
      {
        title: 'Latest Stock Movement',
        value: latestInventoryMovement ? humanize(latestInventoryMovement.type) : '-',
        detail: latestInventoryMovement
          ? `${latestInventoryMovement.quantity} units | ${formatDateTime(latestInventoryMovement.createdAt)}`
          : 'No inventory movement recorded yet',
      },
      {
        title: 'MD Transfer Coverage',
        value: formatPercent(metrics.totalReceived > 0 ? (metrics.totalTransferredToMd / metrics.totalReceived) * 100 : 0),
        detail: `${formatTZS(metrics.totalTransferredToMd)} transferred from ${formatTZS(metrics.totalReceived)} received`,
      },
    ];
  }, [bookingPaymentSummary, bookings, cashRequestSummary, inventorySummary, metrics, movements]);

  const currentSection = SECTION_COPY[section];

  const handleSectionChange = (value: string) => {
    const next = SECTION_NAV.find((item) => item.value === value);
    if (next) navigate(next.path);
  };

  const exportExecutiveAudit = () => {
    downloadCsv('md-executive-audit.csv', [
      ['Timestamp', 'Category', 'Title', 'Detail'],
      ...consolidatedAudit.map((item) => [item.timestamp, item.category, item.title, item.detail]),
    ]);
  };

  const exportStockRegister = () => {
    downloadCsv('md-stock-register.csv', [
      ['Item', 'Unit', 'Current Qty', 'Reorder Level', 'Open Allocated', 'Status', 'Latest Movement', 'Created'],
      ...stockRows.map(({ item, allocatedOpen, latestMovement, status }) => [
        item.name,
        item.unit,
        item.currentQuantity,
        item.reorderLevel,
        allocatedOpen,
        status,
        latestMovement ? `${humanize(latestMovement.type)} | ${latestMovement.quantity} | ${latestMovement.reference}` : '',
        item.createdAt,
      ]),
    ]);
  };

  const exportBookingsPayments = () => {
    downloadCsv('md-bookings-payments.csv', [
      ['Booking Ref', 'Customer', 'Event', 'Hall', 'Date', 'Start', 'End', 'Booking Status', 'Quoted', 'Paid', 'Balance', 'Payment Status', 'Last Payment'],
      ...bookingPaymentRows.map(({ booking, financials, lastPayment }) => [
        booking.id,
        booking.customerName,
        booking.eventName,
        booking.hall,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking.bookingStatus,
        financials.quotedAmount,
        financials.totalPaid,
        financials.balance,
        financials.status,
        lastPayment ? `${lastPayment.receiptNumber} | ${lastPayment.amount} | ${lastPayment.receivedAt}` : '',
      ]),
    ]);
  };

  const exportCashRequests = () => {
    downloadCsv('md-cash-requests.csv', [
      ['Reference', 'Requester', 'Role', 'Amount', 'Status', 'Current Stage', 'Voucher', 'Submitted'],
      ...cashRequests.map((entry) => {
        const latestStage = entry.stages[entry.stages.length - 1];
        return [
          entry.reference,
          entry.fields.full_name ?? '',
          ROLE_LABELS[entry.submittedByRole] ?? entry.submittedByRole,
          parseCurrencyAmount(entry.fields.total_requested),
          getCashRequestStatusLabel(entry.currentStatus),
          latestStage?.label ?? '',
          entry.paymentVoucherNumber ?? entry.paymentVoucherId ?? '',
          entry.submittedAt,
        ];
      }),
    ]);
  };

  const exportPaymentVouchers = () => {
    downloadCsv('md-payment-vouchers.csv', [
      ['Date', 'Reference Number', 'Voucher Number', 'Request Reference', 'Payee', 'Amount', 'Department', 'Submitted By', 'Description'],
      ...paymentVouchers.map((entry) => [
        entry.submittedAt,
        entry.reference ?? '',
        entry.fields.voucher_number ?? '',
        entry.fields.request_reference ?? entry.fields.request_number ?? '',
        entry.fields.payee_name ?? '',
        parseCurrencyAmount(entry.fields.amount),
        entry.fields.department ?? '',
        ROLE_LABELS[entry.submittedByRole] ?? entry.submittedByRole,
        entry.fields.description ?? '',
      ]),
    ]);
  };

  const exportAnalyticsSummary = () => {
    downloadCsv('md-smart-analytics.csv', [
      ['Figure', 'Value', 'Detail'],
      ...smartFigures.map((figure) => [figure.title, figure.value, figure.detail]),
      ['Revenue Trend Months', revenueTrendData.length, 'Number of monthly buckets included in the chart'],
      ['Inventory Movement Types', inventoryMovementData.length, 'Movement categories included in the chart'],
    ]);
  };

  const renderExportActions = () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportAnalyticsSummary}>
        <Download className="mr-2 h-4 w-4" />
        Analytics
      </Button>
      <Button variant="outline" size="sm" onClick={exportStockRegister}>
        <Download className="mr-2 h-4 w-4" />
        Stock
      </Button>
      <Button variant="outline" size="sm" onClick={exportBookingsPayments}>
        <Download className="mr-2 h-4 w-4" />
        Bookings
      </Button>
      <Button variant="outline" size="sm" onClick={exportCashRequests}>
        <Download className="mr-2 h-4 w-4" />
        Cash Requests
      </Button>
      <Button variant="outline" size="sm" onClick={exportPaymentVouchers}>
        <Download className="mr-2 h-4 w-4" />
        Vouchers
      </Button>
      <Button variant="outline" size="sm" onClick={exportExecutiveAudit}>
        <Download className="mr-2 h-4 w-4" />
        Audit
      </Button>
    </div>
  );

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

  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Smart Figures</h2>
          <p className="text-sm text-slate-600">Live calculations from stock, booking, payment, and cash movement records.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportAnalyticsSummary}>
          <Download className="mr-2 h-4 w-4" />
          Export Analytics
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {smartFigures.map((figure) => (
          <Card key={figure.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{figure.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-950">{figure.value}</div>
              <p className="mt-1 text-xs text-slate-600">{figure.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue and Booking Trend
            </CardTitle>
            <CardDescription>Monthly paid revenue, quoted revenue, and booking volume.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrendData.length === 0 ? (
              <p className="text-sm text-slate-500">No revenue or booking records available for the chart.</p>
            ) : (
              <ChartContainer config={REVENUE_CHART_CONFIG} className="h-[300px] w-full">
                <LineChart data={revenueTrendData} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={76} tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="quoted" stroke="var(--color-quoted)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Status Mix
            </CardTitle>
            <CardDescription>Distribution of bookings by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingStatusData.length === 0 ? (
              <p className="text-sm text-slate-500">No booking records available for the chart.</p>
            ) : (
              <ChartContainer config={STOCK_CHART_CONFIG} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={bookingStatusData} dataKey="value" nameKey="label" innerRadius={62} outerRadius={94} paddingAngle={2}>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Health
            </CardTitle>
            <CardDescription>Inventory status grouped by in-stock, low-stock, and out-of-stock positions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!chartHasData(stockHealthData, 'value') ? (
              <p className="text-sm text-slate-500">No inventory records available for the chart.</p>
            ) : (
              <ChartContainer config={STOCK_CHART_CONFIG} className="h-[300px] w-full">
                <BarChart data={stockHealthData} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {stockHealthData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Inventory Movements
            </CardTitle>
            <CardDescription>Quantity moved by stock movement type.</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryMovementData.length === 0 ? (
              <p className="text-sm text-slate-500">No inventory movements available for the chart.</p>
            ) : (
              <ChartContainer config={MOVEMENT_CHART_CONFIG} className="h-[300px] w-full">
                <BarChart data={inventoryMovementData} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Cash Movement Figures
            </CardTitle>
            <CardDescription>Payments, MD transfers, cash requests, and payment voucher values.</CardDescription>
          </CardHeader>
          <CardContent>
            {!chartHasData(cashFlowData, 'amount') ? (
              <p className="text-sm text-slate-500">No cash movement records available for the chart.</p>
            ) : (
              <ChartContainer config={CASH_FLOW_CHART_CONFIG} className="h-[320px] w-full">
                <BarChart data={cashFlowData} layout="vertical" margin={{ top: 12, right: 18, left: 24, bottom: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tickMargin={8} width={132} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
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

  const sectionContent = section === 'analytics'
    ? renderAnalytics()
    : section === 'stock-overview'
    ? renderStockOverview()
    : section === 'halls-payment-booking'
      ? renderHallsPaymentBooking()
      : section === 'cash-requests-vouchers'
        ? renderCashRequestsVouchers()
        : renderOverview();

  return (
    <DashboardLayout title={currentSection.layoutTitle}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{currentSection.title}</h1>
            <p className="text-sm text-slate-600">{currentSection.description}</p>
          </div>
          {renderExportActions()}
        </div>

        <Tabs value={section} onValueChange={handleSectionChange}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {SECTION_NAV.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold data-[state=active]:border-slate-950 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {renderExecutiveMetricCards()}

        {sectionContent}
      </div>
    </DashboardLayout>
  );
}
