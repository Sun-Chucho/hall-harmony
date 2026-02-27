import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import { hallCatalog } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';

const HALL_OPTIONS = [
  { id: 'witness', label: 'Witness Hall (Pax 500-700)', name: 'Witness Hall', capacityMax: 700 },
  { id: 'kilimanjaro', label: 'Kilimanjaro Hall (200-400)', name: 'Kilimanjaro Hall', capacityMax: 400 },
  { id: 'hall-d', label: 'Hall D (30-60)', name: 'Hall D', capacityMax: 60 },
] as const;

const STEPS = ['Hall', 'Date & Time', 'Details', 'Confirm'] as const;
type HallOption = (typeof HALL_OPTIONS)[number];
type ConferenceTabKey = '30-50' | '100-200' | '300-500';

const IMAGES: Record<string, string> = {
  hero: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=2000&q=80',
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
};

const HALL_RENTAL_RATES = [
  {
    name: 'Witness Hall',
    capacity: '500-700 Guests',
    rows: [
      { day: 'Saturday', price: 3835000 },
      { day: 'Mon & Tue', price: 1534000 },
      { day: 'Wed-Fri & Sun', price: 2301000 },
    ],
  },
  {
    name: 'Kilimanjaro Hall',
    capacity: '200-400 Guests',
    rows: [
      { day: 'Saturday', price: 2301000 },
      { day: 'Mon & Tue', price: 1227000 },
      { day: 'Wed-Fri & Sun', price: 1534000 },
    ],
  },
  {
    name: 'Hall D',
    capacity: '30-60 Guests',
    rows: [
      { day: 'Saturday', price: 236000 },
      { day: 'Mon & Tue', price: 177000 },
      { day: 'Wed-Fri & Sun', price: 236000 },
    ],
  },
];

const DECORATION_PACKAGES = [
  {
    name: 'Standard',
    price: 2000000,
    features: [
      'Stage decoration',
      'Photobooth banner',
      'Welcome note board',
      'Entrance decor',
      'Table decor set',
      'Dance floor sticker',
    ],
  },
  {
    name: 'VIP',
    price: 5000000,
    features: [
      'Stage styling',
      'Chrome seating set',
      'Walkway sticker',
      'Fog machine',
      'Premium floral setup',
      'Signature table styling',
    ],
  },
  {
    name: 'Executive',
    price: 8000000,
    features: [
      'LED stage setup',
      'First dance effects',
      'Chandelier package',
      'Custom truss branding',
      'Crystal glassware set',
      'Designer table centerpieces',
    ],
  },
  {
    name: 'VVIP',
    price: 15000000,
    features: [
      'Full hall floral theme',
      'Large truss and LED setup',
      'Dual fog machines',
      'Premium candle collection',
      'Laser light effects',
      'High-impact stage reveal',
    ],
  },
  {
    name: 'Royal',
    price: 20000000,
    features: [
      'Luxury full-hall concept',
      'Advanced LED + truss set',
      'Four fog machines',
      'Exclusive fire walk set',
      'High-end lighting choreography',
      'Grand entrance concept',
    ],
  },
];

const CONFERENCE_PACKAGES = [
  {
    key: '30-50' as ConferenceTabKey,
    label: '30-50 Guests',
    plans: [
      { name: 'Full Package', price: 55000, features: ['Hall', 'Setup', 'P.A System', 'Breakfast', 'Lunch', 'Soft Drinks'] },
      { name: 'Standard', price: 35000, features: ['Hall', 'Setup', 'P.A System', 'Stationery'] },
      { name: 'Basic', price: 20000, features: ['Hall', 'Setup'] },
    ],
  },
  {
    key: '100-200' as ConferenceTabKey,
    label: '100-200 Guests',
    plans: [
      { name: 'Full Package', price: 50000, features: ['Hall', 'Setup', 'P.A System', 'Projector', 'Breakfast', 'Lunch'] },
      { name: 'Standard', price: 40000, features: ['Hall', 'Setup', 'P.A System', 'Projector', 'Stationery'] },
      { name: 'Basic', price: 30000, features: ['Hall', 'Setup', 'P.A System', 'Projector'] },
    ],
  },
  {
    key: '300-500' as ConferenceTabKey,
    label: '300-500 Guests',
    plans: [
      { name: 'Full Package', price: 45000, features: ['Hall', 'Setup', 'P.A System', 'Projector', 'Breakfast', 'Lunch'] },
      { name: 'Standard', price: 40000, features: ['Hall', 'Setup', 'P.A System', 'Projector', 'Soft Drinks'] },
      { name: 'Basic', price: 35000, features: ['Hall', 'Setup', 'P.A System', 'Projector'] },
    ],
  },
];

const PACKAGES_PREVIEW = [
  { name: 'Standard', price: 2000000, note: 'Elegant essentials for intimate events.' },
  { name: 'VIP', price: 5000000, note: 'Premium setup with upgraded visuals.' },
  { name: 'Executive', price: 8000000, note: 'High-end design for signature weddings.' },
];

const CATERING_PREVIEW = [
  'Starter options including samosa and mtori',
  'Buffet menus with chicken, pilau, and salads',
  'Flexible guest-based menu planning',
];

const DRINKS_PREVIEW = [
  { name: 'Local Beer', price: 2500 },
  { name: 'Soda', price: 1000 },
  { name: 'AZAM Juice', price: 4000 },
  { name: 'Imported Beer', price: 4000 },
];

const POLICIES_PREVIEW = [
  'Booking is confirmed after required initial payment.',
  'Final balance is settled before event date.',
  'Event timing and venue usage policies apply.',
];

const INITIAL_BOOKING: CreateBookingInput = {
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
};

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

function hallPrice(hallId: HallOption['id'], isoDate: string): number {
  if (!isoDate) return 0;
  const day = new Date(isoDate).getDay();
  if (hallId === 'witness') return day === 6 ? 3835000 : day === 1 || day === 2 ? 1534000 : 2301000;
  if (hallId === 'kilimanjaro') return day === 6 ? 2301000 : day === 1 || day === 2 ? 1227000 : 1534000;
  return day === 1 || day === 2 ? 177000 : 236000;
}

export default function Index() {
  const { createPublicBooking, hasConflict } = useBookings();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateBookingInput>(INITIAL_BOOKING);
  const [step, setStep] = useState(0);
  const [conferenceTab, setConferenceTab] = useState<ConferenceTabKey>('30-50');

  useEffect(() => {
    const selected = HALL_OPTIONS.find((item) => item.name === form.hall);
    if (!selected || !form.date) return;
    setForm((prev) => ({ ...prev, quotedAmount: hallPrice(selected.id, form.date) }));
  }, [form.hall, form.date]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const quote = selectedHall && form.date ? hallPrice(selectedHall.id, form.date) : 0;
  const conflict = form.hall && form.date ? hasConflict(form) : false;
  const activeConference = CONFERENCE_PACKAGES.find((item) => item.key === conferenceTab) ?? CONFERENCE_PACKAGES[0];

  const canNext = step === 0
    ? Boolean(form.hall && form.expectedGuests > 0)
    : step === 1
      ? Boolean(form.date && form.startTime && form.endTime)
      : step === 2
        ? Boolean(form.customerName && form.customerPhone && form.eventName)
        : true;

  const onChange = <K extends keyof CreateBookingInput>(key: K, value: CreateBookingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await createPublicBooking(form);
    toast({
      title: result.ok ? 'Booking submitted' : 'Booking failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    if (result.ok) {
      setForm(INITIAL_BOOKING);
      setStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1B1B1B]">
      <PublicNavbar ctaLabel="Book Your Date" />

      <section className="relative isolate overflow-hidden px-4 py-24 md:py-32">
        <img src={IMAGES.hero} alt="Luxury wedding setup" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="self-center text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/75">Kuringe Halls, Moshi</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">
              Celebrate Your Forever
              <br />
              In Timeless Elegance
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/85">A refined venue experience built for weddings, conferences, and milestone events.</p>
            <div className="mt-8 flex gap-3">
              <Link to="/booking"><Button className="rounded-full bg-white px-7 py-6 uppercase tracking-[0.15em] text-black hover:bg-[#f3f3f3]">Reserve Your Date</Button></Link>
              <a href="#halls"><Button variant="outline" className="rounded-full border-white/40 bg-white/10 px-7 py-6 text-white hover:bg-white/20">Explore Halls</Button></a>
            </div>
          </div>

          <form id="book-now" onSubmit={onSubmit} className="rounded-2xl border border-white/45 bg-white/88 p-8 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#111111]">Reserve Your Date</p>
              <CalendarDays className="h-5 w-5 text-[#C6A75E]" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  className={`rounded-xl px-1 py-2 text-xs font-semibold ${index <= step ? 'bg-[#1f1f1f] text-white' : 'bg-[#f5f2ec] text-[#6f685a]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {step === 0 && (
                <>
                  <select className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" value={form.hall} onChange={(e) => onChange('hall', e.target.value)}><option value="">Choose Hall</option>{HALL_OPTIONS.map((h) => <option key={h.id} value={h.name}>{h.label}</option>)}</select>
                  <select className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}><option>Wedding</option><option>Conference</option><option>Birthday</option><option>Corporate Event</option><option>Other</option></select>
                  <input type="number" className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Expected Guests" value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
                </>
              )}
              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="date" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
                  <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
                  <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3 sm:col-span-2" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
                </div>
              )}
              {step === 2 && (
                <>
                  <input className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Customer Name" value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
                  <input className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Phone Number" value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
                  <input className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Event Name" value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />
                  <textarea className="w-full rounded-xl border border-[#e4ded1] bg-white px-3 py-2" rows={3} placeholder="Additional Notes" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
                </>
              )}
              {step === 3 && (
                <div className="space-y-2 rounded-xl border border-[#ece7dc] bg-[#fffdfa] p-3">
                  <p className="flex justify-between"><span className="text-[#6e6e6e]">Hall</span><span className="font-semibold">{form.hall || '-'}</span></p>
                  <p className="flex justify-between"><span className="text-[#6e6e6e]">Date</span><span className="font-semibold">{form.date || '-'}</span></p>
                  <p className="flex justify-between"><span className="text-[#6e6e6e]">Quote</span><span className="font-semibold text-[#C6A75E]">{quote > 0 ? formatTZS(quote) : 'Select hall + date'}</span></p>
                  {selectedHall && form.expectedGuests > selectedHall.capacityMax ? <p className="text-xs text-red-600">Guest count exceeds hall capacity.</p> : null}
                  <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>{conflict ? 'Selected slot already occupied.' : 'Selected slot is available.'}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((prev) => Math.max(0, prev - 1))} className="rounded-full border-[#d9cfb9] text-[#5b5345]"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>
              {step < 3
                ? <Button type="button" disabled={!canNext} onClick={() => setStep((prev) => Math.min(3, prev + 1))} className="rounded-full bg-[#1f1f1f] hover:bg-[#2c2c2c]">Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
                : <Button type="submit" className="rounded-full bg-[#1f1f1f] hover:bg-[#2c2c2c]">Submit Booking</Button>}
            </div>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-24">
        <section id="halls" className="reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Featured Halls</h2>
          <p className="mt-3 text-center text-sm text-[#7b7b7b]">Explore venue styles before selecting your package and schedule.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {hallCatalog.map((hall) => (
              <article key={hall.id} className="group overflow-hidden rounded-2xl border border-[#eeeeee] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
                <div className="relative h-64 overflow-hidden">
                  <img src={IMAGES[hall.id]} alt={hall.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs tracking-[0.2em] text-white/75">{hall.capacity}</p>
                    <h3 className="mt-1 text-2xl font-semibold">{hall.name}</h3>
                  </div>
                </div>
                <div className="p-6 text-sm">
                  <p className="text-[#5d5d5d]">{hall.description}</p>
                  <Link to={`/halls/${hall.id}`} className="mt-4 inline-flex items-center gap-2 font-semibold text-[#1f1f1f]">View Hall <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Hall Rental Rates</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Clear venue pricing by day, structured for quick comparison.</p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {HALL_RENTAL_RATES.map((hall) => (
              <article key={hall.name} className="rounded-xl border border-[#EEEEEE] bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-xl font-semibold text-[#111111]">{hall.name}</h3>
                <p className="mt-1 text-sm text-[#8a8a8a]">{hall.capacity}</p>
                <div className="my-5 h-px bg-[#F2F2F2]" />
                <div>
                  {hall.rows.map((row) => (
                    <div key={`${hall.name}-${row.day}`} className="flex items-center justify-between border-b border-[#F2F2F2] py-[14px] text-sm last:border-b-0">
                      <span>{row.day}</span>
                      <span className="font-semibold text-[#C6A75E]">{formatTZS(row.price)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Wedding Decoration Packages</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Choose a package tier with organized features and transparent pricing.</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {DECORATION_PACKAGES.map((pkg) => {
              const isHighlighted = pkg.name === 'Executive';
              return (
                <article
                  key={pkg.name}
                  className={`rounded-2xl border bg-white px-8 py-10 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] ${
                    isHighlighted ? 'scale-[1.03] border-2 border-[#C6A75E]' : 'border-[#EEEEEE]'
                  }`}
                >
                  <h3 className="text-sm uppercase tracking-[0.12em] text-[#111111]">{pkg.name}</h3>
                  <div className="mx-auto mt-3 h-px w-10 bg-[#C6A75E]" />
                  <p className="mb-6 mt-4 text-[32px] font-bold text-[#111111]">{formatTZS(pkg.price)}</p>
                  <ul className="space-y-3 text-left">
                    {pkg.features.map((feature) => (
                      <li key={`${pkg.name}-${feature}`} className="flex items-start gap-[10px] text-[15px] text-[#2e2e2e]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A75E]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Conference Packages</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Select a guest range to compare package options side by side.</p>

          <div className="mx-auto mb-10 flex max-w-3xl justify-center gap-2 border-b border-[#ededed]">
            {CONFERENCE_PACKAGES.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setConferenceTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition ${conferenceTab === tab.key ? 'border-b-2 border-[#C6A75E] text-[#111111]' : 'text-[#7a7a7a]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {activeConference.plans.map((plan) => (
              <article key={`${activeConference.key}-${plan.name}`} className="rounded-xl border border-[#EEEEEE] bg-white p-8">
                <h3 className="text-lg font-semibold text-[#111111]">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold text-[#111111]">{formatTZS(plan.price)} <span className="text-sm font-medium text-[#777777]">per person</span></p>
                <div className="my-5 h-px bg-[#F2F2F2]" />
                <ul className="space-y-[10px]">
                  {plan.features.map((feature) => (
                    <li key={`${plan.name}-${feature}`} className="flex items-start gap-[10px] text-sm text-[#2e2e2e]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A75E]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="packages" className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Packages</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Decoration tiers available in full detail on the Packages page.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PACKAGES_PREVIEW.map((pkg) => (
              <article key={pkg.name} className="rounded-xl border border-[#EEEEEE] bg-white p-8">
                <h3 className="text-lg font-semibold text-[#111111]">{pkg.name}</h3>
                <p className="mt-3 text-2xl font-bold text-[#111111]">{formatTZS(pkg.price)}</p>
                <p className="mt-3 text-sm text-[#6d6d6d]">{pkg.note}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/packages">
              <Button className="rounded-full bg-[#1f1f1f] px-7 text-white hover:bg-[#2c2c2c]">View All Packages</Button>
            </Link>
          </div>
        </section>

        <section id="catering" className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Catering</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Food service options for weddings, conferences, and private functions.</p>
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-8">
            <ul className="space-y-3">
              {CATERING_PREVIEW.map((item) => (
                <li key={item} className="flex items-start gap-[10px] text-sm text-[#2e2e2e]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A75E]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 text-center">
            <Link to="/pricing">
              <Button className="rounded-full bg-[#1f1f1f] px-7 text-white hover:bg-[#2c2c2c]">View Catering Details</Button>
            </Link>
          </div>
        </section>

        <section id="drinks" className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Drinks</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Popular beverage rates shown below. Full menu available in pricing details.</p>
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {DRINKS_PREVIEW.map((drink) => (
                <div key={drink.name} className="flex items-center justify-between border-b border-[#F2F2F2] py-[14px] text-sm last:border-b-0">
                  <span>{drink.name}</span>
                  <span className="font-semibold text-[#C6A75E]">{formatTZS(drink.price)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/pricing">
              <Button className="rounded-full bg-[#1f1f1f] px-7 text-white hover:bg-[#2c2c2c]">View Full Drinks Menu</Button>
            </Link>
          </div>
        </section>

        <section id="policies" className="mt-32 reveal-on-scroll">
          <h2 className="text-center text-4xl font-bold md:text-5xl">Policies</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Key booking rules and compliance guidance before event confirmation.</p>
          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-8">
            <ul className="space-y-3">
              {POLICIES_PREVIEW.map((item) => (
                <li key={item} className="flex items-start gap-[10px] text-sm text-[#2e2e2e]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A75E]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/taratibu">
              <Button variant="outline" className="rounded-full border-[#d8d8d8] px-7">View Rules</Button>
            </Link>
            <Link to="/muhimu">
              <Button className="rounded-full bg-[#1f1f1f] px-7 text-white hover:bg-[#2c2c2c]">View Important Notes</Button>
            </Link>
          </div>
        </section>

        <section className="mt-32 rounded-2xl bg-[#f4f0e8] p-8 reveal-on-scroll">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Trusted by 500+ Events Since 2018</h2>
          <p className="mb-12 mt-3 text-center text-sm text-[#7b7b7b]">Consistent service quality for families, companies, and institutions.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {['Amina & Baraka', 'Neema & Collins', 'Mariam & Kelvin'].map((name) => (
              <article key={name} className="rounded-xl border border-[#e7dfd0] bg-white p-5">
                <div className="mb-2 flex gap-1 text-[#C6A75E]">{[1, 2, 3, 4, 5].map((index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
                <p className="text-sm text-[#4f4f4f]">Elegant venue, smooth coordination, and a premium guest experience from start to finish.</p>
                <p className="mt-3 text-sm font-semibold">{name}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#191919] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-2xl font-bold">Kuringe Halls</p>
            <p className="text-sm text-white/75">Luxury Wedding & Event Venue</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/85">
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#C6A75E]" /> +255 717 000 000</span>
            <Link to="/booking" className="inline-flex items-center gap-2 font-semibold text-[#C6A75E]">Reserve Now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
