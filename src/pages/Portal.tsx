import { useMemo } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { useBookings } from '@/contexts/BookingContext';

export default function Portal() {
  const { bookings } = useBookings();

  const publicBookings = useMemo(
    () => bookings.filter((item) => item.createdByUserId === 'public-web')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings],
  );

  const stats = [
    { title: 'Website Submissions', value: String(publicBookings.length), description: 'all public booking requests' },
    {
      title: 'Pending Review',
      value: String(publicBookings.filter((item) => item.bookingStatus === 'pending').length),
      description: 'waiting for staff action',
    },
    {
      title: 'Approved',
      value: String(publicBookings.filter((item) => item.bookingStatus === 'approved').length),
      description: 'confirmed website bookings',
    },
    {
      title: 'Rejected/Cancelled',
      value: String(publicBookings.filter((item) => item.bookingStatus === 'rejected' || item.bookingStatus === 'cancelled').length),
      description: 'not accepted',
    },
  ];

  return (
    <ManagementPageTemplate
      pageTitle="Web Portal"
      subtitle="Live public website booking submissions synced from Firebase."
      stats={stats}
      sections={[]}
      action={(
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Booking ID</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Event</th>
                <th className="px-2 py-2">Hall</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {publicBookings.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-slate-600" colSpan={8}>No website bookings yet.</td>
                </tr>
              ) : (
                publicBookings.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.id}</td>
                    <td className="px-2 py-2 text-slate-800">{entry.customerName}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.customerPhone}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.eventName}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.hall}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.date}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.bookingStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
