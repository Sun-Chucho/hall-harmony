import { useMemo } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { useBookings } from '@/contexts/BookingContext';

interface CustomerRow {
  name: string;
  phone: string;
  totalBookings: number;
  publicBookings: number;
  latestEvent: string;
  latestDate: string;
}

export default function Customers() {
  const { bookings } = useBookings();

  const customers = useMemo<CustomerRow[]>(() => {
    const index = new Map<string, CustomerRow>();
    for (const booking of bookings) {
      const key = `${booking.customerName.trim().toLowerCase()}::${booking.customerPhone.trim()}`;
      const existing = index.get(key);
      if (!existing) {
        index.set(key, {
          name: booking.customerName,
          phone: booking.customerPhone,
          totalBookings: 1,
          publicBookings: booking.createdByUserId === 'public-web' ? 1 : 0,
          latestEvent: booking.eventName,
          latestDate: booking.date,
        });
        continue;
      }

      existing.totalBookings += 1;
      if (booking.createdByUserId === 'public-web') existing.publicBookings += 1;
      if (booking.date > existing.latestDate) {
        existing.latestDate = booking.date;
        existing.latestEvent = booking.eventName;
      }
    }

    return [...index.values()].sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [bookings]);

  const stats = [
    { title: 'Unique Customers', value: String(customers.length), description: 'deduplicated by name and phone' },
    { title: 'Total Bookings', value: String(bookings.length), description: 'all booking records' },
    {
      title: 'Website Bookings',
      value: String(bookings.filter((item) => item.createdByUserId === 'public-web').length),
      description: 'submitted from public website',
    },
    {
      title: 'Active Customers',
      value: String(new Set(bookings.filter((item) => item.bookingStatus === 'approved').map((item) => item.customerPhone)).size),
      description: 'with approved bookings',
    },
  ];

  return (
    <ManagementPageTemplate
      pageTitle="Customers"
      subtitle="Live customer directory generated from booking records."
      stats={stats}
      sections={[]}
      action={(
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Bookings</th>
                <th className="px-2 py-2">From Website</th>
                <th className="px-2 py-2">Latest Event</th>
                <th className="px-2 py-2">Latest Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-slate-600" colSpan={6}>No customer records yet.</td>
                </tr>
              ) : (
                customers.map((entry) => (
                  <tr key={`${entry.name}-${entry.phone}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-800">{entry.name}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.phone}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.totalBookings}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.publicBookings}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.latestEvent}</td>
                    <td className="px-2 py-2 text-slate-700">{entry.latestDate}</td>
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
