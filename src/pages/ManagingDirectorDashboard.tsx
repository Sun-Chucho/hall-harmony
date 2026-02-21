import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookings } from '@/contexts/BookingContext';
import { useEventFinance } from '@/contexts/EventFinanceContext';
import { usePayments } from '@/contexts/PaymentContext';
import { Banknote, Calendar, ReceiptText, Users } from 'lucide-react';

function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ManagingDirectorDashboard() {
  const { bookings } = useBookings();
  const { payments } = usePayments();
  const { mdTransfers } = useEventFinance();

  const metrics = useMemo(() => {
    const approvedBookings = bookings.filter((item) => item.bookingStatus === 'approved').length;
    const activeCustomers = new Set(
      bookings
        .filter((item) => item.bookingStatus !== 'rejected' && item.bookingStatus !== 'cancelled')
        .map((item) => item.customerName),
    ).size;
    const totalReceived = payments.reduce((sum, item) => sum + item.amount, 0);
    const totalTransferredToMd = mdTransfers.reduce((sum, item) => sum + item.amount, 0);

    return {
      approvedBookings,
      activeCustomers,
      totalReceived,
      totalTransferredToMd,
    };
  }, [bookings, mdTransfers, payments]);

  return (
    <DashboardLayout title="Managing Director Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Managing Director Overview</h1>
          <p className="text-sm text-slate-600">Executive finance visibility and cashier-to-MD fund distributions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fund Transfers to Managing Director</CardTitle>
            <CardDescription>Latest transfer entries recorded under Cash Movement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mdTransfers.length === 0 ? (
              <p className="text-sm text-slate-500">No Managing Director transfers recorded yet.</p>
            ) : (
              mdTransfers.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.reference}</p>
                    <p className="text-xs text-slate-600">{item.notes || 'Cashier transfer to managing director'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatTZS(item.amount)}</p>
                    <p className="text-xs text-slate-500">{new Date(item.transferredAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
