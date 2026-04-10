import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useMessages } from '@/contexts/MessageContext';
import { usePayments } from '@/contexts/PaymentContext';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { useInventory } from '@/contexts/InventoryContext';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CASH_REQUEST_WORKFLOW_COLLECTION,
  DOCUMENT_OUTPUTS_COLLECTION,
  PURCHASE_REQUEST_WORKFLOW_COLLECTION,
  CashRequestWorkflow,
  DocumentOutput,
  PurchaseRequestWorkflow,
  normalizeCashRequest,
  normalizePurchaseRequest,
} from '@/lib/requestWorkflows';
import { ROLE_LABELS, UserRole } from '@/types/auth';
import { AlertCircle, Calendar, CheckCircle2, Clock, DollarSign, Users } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isTodayIso(value: string): boolean {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { unreadCount } = useMessages();
  const { payments } = usePayments();
  const { approvals, auditLog } = useAuthorization();
  const { allocations, logs } = useEventFinance();
  const { items } = useInventory();
  const navigate = useNavigate();
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
    const outputsUnsub = onSnapshot(
      query(collection(db, DOCUMENT_OUTPUTS_COLLECTION), orderBy('submittedAt', 'desc')),
      (snapshot) => setOutputs(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<DocumentOutput, 'id'>) }))),
      () => setOutputs([]),
    );

    return () => {
      cashUnsub();
      purchaseUnsub();
      outputsUnsub();
    };
  }, [user]);

  const myBookings = useMemo(
    () => bookings.filter((entry) => entry.createdByUserId === user?.id),
    [bookings, user?.id],
  );

  const metrics = useMemo(() => {
    const todayBookings = bookings.filter((item) => item.date === new Date().toISOString().slice(0, 10)).length;
    const pendingBookings = bookings.filter((item) => item.bookingStatus === 'pending').length;
    const approvedBookings = bookings.filter((item) => item.bookingStatus === 'approved').length;
    const activeCustomers = new Set(
      bookings
        .filter((item) => item.bookingStatus !== 'rejected' && item.bookingStatus !== 'cancelled')
        .map((item) => item.customerName),
    ).size;
    const pendingApprovals = approvals.filter((item) => item.status === 'pending').length;
    const paymentsToday = payments.filter((item) => isTodayIso(item.receivedAt)).length;
    const totalReceived = payments.reduce((sum, item) => sum + item.amount, 0);
    const pendingAllocations = allocations.filter((item) => item.status === 'pending_controller').length;
    const releasedAllocations = allocations.filter((item) => item.status === 'funds_released').length;
    const openAllocations = allocations.filter((item) => item.status !== 'closed' && item.status !== 'rejected_controller').length;
    const cashierQueue = bookings.filter(
      (item) =>
        (item.assignedToRole === 'cashier_1' || !item.assignedToRole)
        && item.bookingStatus !== 'cancelled'
        && item.bookingStatus !== 'rejected',
    ).length;
    const lowStockItems = items.filter((item) => item.currentQuantity <= item.reorderLevel).length;
    const criticalLowStockItems = items.filter((item) => item.currentQuantity === 0).length;
    const recentActivityCount = auditLog.length + logs.length;
    const myCashRequests = cashRequests.filter((item) => item.submittedBy === user?.id).length;
    const pendingCashRequests = cashRequests.filter((item) => item.currentStatus !== 'completed' && item.currentStatus !== 'declined').length;
    const completedCashRequests = cashRequests.filter((item) => item.currentStatus === 'completed').length;
    const pendingCashierRequests = cashRequests.filter((item) => item.currentStatus === 'pending_cashier').length;
    const myPurchaseRequests = purchaseRequests.filter((item) => item.submittedBy === user?.id).length;
    const pendingPurchaseRequests = purchaseRequests.filter((item) => item.currentStatus === 'pending_purchaser').length;
    const completedPurchaseRequests = purchaseRequests.filter((item) => item.currentStatus === 'purchase_done').length;
    const paymentVouchers = outputs.filter((item) => item.formId === 'payment_voucher').length;
    return {
      todayBookings,
      pendingBookings,
      approvedBookings,
      activeCustomers,
      pendingApprovals,
      paymentsToday,
      totalReceived,
      pendingAllocations,
      releasedAllocations,
      openAllocations,
      cashierQueue,
      lowStockItems,
      criticalLowStockItems,
      recentActivityCount,
      myCashRequests,
      pendingCashRequests,
      completedCashRequests,
      pendingCashierRequests,
      myPurchaseRequests,
      pendingPurchaseRequests,
      completedPurchaseRequests,
      paymentVouchers,
    };
  }, [allocations, approvals, auditLog.length, bookings, cashRequests, items, logs.length, outputs, payments, purchaseRequests, user?.id]);

  const statsByRole = useMemo<Record<UserRole, StatCard[]>>(
    () => ({
      manager: [
        { title: "Today's Bookings", value: String(metrics.todayBookings), hint: 'Scheduled for today', icon: Calendar },
        { title: "Today's Payments", value: String(metrics.paymentsToday), hint: 'Payments received today', icon: DollarSign },
        { title: 'Total Received', value: formatTZS(metrics.totalReceived), hint: 'All recorded payments', icon: CheckCircle2 },
        { title: 'Active Customers', value: String(metrics.activeCustomers), hint: 'With active bookings', icon: Users },
      ],
      managing_director: [
        { title: 'Total Received', value: formatTZS(metrics.totalReceived), hint: 'All recorded collections', icon: DollarSign },
        { title: 'Pending Approvals', value: String(metrics.pendingApprovals), hint: 'Items awaiting decision', icon: AlertCircle },
        { title: 'Open Allocations', value: String(metrics.openAllocations), hint: 'Current financial commitments', icon: Clock },
        { title: 'Recent Activity', value: String(metrics.recentActivityCount), hint: 'Audit and finance trail', icon: CheckCircle2 },
      ],
      assistant_hall_manager: [
        { title: 'My Bookings', value: String(myBookings.length), hint: 'halls bookings submitted by you', icon: Calendar },
        { title: 'My Cash Requests', value: String(metrics.myCashRequests), hint: 'sent through cash workflow', icon: Clock },
        { title: 'My Purchase Requests', value: String(metrics.myPurchaseRequests), hint: 'sent to purchaser', icon: CheckCircle2 },
        { title: 'Unread Messages', value: String(unreadCount), hint: 'new request updates', icon: Users },
      ],
      cashier_1: [
        { title: 'Approved Requests', value: String(metrics.pendingCashierRequests), hint: 'manager-approved requests waiting for voucher', icon: Clock },
        { title: 'My Cash Requests', value: String(metrics.myCashRequests), hint: 'cash requests submitted by cashier', icon: DollarSign },
        { title: 'Cash Disbursements', value: String(metrics.completedCashRequests), hint: 'completed request records', icon: CheckCircle2 },
        { title: 'Unread Messages', value: String(unreadCount), hint: 'new workflow updates', icon: Users },
      ],
      cashier_2: [
        { title: 'Booking Quotes Queue', value: String(metrics.cashierQueue), hint: 'Legacy role redirected to cashier flow', icon: Clock },
        { title: 'Total Received', value: formatTZS(metrics.totalReceived), hint: 'All recorded receipts', icon: DollarSign },
        { title: 'Open Allocations', value: String(metrics.openAllocations), hint: 'Current finance visibility', icon: AlertCircle },
        { title: 'Recent Activity', value: String(metrics.recentActivityCount), hint: 'Finance trail', icon: CheckCircle2 },
      ],
      controller: [
        { title: 'Pending Approvals', value: String(metrics.pendingApprovals), hint: 'Items awaiting decision', icon: AlertCircle },
        { title: 'Open Allocations', value: String(metrics.openAllocations), hint: 'Outstanding allocations', icon: Clock },
        { title: 'Total Received', value: formatTZS(metrics.totalReceived), hint: 'All recorded payments', icon: DollarSign },
        { title: 'Recent Activity', value: String(metrics.recentActivityCount), hint: 'Audit trail', icon: CheckCircle2 },
      ],
      store_keeper: [
        { title: 'Inventory Items', value: String(items.length), hint: 'current inventory table rows', icon: Calendar },
        { title: 'My Cash Requests', value: String(metrics.myCashRequests), hint: 'cash requests you submitted', icon: Clock },
        { title: 'My Purchase Requests', value: String(metrics.myPurchaseRequests), hint: 'purchase requests you submitted', icon: AlertCircle },
        { title: 'Unread Messages', value: String(unreadCount), hint: 'new request updates', icon: Users },
      ],
      purchaser: [
        { title: 'Requests Received', value: String(metrics.pendingPurchaseRequests), hint: 'submitted purchase requests waiting on purchaser', icon: AlertCircle },
        { title: 'Purchases Done', value: String(metrics.completedPurchaseRequests), hint: 'completed purchase records', icon: CheckCircle2 },
        { title: 'Low Stock Alerts', value: String(metrics.lowStockItems), hint: 'inventory visibility only', icon: Clock },
        { title: 'Unread Messages', value: String(unreadCount), hint: 'new request updates', icon: Calendar },
      ],
      accountant: [
        { title: 'Pending Cash Requests', value: String(metrics.pendingCashRequests), hint: 'requests needing accountant or downstream action', icon: AlertCircle },
        { title: 'Payment Vouchers', value: String(metrics.paymentVouchers), hint: 'voucher records sent to accountant', icon: Calendar },
        { title: 'Completed Requests', value: String(metrics.completedCashRequests), hint: 'cash requests fully processed', icon: CheckCircle2 },
        { title: 'Unread Messages', value: String(unreadCount), hint: 'new request updates', icon: Clock },
      ],
    }),
    [items.length, metrics, myBookings.length, unreadCount],
  );

  if (!user) return null;

  const roleCards = statsByRole[user.role];
  const recentBookings = [...bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const quickLinks = user.role === 'manager'
    ? [
        { label: 'Customers', path: '/customers' },
        { label: 'Inventory', path: '/rentals' },
        { label: 'Reports', path: '/reports' },
        { label: 'Messages', path: '/messages' },
      ]
    : user.role === 'assistant_hall_manager'
    ? [
        { label: 'Bookings', path: '/bookings' },
        { label: 'Cash Requests', path: '/cash-requests' },
        { label: 'Purchase Requests', path: '/purchase-requests' },
        { label: 'Messages', path: '/messages' },
        { label: 'Settings', path: '/settings' },
      ]
    : user.role === 'store_keeper'
      ? [
          { label: 'Inventory', path: '/rentals' },
          { label: 'Cash Requests', path: '/cash-requests' },
          { label: 'Purchase Requests', path: '/purchase-requests' },
          { label: 'Messages', path: '/messages' },
        ]
    : user.role === 'purchaser'
      ? [
          { label: 'Purchase Requests', path: '/purchase-requests' },
          { label: 'Inventory', path: '/rentals' },
          { label: 'Messages', path: '/messages' },
          { label: 'Reports', path: '/reports' },
        ]
      : user.role === 'accountant'
        ? [
            { label: 'Cash Requests', path: '/cash-requests' },
            { label: 'Payment Vouchers', path: '/payment-vouchers' },
            { label: 'Money Movement', path: '/cash-movement' },
            { label: 'Messages', path: '/messages' },
          ]
    : user.role === 'cashier_1'
      ? [
          { label: 'Cash Requests', path: '/cash-requests' },
          { label: 'Cash Use', path: '/cash-movement' },
          { label: 'Messages', path: '/messages' },
          { label: 'Reports', path: '/reports' },
        ]
      : [
          { label: 'Event Planner', path: '/rentals' },
          { label: 'Inventory Reports', path: '/rentals' },
          { label: 'Documents', path: '/documents' },
          { label: 'Settings', path: '/settings' },
        ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 text-slate-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-sm text-slate-600">{ROLE_LABELS[user.role]} | Live system overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roleCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-slate-600">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Recent Bookings</CardTitle>
              <CardDescription className="text-slate-600">Latest real booking records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-sm text-slate-500">No booking records yet.</p>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{booking.eventName}</p>
                      <p className="text-xs text-slate-600">{booking.hall}</p>
                      {booking.pastBookingSubmission ? (
                        <p className="text-[11px] font-semibold text-violet-700">
                          Past Record: {booking.pastBookingApprovalStatus?.replace(/_/g, ' ') ?? 'pending cashier'}
                          {booking.pastReviewedAt ? ` | ${new Date(booking.pastReviewedAt).toLocaleDateString()}` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{booking.date}</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kuringe-red">
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Links</CardTitle>
              <CardDescription className="text-slate-600">Open a working module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickLinks.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-left"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-red-500">Open</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
