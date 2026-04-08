import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useMessages } from '@/contexts/MessageContext';
import { usePayments } from '@/contexts/PaymentContext';
import { getCashierAlerts } from '@/lib/cashierAlerts';

export default function Messages() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { getBookingFinancials } = usePayments();
  const { messages, markMessageRead } = useMessages();

  const isManager = user?.role === 'manager';
  const isCashier = user?.role === 'cashier_1';
  const cashierAlerts = isCashier ? getCashierAlerts(bookings, getBookingFinancials) : [];

  return (
    <DashboardLayout title="Messages">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-600">
            {isManager ? 'Approvals and alerts sent to Halls Manager.' : isCashier ? 'Cashier payment alerts and your sent alerts.' : 'Alerts you sent to Halls Manager.'}
          </p>
        </div>

        {isCashier ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">Cashier Alerts</p>
                <Badge className={cashierAlerts.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-700'}>
                  {cashierAlerts.length} active
                </Badge>
              </div>
              {cashierAlerts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No unpaid event alerts right now.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {cashierAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{alert.title}</p>
                        <Badge className="bg-rose-100 text-rose-800">{alert.bookingId}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{alert.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {messages.length === 0 ? (
          isCashier ? null : <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No messages yet.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{entry.title}</p>
                  <div className="flex items-center gap-2">
                    {entry.decision ? (
                      <Badge className={entry.decision === 'approve' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {entry.decision}
                      </Badge>
                    ) : null}
                    <Badge className={entry.read ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}>
                      {entry.read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-700">{entry.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Booking: {entry.bookingId ?? '-'} | From: {entry.fromRole} | {new Date(entry.createdAt).toLocaleString()}
                </p>
                {isManager && !entry.read ? (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => void markMessageRead(entry.id)}>
                      Mark Read
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
