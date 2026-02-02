import { useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const bookingsStats = [
  { title: "Today's Bookings", value: '3 events', description: 'scheduled for today' },
  { title: 'Pending Approvals', value: '5 approvals', description: 'awaiting manager review' },
  { title: 'Monthly Revenue', value: 'TSh 15,750,000', description: '+12% from last month' },
  { title: 'Active Customers', value: '47 ongoing', description: 'clients with live bookings' },
];

const bookingsSections = [
  {
    title: 'Event Coverage',
    bullets: [
      'Witness Hall reserved for a multi-day wedding through Sunday evening.',
      'Kilimanjaro Hall is hosting a corporate offsite with hybrid streaming needs.',
      'Garden Deck blocked for an intimate panel and cocktail reception.',
    ],
  },
  {
    title: 'Operations Ready',
    bullets: [
      'Assistant team lining up deposit reminders and contract sign-offs.',
      'Venue setup briefs sent to catering, AV, and décor partners.',
      'Security and parking rosters aligned with each slot.',
    ],
  },
];

const defaultEntry = {
  event: '',
  hall: '',
  date: '',
  time: '',
};

type BookingEntry = typeof defaultEntry & { id: string; status: string };

export default function Bookings() {
  const [entries, setEntries] = useState<BookingEntry[]>([]);
  const [form, setForm] = useState(defaultEntry);

  const handleChange = (field: keyof typeof defaultEntry, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBooking = () => {
    if (!form.event || !form.hall || !form.date || !form.time) return;
    setEntries((prev) => [
      { ...form, id: crypto.randomUUID(), status: 'Draft' },
      ...prev,
    ]);
    setForm(defaultEntry);
  };

  return (
    <ManagementPageTemplate
      pageTitle="Bookings"
      subtitle="Monitor the day’s schedule, pending approvals, and formation tasks for every hall."
      stats={bookingsStats}
      sections={bookingsSections}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Manual booking entry</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['event', 'hall', 'date', 'time'] as const).map((field) => (
                <input
                  key={field}
                  type={field === 'date' ? 'date' : field === 'time' ? 'time' : 'text'}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form[field]}
                  onChange={(event) => handleChange(field, event.target.value)}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Entries are stored locally until you integrate a persistence layer.
              </span>
              <Button size="sm" onClick={handleAddBooking}>
                Add booking
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Manual bookings</p>
              <Badge className="bg-slate-100 text-slate-700">{entries.length} records</Badge>
            </div>
            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No manual entries yet. Use the form above to register a booking.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{entry.event}</span>
                      <Badge className="bg-slate-200 text-slate-900">{entry.status}</Badge>
                    </div>
                    <p className="text-slate-500">
                      {entry.hall} • {entry.date} {entry.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
