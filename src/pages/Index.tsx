import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import {
  beverageList,
  beverageNotes,
  cakeOptions,
  conferencePackages,
  decorationPackages,
  externalServices,
  hallCatalog,
  muhimuNotes,
  taratibuChecklist,
} from '@/lib/landingData';

const HALL_OPTIONS = [
  { id: 'witness', label: 'Witness Hall (Pax 500-700)', name: 'Witness Hall', capacityMax: 700 },
  { id: 'kilimanjaro', label: 'Kilimanjaro Hall (200-400)', name: 'Kilimanjaro Hall', capacityMax: 400 },
  { id: 'hall-d', label: 'Hall D (30-60)', name: 'Hall D', capacityMax: 60 },
] as const;
const STEPS = ['Hall', 'Date & Time', 'Details', 'Confirm'] as const;
const TABS = ['Packages', 'Catering', 'Drinks', 'Policies'] as const;
type DetailTab = (typeof TABS)[number];
type HallOption = (typeof HALL_OPTIONS)[number];

const IMAGES: Record<string, string> = {
  hero: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=2000&q=80',
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
};

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
  const [tab, setTab] = useState<DetailTab>('Packages');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const selected = HALL_OPTIONS.find((item) => item.name === form.hall);
    if (!selected || !form.date) return;
    setForm((prev) => ({ ...prev, quotedAmount: hallPrice(selected.id, form.date) }));
  }, [form.hall, form.date]);

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const quote = selectedHall && form.date ? hallPrice(selectedHall.id, form.date) : 0;
  const conflict = form.hall && form.date ? hasConflict(form) : false;

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPublicBooking(form);
    toast({ title: result.ok ? 'Booking submitted' : 'Booking failed', description: result.message, variant: result.ok ? 'default' : 'destructive' });
    if (result.ok) {
      setForm(INITIAL_BOOKING);
      setStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] text-[#2B2B2B]" style={{ fontFamily: '"Manrope", "Segoe UI", sans-serif' }}>
      <header className="sticky top-0 z-40 border-b border-[#c6a75e33] bg-[#f8f4efed] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-black" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Kuringe <span className="text-[#6B1E2D]">Halls</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="outline" size="sm" className="rounded-full border-[#6B1E2D]/30 text-[#6B1E2D]">Staff Login</Button></Link>
            <a href="#book-now"><Button size="sm" className="rounded-full bg-[#6B1E2D] px-5 hover:bg-[#571926]">Book Your Date</Button></a>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-4 py-24 md:py-32">
        <img src={IMAGES.hero} alt="Luxury wedding setup" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="self-center text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Kuringe Halls, Dar es Salaam</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              Celebrate Your Forever
              <br />
              In Timeless Elegance
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/85">An exclusive wedding venue crafted for unforgettable moments.</p>
            <div className="mt-8 flex gap-3">
              <a href="#book-now"><Button className="rounded-full bg-[#6B1E2D] px-7 py-6 uppercase tracking-[0.15em] hover:bg-[#571926]">Book Your Date</Button></a>
              <a href="#halls"><Button variant="outline" className="rounded-full border-white/40 bg-white/10 px-7 py-6 text-white hover:bg-white/20">Explore Halls</Button></a>
            </div>
          </div>

          <form id="book-now" onSubmit={onSubmit} className="rounded-[22px] border border-white/45 bg-white/82 p-6 shadow-[0_20px_65px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Reserve Your Date</p>
              <CalendarDays className="h-5 w-5 text-[#6B1E2D]" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">{STEPS.map((s, i) => <button key={s} type="button" onClick={() => i <= step && setStep(i)} className={`rounded-xl px-1 py-2 text-xs font-semibold ${i <= step ? 'bg-[#6B1E2D] text-white' : 'bg-[#f2ebe1] text-[#7c6e56]'}`}>{s}</button>)}</div>
            <div className="mt-4 space-y-3 text-sm">
              {step === 0 && <>
                <select className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" value={form.hall} onChange={(e) => onChange('hall', e.target.value)}><option value="">Choose Hall</option>{HALL_OPTIONS.map((h) => <option key={h.id} value={h.name}>{h.label}</option>)}</select>
                <select className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}><option>Wedding</option><option>Conference</option><option>Birthday</option><option>Corporate Event</option><option>Other</option></select>
                <input type="number" className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" placeholder="Expected Guests" value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
              </>}
              {step === 1 && <div className="grid gap-3 sm:grid-cols-2">
                <input type="date" className="h-11 rounded-xl border border-[#d7ccb8] bg-white px-3" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
                <input type="time" className="h-11 rounded-xl border border-[#d7ccb8] bg-white px-3" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
                <input type="time" className="h-11 rounded-xl border border-[#d7ccb8] bg-white px-3 sm:col-span-2" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
              </div>}
              {step === 2 && <>
                <input className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" placeholder="Customer Name" value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
                <input className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" placeholder="Phone Number" value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
                <input className="h-11 w-full rounded-xl border border-[#d7ccb8] bg-white px-3" placeholder="Event Name" value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />
                <textarea className="w-full rounded-xl border border-[#d7ccb8] bg-white px-3 py-2" rows={3} placeholder="Additional Notes" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
              </>}
              {step === 3 && <div className="space-y-2 rounded-xl border border-[#e7dcc9] bg-[#fffdf9] p-3">
                <p className="flex justify-between"><span className="text-[#6e6e6e]">Hall</span><span className="font-semibold">{form.hall || '-'}</span></p>
                <p className="flex justify-between"><span className="text-[#6e6e6e]">Date</span><span className="font-semibold">{form.date || '-'}</span></p>
                <p className="flex justify-between"><span className="text-[#6e6e6e]">Quote</span><span className="font-bold text-[#6B1E2D]">{quote > 0 ? formatTZS(quote) : 'Select hall + date'}</span></p>
                {selectedHall && form.expectedGuests > selectedHall.capacityMax ? <p className="text-xs text-red-600">Guest count exceeds hall capacity.</p> : null}
                <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>{conflict ? 'Selected slot already occupied.' : 'Selected slot is available.'}</p>
              </div>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((p) => Math.max(0, p - 1))} className="rounded-full border-[#6B1E2D]/30 text-[#6B1E2D]"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>
              {step < 3
                ? <Button type="button" disabled={!canNext} onClick={() => setStep((p) => Math.min(3, p + 1))} className="rounded-full bg-[#6B1E2D] hover:bg-[#571926]">Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
                : <Button type="submit" className="rounded-full bg-[#6B1E2D] hover:bg-[#571926]">Submit Booking</Button>}
            </div>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-4 pb-24">
        <section id="halls">
          <h2 className="text-center text-4xl font-bold md:text-5xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Featured Halls</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {hallCatalog.map((hall) => (
              <article key={hall.id} className="group overflow-hidden rounded-[20px] border border-[#d8c8aa] bg-white shadow-[0_22px_45px_-28px_rgba(0,0,0,0.35)] transition hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden">
                  <img src={IMAGES[hall.id]} alt={hall.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/75">{hall.capacity}</p>
                    <h3 className="mt-1 text-2xl font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{hall.name}</h3>
                  </div>
                </div>
                <div className="p-5 text-sm">
                  <p className="text-[#5d5d5d]">{hall.description}</p>
                  <a href="#book-now" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#6B1E2D]">View Details <ArrowRight className="h-4 w-4" /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80'].map((src) => (
            <img key={src} src={src} alt="Wedding gallery" className="h-56 w-full rounded-2xl object-cover transition hover:scale-[1.02]" />
          ))}
        </section>

        <section className="rounded-[24px] bg-white p-6 md:p-8" id="details">
          <div className="mb-5 flex flex-wrap gap-2">{TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === item ? 'bg-[#6B1E2D] text-white' : 'bg-[#efe5d8] text-[#6b5a3d]'}`}>{item}</button>)}</div>
          {tab === 'Packages' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{decorationPackages.slice(0, 4).map((p) => <p key={p.title} className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>{p.title.split('-')[0].trim()}</span><span className="font-semibold text-[#6B1E2D]">{formatTZS(p.price)}</span></p>)}</div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{conferencePackages.map((p) => <p key={p.attendees} className="mb-2 rounded-lg bg-white px-3 py-2"><span className="font-semibold">{p.attendees}</span><br /><span className="text-xs text-[#6B1E2D]">{p.pricePoint}</span></p>)}</div>
          </div>}
          {tab === 'Catering' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{cakeOptions.map((i) => <p key={i.title} className="mb-2 flex justify-between rounded-lg bg-white px-3 py-2"><span>{i.title}</span><span className="font-semibold text-[#6B1E2D]">{i.pricePoint}</span></p>)}</div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{externalServices.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}</div>
          </div>}
          {tab === 'Drinks' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{beverageList.slice(0, 10).map((i) => <p key={i.name} className="mb-2 flex justify-between rounded-lg bg-white px-3 py-2"><span>{i.name}</span><span className="font-semibold text-[#6B1E2D]">{formatTZS(i.price)}</span></p>)}</div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{beverageNotes.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}</div>
          </div>}
          {tab === 'Policies' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{taratibuChecklist.slice(0, 5).map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}</div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{muhimuNotes.slice(0, 5).map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}</div>
          </div>}
        </section>

        <section className="rounded-[24px] bg-[#F2EAE0] p-8">
          <h2 className="text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Trusted by 500+ Events Since 2018</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Amina & Baraka', 'Neema & Collins', 'Mariam & Kelvin'].map((name) => (
              <div key={name} className="rounded-xl border border-[#dbcbb2] bg-white p-4">
                <div className="mb-2 flex gap-1 text-[#c6a75e]">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-current" />)}</div>
                <p className="text-sm text-[#4f4f4f]">Elegant venue, smooth coordination, and a premium guest experience from start to finish.</p>
                <p className="mt-3 text-sm font-semibold">{name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#4f1522] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Kuringe Halls</p>
            <p className="text-sm text-white/75">Luxury Wedding & Event Venue</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/85">
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#c6a75e]" /> +255 717 000 000</span>
            <a href="#book-now" className="inline-flex items-center gap-2 font-semibold hover:text-[#c6a75e]">Reserve Now <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
