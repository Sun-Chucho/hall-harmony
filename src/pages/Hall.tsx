import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import { hallCatalog } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function hallPrice(hallId: string, isoDate: string): number {
  if (!isoDate) return 0;
  const day = new Date(isoDate).getDay();
  if (hallId === 'witness') return day === 6 ? 3835000 : day === 1 || day === 2 ? 1534000 : 2301000;
  if (hallId === 'kilimanjaro') return day === 6 ? 2301000 : day === 1 || day === 2 ? 1227000 : 1534000;
  return day === 1 || day === 2 ? 177000 : 236000;
}

const Hall = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const hall = hallCatalog.find((entry) => entry.id === hallId);
  const { toast } = useToast();
  const { createPublicBooking, hasConflict } = useBookings();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [schedulePhone, setSchedulePhone] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [bookForm, setBookForm] = useState<CreateBookingInput>({
    customerName: '',
    customerPhone: '',
    eventName: '',
    eventType: 'Wedding',
    hall: '',
    date: '',
    startTime: '17:30',
    endTime: '23:59',
    expectedGuests: 0,
    quotedAmount: 0,
    notes: '',
  });

  if (!hall) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Hall not found</p>
          <h1 className="mt-4 text-3xl font-bold">We could not locate this hall.</h1>
          <p className="mt-3 text-slate-600">Please return to the latest halls page to continue exploring.</p>
          <button
            onClick={() => navigate('/#halls')}
            className="mt-8 rounded-full border border-slate-300 px-6 py-3 text-xs uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-700 hover:text-slate-900"
          >
            Back to halls
          </button>
        </div>
      </div>
    );
  }

  const amenities = [
    'Dedicated Parking',
    'Standby Generator',
    'Premium Sound System',
    'Air Conditioning',
    'Bridal Waiting Room',
    'Professional Lighting',
  ];

  const heroImage = hallImages[hall.id];
  const quote = bookForm.date ? hallPrice(hall.id, bookForm.date) : 0;
  const conflict = useMemo(() => {
    if (!bookForm.hall || !bookForm.date || !bookForm.startTime || !bookForm.endTime) return false;
    return hasConflict(bookForm);
  }, [bookForm, hasConflict]);

  const handleScheduleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = `Schedule Tasting - ${hall.name}`;
    const body = [
      `Name: ${scheduleName}`,
      `Phone: ${schedulePhone}`,
      `Preferred Date: ${scheduleDate || 'Not provided'}`,
      `Hall: ${hall.name}`,
      `Notes: ${scheduleNote || 'None'}`,
    ].join('\n');

    const gmailComposeUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('Kuringenexus.moshi@gmail.com')}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
    setShowScheduleModal(false);
  };

  const openBookModal = () => {
    setBookForm((prev) => ({
      ...prev,
      hall: hall.name,
      quotedAmount: hallPrice(hall.id, prev.date),
    }));
    setShowBookModal(true);
  };

  const handleBookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CreateBookingInput = {
      ...bookForm,
      hall: hall.name,
      quotedAmount: hallPrice(hall.id, bookForm.date),
    };

    const result = await createPublicBooking(payload);
    toast({
      title: result.ok ? 'Booking submitted' : 'Booking failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });

    if (result.ok) {
      setShowBookModal(false);
      setBookForm({
        customerName: '',
        customerPhone: '',
        eventName: '',
        eventType: 'Wedding',
        hall: hall.name,
        date: '',
        startTime: '17:30',
        endTime: '23:59',
        expectedGuests: 0,
        quotedAmount: 0,
        notes: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />
      <div className="relative isolate">
        <div
          className="h-72 w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.72)), url('${heroImage}')`,
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col gap-3 text-white">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/80">
                <button
                  onClick={() => navigate('/#halls')}
                  className="rounded-full border border-white/30 px-3 py-1 text-white/90 transition hover:border-white hover:text-white"
                >
                  Back to halls
                </button>
                <span>{hall.alias}</span>
              </div>
              <h1 className="text-4xl font-bold">{hall.name}</h1>
              <p className="max-w-3xl text-sm text-white/80">{hall.description}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="space-y-12 px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {amenities.map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-700"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Capacity</p>
              <p className="mt-2 text-2xl font-semibold">{hall.capacity}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Starting rate</p>
              <p className="mt-2 text-2xl font-semibold text-red-600">
                {formatCurrency(Math.min(...hall.rates.map((rate) => rate.price)))}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Services</p>
              <p className="mt-2 text-lg font-semibold">Bespoke staffing and decor</p>
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-600">{hall.alias}</p>
            <h2 className="text-3xl font-bold text-slate-900">{hall.name} highlights</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {hall.rates.map((rate) => (
              <div key={rate.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{rate.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(rate.price)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            <p className="text-sm">
              Partner with our planners to configure decor, lighting, and culinary service tailored for {hall.name}.
              We align every detail to your event style before the date.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                openBookModal();
              }}
              className="rounded-full bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-red-500"
            >
              Book {hall.alias}
            </button>
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="rounded-full border border-slate-300 px-6 py-3 text-xs uppercase tracking-[0.4em] text-slate-700 transition hover:border-red-600 hover:text-red-600"
            >
              Schedule a Tasting
            </button>
          </div>
        </section>
      </main>

      {showScheduleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Schedule a Tasting</h3>
            <p className="mt-2 text-sm text-slate-600">
              Complete the form below to draft a professional tasting request email to our Moshi team:
              <span className="ml-1 font-medium text-slate-900">Kuringenexus.moshi@gmail.com</span>
            </p>

            <form className="mt-5 space-y-3" onSubmit={handleScheduleSubmit}>
              <input
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="Your full name"
                value={scheduleName}
                onChange={(event) => setScheduleName(event.target.value)}
                required
              />
              <input
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="Phone number"
                value={schedulePhone}
                onChange={(event) => setSchedulePhone(event.target.value)}
                required
              />
              <input
                type="date"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Any details about your tasting request"
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Open Gmail Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showBookModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Book {hall.name}</h3>
            <p className="mt-2 text-sm text-slate-600">
              Fill in your details. Your request is submitted to the assigned staff workflow automatically.
            </p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleBookSubmit}>
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="Customer name"
                value={bookForm.customerName}
                onChange={(event) => setBookForm((prev) => ({ ...prev, customerName: event.target.value }))}
                required
              />
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="Phone number"
                value={bookForm.customerPhone}
                onChange={(event) => setBookForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
                required
              />
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2"
                placeholder="Event name"
                value={bookForm.eventName}
                onChange={(event) => setBookForm((prev) => ({ ...prev, eventName: event.target.value }))}
                required
              />
              <select
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                value={bookForm.eventType}
                onChange={(event) => setBookForm((prev) => ({ ...prev, eventType: event.target.value }))}
              >
                <option>Wedding</option>
                <option>Conference</option>
                <option>Birthday</option>
                <option>Corporate Event</option>
                <option>Other</option>
              </select>
              <input
                type="number"
                min={1}
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                placeholder="Expected guests"
                value={bookForm.expectedGuests || ''}
                onChange={(event) => setBookForm((prev) => ({ ...prev, expectedGuests: Number(event.target.value) }))}
                required
              />
              <input
                type="date"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                value={bookForm.date}
                onChange={(event) => setBookForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
              <input
                type="time"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                value={bookForm.startTime}
                onChange={(event) => setBookForm((prev) => ({ ...prev, startTime: event.target.value }))}
                required
              />
              <input
                type="time"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
                value={bookForm.endTime}
                onChange={(event) => setBookForm((prev) => ({ ...prev, endTime: event.target.value }))}
                required
              />
              <input
                className="h-11 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-700"
                value={quote > 0 ? formatCurrency(quote) : 'Select date to calculate quote'}
                readOnly
              />
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                rows={3}
                placeholder="Additional notes"
                value={bookForm.notes}
                onChange={(event) => setBookForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="md:col-span-2">
                <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>
                  {conflict ? 'Selected slot is already occupied.' : 'Selected slot is available.'}
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Hall;
