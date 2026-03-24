import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Check } from 'lucide-react';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { CreateBookingInput } from '@/types/booking';
import { useLanguage } from '@/contexts/LanguageContext';

const HALL_OPTIONS = [
  { id: 'witness', label: 'Witness Hall (Pax 500-700)', name: 'Witness Hall', capacityMax: 700 },
  { id: 'kilimanjaro', label: 'Kilimanjaro Hall (200-400)', name: 'Kilimanjaro Hall', capacityMax: 400 },
  { id: 'kilimanjaro-garden', label: 'Kilimanjaro Garden (300-400)', name: 'Kilimanjaro Garden', capacityMax: 400 },
  { id: 'hall-d', label: 'Hall D (30-60)', name: 'Hall D', capacityMax: 60 },
] as const;
const HALL_OTHER_VALUE = '__other__';

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

function hallPrice(hallId: HallOption['id'], isoDate: string): number {
  if (!isoDate) return 0;
  const day = new Date(isoDate).getDay();
  if (hallId === 'witness') return day === 6 ? 3835000 : day === 1 || day === 2 ? 1534000 : 2301000;
  if (hallId === 'kilimanjaro' || hallId === 'kilimanjaro-garden') return day === 6 ? 2301000 : day === 1 || day === 2 ? 1227000 : 1534000;
  return day === 1 || day === 2 ? 177000 : 236000;
}

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const inputClass = 'h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none transition focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10';
const selectClass = 'h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none transition focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10 appearance-none';

export default function PublicBooking() {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get('package') ?? '';
  const { createPublicBooking, hasConflict } = useBookings();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateBookingInput>({
    ...INITIAL_BOOKING,
    eventName: packageName ? `${packageName} Package Booking` : '',
    notes: packageName ? `Selected package: ${packageName}` : '',
  });
  const [activeRequestId, setActiveRequestId] = useState(() => createRequestId());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherHallSelected, setIsOtherHallSelected] = useState(false);

  /* scroll-reveal observer */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('[class*="reveal-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const quote = selectedHall && form.date ? hallPrice(selectedHall.id, form.date) : 0;
  const hallSelectionValue = useMemo(() => {
    if (isOtherHallSelected) return HALL_OTHER_VALUE;
    if (!form.hall) return '';
    return selectedHall ? form.hall : HALL_OTHER_VALUE;
  }, [form.hall, isOtherHallSelected, selectedHall]);
  const calculatedAmount = selectedHall ? quote : Number(form.quotedAmount) || 0;
  const conflict = form.hall && form.date ? hasConflict(form) : false;

  const onChange = <K extends keyof CreateBookingInput>(key: K, value: CreateBookingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const payload: CreateBookingInput = { ...form, quotedAmount: calculatedAmount };
    setIsSubmitting(true);
    try {
      const result = await createPublicBooking(payload, activeRequestId);
      toast({
        title: result.ok ? (isSw ? 'Uhifadhi umetumwa' : 'Booking submitted') : (isSw ? 'Uhifadhi umeshindikana' : 'Booking failed'),
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
      if (result.ok) {
        setForm({ ...INITIAL_BOOKING, eventName: packageName ? `${packageName} Package Booking` : '', notes: packageName ? `Selected package: ${packageName}` : '' });
        setIsOtherHallSelected(false);
        setActiveRequestId(createRequestId());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <PublicNavbar />

      {/* ─── HERO STRIP ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#3B0B12] to-[#7A151B] px-6 pb-20 pt-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-1.5">
            <CalendarDays className="h-4 w-4 text-[#ff9999]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">{isSw ? 'Uhifadhi wa Moja kwa Moja' : 'Direct Booking'}</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">{isSw ? 'Hifadhi Tarehe Yako' : 'Reserve Your Date'}</h1>
          <p className="mt-4 text-[15px] text-white/60">{isSw ? 'Jaza taarifa zako na utume moja kwa moja kwenye mfumo wetu wa uhifadhi.' : 'Fill your details and submit directly to our booking system.'}</p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* ─── BACK LINK ─── */}
        <Link to="/" className="reveal-fade-up inline-flex items-center gap-2 text-sm font-medium text-[#0A0A0A]/50 transition hover:text-[#7A151B]">
          <ArrowLeft className="h-4 w-4" /> {isSw ? 'Rudi Nyumbani' : 'Back Home'}
        </Link>

        {/* ─── BOOKING FORM ─── */}
        <section className="reveal-fade-up mt-8 rounded-2xl border border-black/[.06] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Sehemu ya Uhifadhi' : 'Booking Form'}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">{isSw ? 'Tuma maombi yako' : 'Submit your request'}</h2>
            </div>
            <div className="rounded-xl bg-[#faf5f5] p-3">
              <CalendarDays className="h-5 w-5 text-[#7A151B]" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {/* Name & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={inputClass} placeholder={isSw ? 'Jina la Mteja' : 'Customer Name'} value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
              <input className={inputClass} placeholder={isSw ? 'Namba ya Simu' : 'Phone Number'} value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
            </div>

            {/* Event Name */}
            <input className={inputClass} placeholder={isSw ? 'Jina la Tukio' : 'Event Name'} value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />

            {/* Event Type & Hall */}
            <div className="grid gap-4 sm:grid-cols-2">
              <select className={selectClass} value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}>
                <option>{isSw ? 'Harusi' : 'Wedding'}</option>
                <option>{isSw ? 'Mkutano' : 'Conference'}</option>
                <option>{isSw ? 'Siku ya Kuzaliwa' : 'Birthday'}</option>
                <option>{isSw ? 'Tukio la Kampuni' : 'Corporate Event'}</option>
                <option>{isSw ? 'Nyingine' : 'Other'}</option>
              </select>
              <select
                className={selectClass}
                value={hallSelectionValue}
                onChange={(e) => {
                  if (e.target.value === HALL_OTHER_VALUE) { setIsOtherHallSelected(true); onChange('hall', ''); return; }
                  setIsOtherHallSelected(false);
                  onChange('hall', e.target.value);
                }}
              >
                <option value="">{isSw ? 'Chagua Ukumbi' : 'Choose Hall'}</option>
                {HALL_OPTIONS.map((hall) => <option key={hall.id} value={hall.name}>{hall.label}</option>)}
                <option value={HALL_OTHER_VALUE}>{isSw ? 'Nyingine' : 'Other hall'}</option>
              </select>
            </div>

            {isOtherHallSelected && (
              <input className={inputClass} placeholder={isSw ? 'Andika jina la ukumbi' : 'Hall name'} value={form.hall} onChange={(e) => onChange('hall', e.target.value)} />
            )}

            {/* Date & Times */}
            <div className="grid gap-4 sm:grid-cols-3">
              <input type="date" className={inputClass} value={form.date} onChange={(e) => onChange('date', e.target.value)} />
              <input type="time" className={inputClass} value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
              <input type="time" className={inputClass} value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
            </div>

            {/* Guests & Quote */}
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" className={inputClass} placeholder={isSw ? 'Idadi ya Wageni' : 'Expected Guests'} value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
              {selectedHall ? (
                <div className="flex h-12 items-center rounded-xl border border-black/10 bg-[#faf5f5] px-4">
                  <span className="text-sm font-semibold text-[#7A151B]">{quote > 0 ? formatTZS(quote) : isSw ? 'Bei itaonekana...' : 'Auto-calculated...'}</span>
                </div>
              ) : (
                <input type="number" className={inputClass} placeholder={isSw ? 'Andika kiasi cha bei (TZS)' : 'Enter quote amount (TZS)'} value={form.quotedAmount || ''} onChange={(e) => onChange('quotedAmount', Number(e.target.value))} />
              )}
            </div>

            {/* Notes */}
            <textarea className="w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 py-3 text-sm outline-none transition focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" rows={3} placeholder={isSw ? 'Maelezo ya Ziada' : 'Additional Notes'} value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />

            {/* Conflict Status */}
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${conflict ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Check className="h-4 w-4" />
              {conflict
                ? isSw ? 'Muda uliochaguliwa tayari umechukuliwa.' : 'Selected slot already occupied.'
                : isSw ? 'Muda uliochaguliwa unapatikana.' : 'Selected slot is available.'}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-full bg-[#7A151B] text-sm font-semibold text-white hover:bg-[#5C0A0F] disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting
                ? (isSw ? 'Inatuma...' : 'Submitting...')
                : (isSw ? 'Wasilisha Uhifadhi' : 'Submit Booking')}
            </Button>
          </form>
        </section>

        {/* ─── INFO STRIP ─── */}
        <div className="reveal-scale mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-5 text-center">
            <p className="text-2xl font-bold text-[#7A151B]">4</p>
            <p className="mt-1 text-xs text-[#0A0A0A]/40 uppercase tracking-[0.15em]">{isSw ? 'Kumbi' : 'Venues'}</p>
          </div>
          <div className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-5 text-center">
            <p className="text-2xl font-bold text-[#7A151B]">24h</p>
            <p className="mt-1 text-xs text-[#0A0A0A]/40 uppercase tracking-[0.15em]">{isSw ? 'Jibu Haraka' : 'Response'}</p>
          </div>
          <div className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-5 text-center">
            <p className="text-2xl font-bold text-[#7A151B]">100%</p>
            <p className="mt-1 text-xs text-[#0A0A0A]/40 uppercase tracking-[0.15em]">{isSw ? 'Salama' : 'Secure'}</p>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A0A0A] px-6 py-12 text-center text-white">
        <p className="text-xl font-bold">Kuringe <span className="text-[#7A151B]">Halls</span></p>
        <p className="mt-2 text-xs text-white/30">© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
