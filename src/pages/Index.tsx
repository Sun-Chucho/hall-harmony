import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, FileText, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import {
  beverageList,
  beverageNotes,
  cakeOptions,
  clientDeclaration,
  conferencePackages,
  decorationPackages,
  externalServices,
  hallCatalog,
  muhimuNotes,
  taratibuChecklist,
} from '@/lib/landingData';

const HALL_OPTIONS = [
  { id: 'witness', label: 'Witness Hall (Pax 500-700)', name: 'Witness Hall', capacityMax: 700 },
  {
    id: 'kilimanjaro',
    label: 'Kilimanjaro Hall (Hall B 200-300) & Garden (300-400)',
    name: 'Kilimanjaro Hall',
    capacityMax: 400,
  },
  { id: 'hall-d', label: 'Hall D (Capacity 30-60)', name: 'Hall D', capacityMax: 60 },
] as const;

type HallOption = (typeof HALL_OPTIONS)[number];

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
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function getHallPriceByDate(hallId: HallOption['id'], isoDate: string): number {
  if (!isoDate) return 0;
  const day = new Date(isoDate).getDay();

  if (hallId === 'witness') {
    if (day === 6) return 3835000;
    if (day === 1 || day === 2) return 1534000;
    return 2301000;
  }

  if (hallId === 'kilimanjaro') {
    if (day === 6) return 2301000;
    if (day === 1 || day === 2) return 1227000;
    return 1534000;
  }

  if (day === 1 || day === 2) return 177000;
  return 236000;
}

export default function Index() {
  const { createPublicBooking, hasConflict } = useBookings();
  const { toast } = useToast();

  const [form, setForm] = useState<CreateBookingInput>(INITIAL_BOOKING);

  useEffect(() => {
    const selected = HALL_OPTIONS.find((item) => item.name === form.hall);
    if (!selected || !form.date) return;
    const amount = getHallPriceByDate(selected.id, form.date);
    setForm((prev) => ({ ...prev, quotedAmount: amount }));
  }, [form.hall, form.date]);

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const currentQuote = selectedHall && form.date ? getHallPriceByDate(selectedHall.id, form.date) : 0;
  const conflict = form.hall && form.date && form.startTime && form.endTime ? hasConflict(form) : false;

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
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-black tracking-tight text-slate-900">
            Kuringe <span className="text-[#a80c10]">Halls</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/pricing" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:inline">
              Bei Zetu
            </Link>
            <Link to="/taratibu" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:inline">
              Taratibu
            </Link>
            <Link to="/muhimu" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:inline">
              Muhimu
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Staff Login</Button>
            </Link>
            <a href="#book-now">
              <Button size="sm" className="bg-[#a80c10] hover:bg-[#8e0a0d]">Book Now</Button>
            </a>
          </div>
        </div>
      </header>

      <section className="bg-[linear-gradient(135deg,#0f172a,#1e293b_55%,#a80c10)] px-4 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Kuringe Halls Booking Portal</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              Weka Booking Yako Moja Kwa Moja Kwenye Mfumo
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
              Chagua ukumbi, tarehe, na weka taarifa za tukio. Booking ikiwasilishwa hapa inaingia moja kwa moja
              kwenye mfumo wa staff kwa mapitio na uthibitisho.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Ukumbi</p>
                <p className="mt-1 text-xl font-bold">3</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Uwezo</p>
                <p className="mt-1 text-xl font-bold">30 - 700</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">VAT</p>
                <p className="mt-1 text-xl font-bold">18%</p>
              </div>
            </div>
          </div>

          <form id="book-now" onSubmit={onSubmit} className="rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Fomu ya Booking</h2>
              <CalendarDays className="h-5 w-5 text-[#a80c10]" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Jina la mteja" value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Namba ya simu" value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Jina la tukio" value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />
              <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}>
                <option>Wedding</option>
                <option>Conference</option>
                <option>Birthday</option>
                <option>Corporate Event</option>
                <option>Other</option>
              </select>
              <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" value={form.hall} onChange={(e) => onChange('hall', e.target.value)}>
                <option value="">Chagua ukumbi</option>
                {HALL_OPTIONS.map((hall) => (
                  <option key={hall.id} value={hall.name}>{hall.label}</option>
                ))}
              </select>
              <input type="date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
              <input type="number" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Idadi ya watu" value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
              <input type="time" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
              <input type="time" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
              <textarea className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Maelezo ya ziada" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-700">Makadirio ya ukumbi:</p>
              <p className="mt-1 text-lg font-bold text-[#a80c10]">{currentQuote > 0 ? formatTZS(currentQuote) : 'Chagua ukumbi na tarehe'}</p>
              {selectedHall && form.expectedGuests > selectedHall.capacityMax ? (
                <p className="mt-1 text-xs text-rose-600">Idadi ya watu imezidi uwezo wa ukumbi uliyochagua.</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">Bei za huduma nyingine na VAT zitaongezwa kulingana na chaguo zako.</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {conflict ? 'Muda umechukuliwa' : 'Hakuna conflict'}
              </div>
              <Button type="submit" className="bg-[#a80c10] hover:bg-[#8e0a0d]">Wasilisha Booking</Button>
            </div>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-[#a80c10]" />
            <h2 className="text-2xl font-bold">Bei ya Kukodi Ukumbi</h2>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {hallCatalog.map((hall) => (
              <div key={hall.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{hall.alias}</p>
                <h3 className="mt-1 text-lg font-bold">{hall.name}</h3>
                <p className="text-sm text-slate-600">{hall.capacity}</p>
                <div className="mt-3 space-y-2 text-sm">
                  {hall.rates.map((rate) => (
                    <div key={rate.label} className="flex items-center justify-between gap-3">
                      <span className="text-slate-700">{rate.label}</span>
                      <span className="font-semibold text-slate-900">{formatTZS(rate.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Taratibu za Ukumbi</h2>
            <div className="mt-4 space-y-3 text-sm">
              {taratibuChecklist.map((item) => (
                <div key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#a80c10]" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Muhimu</h2>
            <div className="mt-4 space-y-3 text-sm">
              {muhimuNotes.map((note) => (
                <div key={note} className="flex gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#a80c10]" />
                  <p>{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm">
              <p>{clientDeclaration}</p>
              <p className="mt-2 text-xs text-slate-500">Saini: _____________________ Tarehe: _____________________</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Keki (Ndafu)</h2>
            <div className="mt-4 space-y-3 text-sm">
              {cakeOptions.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>{item.title}</span>
                  <span className="font-semibold">{item.pricePoint}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Huduma Nyingine Nje ya Ukumbi</h2>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {externalServices.map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Vinywaji</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {beverageList.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span>{item.name}</span>
                <span className="font-semibold">{formatTZS(item.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
              {beverageNotes.map((note) => (
                <p key={note}>- {note}</p>
              ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Gharama za Mapambo</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {decorationPackages.map((pkg) => (
              <div key={pkg.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-bold">{pkg.title}</h3>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {pkg.highlights.map((h) => (
                    <li key={h}>- {h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Conference Package</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {conferencePackages.map((pkg) => (
              <div key={pkg.attendees} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-bold">{pkg.attendees}</h3>
                <p className="mt-1 text-sm font-semibold text-[#a80c10]">{pkg.pricePoint}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {pkg.amenities.map((amenity) => (
                    <li key={amenity}>- {amenity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-bold text-slate-900">Kuringe Halls</p>
            <p className="text-sm text-slate-500">Moshi Halls Management System</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#book-now" className="inline-flex items-center gap-2 rounded-full bg-[#a80c10] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Book Now
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Phone className="h-4 w-4" /> +255 717 000 000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
