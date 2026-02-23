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
import { hallCatalog } from '@/lib/landingData';

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

const RENTAL_RATE_CARDS = [
  {
    hall: 'BEI YA KUKODI UKUMBI (WITNESS HALL PAX 500-700)',
    rates: [
      { day: 'JUMAMOSI', priceLabel: 'TSH 3835,000/=' },
      { day: 'JUMATATU NA JUMANNE', priceLabel: 'TSH 1,534,000/=' },
      { day: 'J,TANO, ALHAMISI, IJUMAA NA JPL', priceLabel: 'TSH 2,301,000/=' },
    ],
  },
  {
    hall: 'BEI YA KUKODI UKUMBI WA KILIMANJARO HALL (HALL B 200-300 & GARDEN 300-400)',
    rates: [
      { day: 'JUMAMOSI', priceLabel: 'TSH 2,301,000/=' },
      { day: 'JUMATATU NA JUMANNE', priceLabel: 'TSH 1,227,000/=' },
      { day: 'J,TANO, ALHAMISI, IJUMAA NA JPL', priceLabel: 'TSH 1,534,000/=' },
    ],
  },
  {
    hall: 'BEI YA KUKODI UKUMBI (HALL D CAPACITY 30-60 PEOPLE)',
    rates: [
      { day: 'JUMATATU NA JUMANNE', priceLabel: 'TSH 177,000/=' },
      { day: 'J,TANO, ALH, IJUM, JMOS, JPL', priceLabel: 'TSH 236,000/=' },
    ],
  },
];

const TARATIBU_PRIMARY = [
  'MEZA NA VITI VITATOLEWA KULINGANA NA IDADI YA WATU WALIOLIPWA CHAKULA.',
  'UKUMBI UNA PARKING YA KUTOSHA NA ULINZI WA UHAKIKA.',
  'BOOKING INAKAMILIKA PALE TU MALIPO YA AWALI YANAPOFANYIKA NUSU AU MALIPO YOTE YA KUKODI UKUMBI.',
  'STANDBY GENERATOR IPO ENDAPO UMEME UTAKATIKA.',
  'SHEREHE MWISHO SAA SITA (00:00PM) KWA MUJIBU WA SHERIA, MC AZINGATIE MUDA.',
  'MALIPO YA MWISHO YAFANYIKE WIKI MOJA KABLA YA TAREHE YA SHEREHE (WASILIANA NA OFISI KWA MWONGOZO WA MALIPO).',
  'KUNA CHUMBA MAALUM CHA MAHARUSI (WAITING ROOM) CHA KUSUBIRI MUDA WA KUINGIA UKUMBINI.',
];

const MUHIMU_PRIMARY = [
  'SHEREHE ISIPOFANYIKA ADA YA UKUMBI HAITARUDISHWA HADI PALE ATAKAPOPATIKANA MTEJA MWINGINE KWA TAREHE HIYO NDIPO UTAREJESHEWA 70% YA KIASI KILICHOLIPWA NA ENDAPO MTEJA MWINGINE HATAPATIKANA KWA TAREHE HIYO BASI HAKUTAKUWA NA UREJESHAJI WOWOTE.',
  'VINYWAJI VYAKO VIKIBAKI UTAVICHUKUA KWA KULETA CHUPA TUPU (EMPTY) KULINGANA NA VINYWAJI ULIVYOBAKISHA (VIFATWE NDANI YA SIKU TATU TOKA ULIVYOANDIKISHA).',
  'HATURUHUSU SHEREHE MBILI KWA WAKATI MMOJA (TWO IN ONE).',
  'OUTCATERING NI MAKUBALIANO NA OFISI JUU YA GHARAMA ZA UENDESHAJI HUDUMA.',
  'GHARAMA ZOTE ZILIPWE V.A.T 18%.',
  'MTEJA ANATAKIWA KWENDA KULIPIA KIBALI CHA SHEREHE MANISPAA (OFISI YA UTAMADUNI).',
  'AC ZINAWASHWA UKUMBINI SAA 17:30PM.',
];

const DECLARATION_LINES = [
  'MIMI .................................. NIMESOMA NA KUKUBALIANA NA MIONGOZO YOTE HAPO JUU NA NITAFUATA YOTE YALIYOELEKEZWA HAPO.',
  'SAINI ................................................ TAREHE ................................................',
];

const KEKI_ITEMS = [
  'TUNACHOMA KEKI YA ASILI (NDAFU) KWA GHARAMA ZIFUATAZO:',
  'MBUZI AKILETWA NA MTEJA ATAOKWA KWA GHARAMA YA TSHS: 100,000/=',
  'NDAFU KAMILI (MBUZI NA KUMUOKA) TSHS 350,000/= HADI TSH: 400,000/=',
  'NB: MTEJA ANARUHUSIWA KULETA NDAFU UKUMBINI; TOROLI LA NDAFU ATAKODISHWA KWA TSHS 20,000/=',
];

const DRINK_ITEMS = [
  ['FLYING FISH & KILIMANJARO LITE', 'TSH @3000/='],
  ['LOCAL BEER', 'TSH @2500/='],
  ['IMPORTED BEER', 'TSH @4000/='],
  ['SODA', 'TSH @1000/='],
  ['AZAM JUICE', 'TSH @4000/='],
  ['MAJI KILI 1/2LT (0.5LT)', 'TSH @1000/='],
  ['MALTA', 'TSH @3000/='],
  ['BALTIKA', 'TSH @5000/='],
  ['BAVARIA', 'TSH @3500/='],
  ['SAVANNA', 'TSH @5000/='],
  ['CERES JUICE', 'TSH @6000/='],
  ['KONYAGI & K VANT', 'TSH @15000/='],
  ['WINE (5LTRS)', 'TSH @120,000/='],
] as const;

const DRINK_NOTES = [
  'BEI ZITAKAPOBADILIKA MTAJULISHWA PALE TU MAKAMPUNI HUSIKA YAKIPANDISHA BEI.',
  'UNARUHUSIWA KULETA POMBE KALI NA CHAMPION TU.',
  'NB: GHARAMA ZA KUINGIZA COCTAIL UKUMBINI NI 150,000/=.',
];

const EXTERNAL_SERVICES_PRIMARY = [
  'KUKODISHA MAGARI',
  'OUT CATERING',
  'BEVARAGE SERVICE',
  'DECORATION SERVICE',
  'EVENT RENTAL SERVICE',
  'PLACES FOR HOLDING VARIOUS MEETINGS',
];

const DECORATION_PACKAGES_PRIMARY = [
  {
    title: 'STANDARD',
    priceLabel: '2000,000/=',
    features: [
      "STAGE'S DECORATION",
      'PHOTOBOOTH BANNER 3METRE',
      'WELCOME NOTE BOARD',
      'FIRE WALKS 2',
      'ENTRANCE DECOR',
      'FLOWERS (ARTIFICIAL AND NATURAL)',
      'DANCING FLOOR STICKER + PRINTED NAMES',
      'LIGHT (FRYLIGHTS)',
      "TABLE'S DECORATION",
      'TABLE COVER',
      'FLOWERS VASE (IRONIC GOLD)',
      'CHARGER PLATE @TABLE',
      'MAPKINS 4 @TABLE',
      'CHAMPION GLASS 4',
    ],
  },
  {
    title: 'V.I.P',
    priceLabel: '5000,000/=',
    features: [
      'STAGE DECORATION',
      'CROME CHAIR 400 (GOLD + SILVER + BLACK)',
      'WALKING WAY STICKER',
      'ENTRANCE DECOR',
      'FLOWERS (ARTIFICIAL AND NATURAL)',
      'FOG MACHINE 1',
      'MOVING HEAD 2',
      'DANCING FLOOR STICKER + PRINTED NAMES',
      'TABLE DECORATION',
      'VASE CANDLES 20 (IRONIC GOLD)',
      'NAPKIN 10 @TABLE',
      'CHARGER PLATE 10 @TABLE',
      'GLASS WATER 10',
      'GLASS WINES 10',
    ],
  },
  {
    title: 'EXECUTIVE',
    priceLabel: '8,000,000/=',
    features: [
      'L.E.D ON STAGE',
      'LIZER MACHINE ON FIRST DANCE',
      '8 CHANDELIER',
      'TRUSS (8M*10M) + DECORATION + PRINTED BANNER',
      'SCARTED STAND FLOWER',
      'MOVING HEAD 4',
      'PRINTED STICKER WALKING WAY',
      'TABLE DECORATION',
      'TABLE COVER',
      'WATER GLASS CRYSTAL 10 @TABLE',
      'WINE GLASS CRYSTAL 10 @TABLE',
      'TABLE NUMBER',
      "CANDLE'S VASE CLEAR OR BLACK",
    ],
  },
  {
    title: 'V.V.I.P',
    priceLabel: '15,000,000/=',
    features: [
      'A LOT OF FLOWERS',
      'TRUSS (12M*12M) + L.E.D SCREEN + DECORATIONS AND 10 CHANDELIER',
      'THEMES SET UP WHOLE HALL',
      'FOG MACHINE 2',
      'TABLE LAMP 10',
      '3PC CANDLES EACH TABLE',
      'FIRE WALKS 6 SET',
      'LIZER MACHINE',
    ],
  },
  {
    title: 'ROYAL',
    priceLabel: '20,000,000/=',
    features: [
      'A LOT OF FLOWERS',
      'TRUSS (12M*12M) + L.E.D SCREEN - DECORATIONS + 15 CHANDELIER',
      'THEMES SETUP WHOLE HALL',
      'FOG MACHINE 4',
      'TABLE LAMP 20',
      '4PCS CANDLE EACH TABLE',
      'FIRE WALKS 8 SET',
      'LIZER MACHINE',
    ],
  }
];

const FOOD_MENUS = [
  {
    title: 'MENU (13,000/=)',
    starter: ['Mtori', 'Samosa'],
    buffet: ['Kuku choma 1/6', 'Rojo nyama', 'Wali maua', 'Pilau', 'Chips', 'Salad', 'Pilipili', 'Tunda'],
  },
  {
    title: 'MENU (15,000/=)',
    starter: ['Mtori / supu / mbogamboga', 'Samosa', 'Bagia'],
    buffet: ['Kuku choma 1/4', 'Rojo nyama', 'Wali', 'Tambi za mbogamboga', 'Ndizi nyama', 'Tunda', 'Pilipili', 'Salad'],
  },
];

const CONFERENCE_PACKAGES_PRIMARY = [
  {
    attendees: 'WATU 30-50',
    tiers: [
      { price: '@TSH 55,000/=', items: ['HALL', 'SETUP', 'BREAKFAST', 'LUNCH', 'SOFT DRINKS', 'STATIONARY', 'P.A'] },
      { price: '@TSH 35,000/=', items: ['HALL', 'SETUP', 'P.A'] },
      { price: '@TSH 20,000/=', items: ['HALL', 'SETUP'] },
      { price: 'LIPA UKUMBI', items: [] },
    ],
  },
  {
    attendees: 'WATU 100-200',
    tiers: [
      { price: '@TSHS 50,000/=', items: ['HALL', 'SETUP', 'BREAKFAST', 'LUNCH', 'STATIONARY', 'P.A', 'SOFT DRINKS', 'PROJECTOR'] },
      { price: '@TSHS 40,000/=', items: ['HALL', 'SETUP', 'STATIONARY', 'P.A', 'PROJECTOR'] },
      { price: '@TSHS 30,000/=', items: ['HALL', 'SETUP', 'P.A', 'PROJECTOR'] },
      { price: 'LIPA UKUMBI', items: [] },
    ],
  },
  {
    attendees: 'WATU 300-500',
    tiers: [
      { price: '@TSHS 45,000/=', items: ['HALL', 'SETUP', 'BREAKFAST', 'LUNCH', 'STATIONARY', 'P.A', 'SOFT DRINKS', 'EVENING TEA', 'PROJECTOR'] },
      { price: '@TSH 40,000/=', items: ['HALL', 'SETUP', 'PROJECTOR', 'P.A', 'SOFT DRINKS', 'BREAKFAST'] },
      { price: '@35,000/=', items: ['HALL', 'SETUP', 'P.A', 'PROJECTOR'] },
      { price: 'LIPA UKUMBI', items: [] },
    ],
  },
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
              <p className="text-2xl font-bold text-black" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Reserve Your Date</p>
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
                  <Link to={`/halls/${hall.id}`} className="mt-4 inline-flex items-center gap-2 font-semibold text-[#6B1E2D]">View Hall <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#d8c8aa] bg-white p-6 md:p-8">
          <h2 className="text-center text-3xl font-bold md:text-4xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Hall Rental Rates</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {RENTAL_RATE_CARDS.map((hall) => (
              <div key={hall.hall} className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#6B1E2D]">{hall.hall}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {hall.rates.map((rate) => (
                    <p key={rate.day} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <span>{rate.day}</span>
                      <span className="font-semibold text-[#6B1E2D]">{rate.priceLabel}</span>
                    </p>
                  ))}
                </div>
              </div>
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
          {tab === 'Packages' && <div className="space-y-5 text-sm">
            <div className="rounded-xl border border-[#d8c8aa] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7a5e]">Gharama Za Mapambo</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {DECORATION_PACKAGES_PRIMARY.map((tier) => (
                  <div key={tier.title} className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
                    <p className="flex items-center justify-between text-sm font-semibold text-[#2B2B2B]">
                      <span>{tier.title}</span>
                      <span className="text-[#6B1E2D]">{tier.priceLabel}</span>
                    </p>
                    <ul className="mt-3 space-y-1 text-[#4f4f4f]">
                      {tier.features.map((item) => (
                        <li key={`${tier.title}-${item}`} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c6a75e]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#d8c8aa] bg-[#fffaf3] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7a5e]">Conference Package</p>
              <div className="mt-4 space-y-4">
                {CONFERENCE_PACKAGES_PRIMARY.map((pkg) => (
                  <div key={pkg.attendees} className="rounded-xl border border-[#e8dcc9] bg-white p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B1E2D]">{pkg.attendees}</p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-4">
                      {pkg.tiers.map((tier) => (
                        <div key={`${pkg.attendees}-${tier.price}`} className="rounded-lg bg-[#fffdf9] p-3">
                          <p className="text-xs font-semibold text-[#6B1E2D]">{tier.price}</p>
                          <ul className="mt-2 space-y-1 text-xs text-[#4f4f4f]">
                            {tier.items.length === 0 ? <li>-</li> : tier.items.map((item) => <li key={`${pkg.attendees}-${tier.price}-${item}`}>{item}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>}
          {tab === 'Catering' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#8b7a5e]">Keki</p>
              {KEKI_ITEMS.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}
            </div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#8b7a5e]">Huduma Nyingine Nje Ya Ukumbi</p>
              {EXTERNAL_SERVICES_PRIMARY.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}
            </div>
            <div className="rounded-xl border border-[#d8c8aa] bg-[#fffaf3] p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7a5e]">Menu Za Chakula</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {FOOD_MENUS.map((menu) => (
                  <div key={menu.title} className="rounded-xl border border-[#e8dcc9] bg-white p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B1E2D]">{menu.title}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7a5e]">Starter</p>
                        <ul className="mt-2 space-y-1 text-[#4f4f4f]">
                          {menu.starter.map((item) => (
                            <li key={`${menu.title}-starter-${item}`} className="rounded-md bg-[#fffdf9] px-2 py-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7a5e]">Buffee</p>
                        <ul className="mt-2 space-y-1 text-[#4f4f4f]">
                          {menu.buffet.map((item) => (
                            <li key={`${menu.title}-buffet-${item}`} className="rounded-md bg-[#fffdf9] px-2 py-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>}
          {tab === 'Drinks' && <div className="grid gap-5 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{DRINK_ITEMS.map((i) => <p key={i[0]} className="mb-2 flex justify-between rounded-lg bg-white px-3 py-2"><span>{i[0]}</span><span className="font-semibold text-[#6B1E2D]">{i[1]}</span></p>)}</div>
            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">{DRINK_NOTES.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}</div>
          </div>}
          {tab === 'Policies' && <div className="space-y-5 text-sm">
            <div className="rounded-xl border border-[#d8c8aa] bg-[#fffaf3] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7a5e]">Taratibu Za Ukumbi</p>
              <div className="mt-4 grid gap-2">
                {TARATIBU_PRIMARY.map((item) => (
                  <p key={item} className="rounded-lg bg-white px-3 py-2">{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#8b7a5e]">Muhimu</p>
              {MUHIMU_PRIMARY.map((i) => <p key={i} className="mb-2 rounded-lg bg-white px-3 py-2">{i}</p>)}
            </div>

            <div className="rounded-xl border border-[#e8dcc9] bg-[#fffdf9] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b7a5e]">Client Declaration</p>
              {DECLARATION_LINES.map((line) => <p key={line} className="mt-2 rounded-lg bg-white px-3 py-2">{line}</p>)}
            </div>
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
