import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthorization } from '@/contexts/AuthorizationContext';
import { useBookings } from '@/contexts/BookingContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { usePayments } from '@/contexts/PaymentContext';
import { Banknote, Calendar, ReceiptText, ShieldCheck, Users } from 'lucide-react';

function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type MdAuditItem = {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  detail: string;
};

export default function ManagingDirectorDashboard() {
  const { bookings } = useBookings();
  const { payments } = usePayments();
  const { mdTransfers, cashTransfers, logs } = useEventFinance();
  const { approvals, auditLog } = useAuthorization();

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
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 120);
  }, [approvals, auditLog, bookings, logs, mdTransfers, payments]);

  const moneyMovementRows = useMemo(
    () => cashTransfers
      .filter((item) => item.initiatedByRole === 'cashier_1' || Boolean(item.sentByUserId))
      .sort((a, b) => new Date(b.sentAt ?? b.requestedAt).getTime() - new Date(a.sentAt ?? a.requestedAt).getTime())
      .slice(0, 120),
    [cashTransfers],
  );

  return (
    <DashboardLayout title="Managing Director Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Managing Director Overview</h1>
          <p className="text-sm text-slate-600">Executive finance visibility and full cross-module audit feed.</p>
        </div>

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
                          <Badge className="bg-slate-200 text-slate-900">{item.status.replace(/_/g, ' ')}</Badge>
                          <Badge className="bg-emerald-100 text-emerald-700">{formatTZS(item.approvedAmount || item.requestedAmount)}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        Requested: {new Date(item.requestedAt).toLocaleString()} | Sent: {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'} | Received: {item.receivedAt ? new Date(item.receivedAt).toLocaleString() : '-'}
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
                          <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
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
      </div>
    </DashboardLayout>
  );
}
