import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const quote = selectedHall && form.date ? hallPrice(selectedHall.id, form.date) : 0;
  const hallSelectionValue = useMemo(() => {
    if (!form.hall) return '';
    return selectedHall ? form.hall : HALL_OTHER_VALUE;
  }, [form.hall, selectedHall]);
  const calculatedAmount = selectedHall ? quote : Number(form.quotedAmount) || 0;
  const conflict = form.hall && form.date ? hasConflict(form) : false;

  const onChange = <K extends keyof CreateBookingInput>(key: K, value: CreateBookingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload: CreateBookingInput = {
      ...form,
      quotedAmount: calculatedAmount,
    };
    setIsSubmitting(true);
    try {
      const result = await createPublicBooking(payload, activeRequestId);
      toast({
        title: result.ok ? (isSw ? 'Uhifadhi umetumwa' : 'Booking submitted') : (isSw ? 'Uhifadhi umeshindikana' : 'Booking failed'),
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
      if (result.ok) {
        setForm({
          ...INITIAL_BOOKING,
          eventName: packageName ? `${packageName} Package Booking` : '',
          notes: packageName ? `Selected package: ${packageName}` : '',
        });
        setActiveRequestId(createRequestId());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1B1B1B]">
      <PublicNavbar />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <section className="rounded-2xl border border-[#e9e5dc] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {isSw ? 'Sehemu ya Uhifadhi' : 'Booking Section'}
              </h1>
              <p className="mt-2 text-sm text-[#777777]">
                {isSw
                  ? 'Jaza taarifa zako na utume moja kwa moja kwenye mfumo wetu wa uhifadhi.'
                  : 'Fill your details and submit directly to our backend booking workflow.'}
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-[#C6A75E]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder={isSw ? 'Jina la Mteja' : 'Customer Name'} value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
              <input className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder={isSw ? 'Namba ya Simu' : 'Phone Number'} value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
            </div>
            <input className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder={isSw ? 'Jina la Tukio' : 'Event Name'} value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}>
                <option>{isSw ? 'Harusi' : 'Wedding'}</option>
                <option>{isSw ? 'Mkutano' : 'Conference'}</option>
                <option>{isSw ? 'Siku ya Kuzaliwa' : 'Birthday'}</option>
                <option>{isSw ? 'Tukio la Kampuni' : 'Corporate Event'}</option>
                <option>{isSw ? 'Nyingine' : 'Other'}</option>
              </select>
              <select
                className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3"
                value={hallSelectionValue}
                onChange={(e) => onChange('hall', e.target.value === HALL_OTHER_VALUE ? '' : e.target.value)}
              >
                <option value="">{isSw ? 'Chagua Ukumbi' : 'Choose Hall'}</option>
                {HALL_OPTIONS.map((hall) => <option key={hall.id} value={hall.name}>{hall.label}</option>)}
                <option value={HALL_OTHER_VALUE}>{isSw ? 'Nyingine' : 'Other hall'}</option>
              </select>
            </div>
            {hallSelectionValue === HALL_OTHER_VALUE ? (
              <input
                className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3"
                placeholder={isSw ? 'Andika jina la ukumbi' : 'Hall name'}
                value={form.hall}
                onChange={(e) => onChange('hall', e.target.value)}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <input type="date" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
              <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
              <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder={isSw ? 'Idadi ya Wageni' : 'Expected Guests'} value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
              {selectedHall ? (
                <input
                  className="h-11 rounded-xl border border-[#e4ded1] bg-[#faf7f1] px-3 text-[#6b6253]"
                  value={quote > 0 ? formatTZS(quote) : isSw ? 'Bei itaonekana baada ya kuchagua ukumbi na tarehe' : 'Quote auto-calculated after hall/date'}
                  readOnly
                />
              ) : (
                <input
                  type="number"
                  className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3"
                  placeholder={isSw ? 'Andika kiasi cha bei (TZS)' : 'Enter quote amount (TZS)'}
                  value={form.quotedAmount || ''}
                  onChange={(e) => onChange('quotedAmount', Number(e.target.value))}
                />
              )}
            </div>
            <textarea className="w-full rounded-xl border border-[#e4ded1] bg-white px-3 py-2" rows={3} placeholder={isSw ? 'Maelezo ya Ziada' : 'Additional Notes'} value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />

            <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>
              {conflict
                ? isSw ? 'Muda uliochaguliwa tayari umechukuliwa.' : 'Selected slot already occupied.'
                : isSw ? 'Muda uliochaguliwa unapatikana.' : 'Selected slot is available.'}
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-[#1f1f1f] text-white hover:bg-[#2c2c2c] disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting
                ? (isSw ? 'Inatuma...' : 'Submitting...')
                : (isSw ? 'Wasilisha Uhifadhi' : 'Submit Booking')}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
