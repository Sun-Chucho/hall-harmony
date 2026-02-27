import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { CreateBookingInput } from '@/types/booking';

const HALL_OPTIONS = [
  { id: 'witness', label: 'Witness Hall (Pax 500-700)', name: 'Witness Hall', capacityMax: 700 },
  { id: 'kilimanjaro', label: 'Kilimanjaro Hall (200-400)', name: 'Kilimanjaro Hall', capacityMax: 400 },
  { id: 'hall-d', label: 'Hall D (30-60)', name: 'Hall D', capacityMax: 60 },
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

function hallPrice(hallId: HallOption['id'], isoDate: string): number {
  if (!isoDate) return 0;
  const day = new Date(isoDate).getDay();
  if (hallId === 'witness') return day === 6 ? 3835000 : day === 1 || day === 2 ? 1534000 : 2301000;
  if (hallId === 'kilimanjaro') return day === 6 ? 2301000 : day === 1 || day === 2 ? 1227000 : 1534000;
  return day === 1 || day === 2 ? 177000 : 236000;
}

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

export default function PublicBooking() {
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get('package') ?? '';
  const { createPublicBooking, hasConflict } = useBookings();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateBookingInput>({
    ...INITIAL_BOOKING,
    eventName: packageName ? `${packageName} Package Booking` : '',
    notes: packageName ? `Selected package: ${packageName}` : '',
  });

  const selectedHall = useMemo(() => HALL_OPTIONS.find((item) => item.name === form.hall), [form.hall]);
  const quote = selectedHall && form.date ? hallPrice(selectedHall.id, form.date) : 0;
  const conflict = form.hall && form.date ? hasConflict(form) : false;

  const onChange = <K extends keyof CreateBookingInput>(key: K, value: CreateBookingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: CreateBookingInput = {
      ...form,
      quotedAmount: quote,
    };
    const result = await createPublicBooking(payload);
    toast({
      title: result.ok ? 'Booking submitted' : 'Booking failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    if (result.ok) {
      setForm({
        ...INITIAL_BOOKING,
        eventName: packageName ? `${packageName} Package Booking` : '',
        notes: packageName ? `Selected package: ${packageName}` : '',
      });
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
                Booking Section
              </h1>
              <p className="mt-2 text-sm text-[#777777]">
                Fill your details and submit directly to our backend booking workflow.
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-[#C6A75E]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Customer Name" value={form.customerName} onChange={(e) => onChange('customerName', e.target.value)} />
              <input className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Phone Number" value={form.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} />
            </div>
            <input className="h-11 w-full rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Event Name" value={form.eventName} onChange={(e) => onChange('eventName', e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.eventType} onChange={(e) => onChange('eventType', e.target.value)}>
                <option>Wedding</option>
                <option>Conference</option>
                <option>Birthday</option>
                <option>Corporate Event</option>
                <option>Other</option>
              </select>
              <select className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.hall} onChange={(e) => onChange('hall', e.target.value)}>
                <option value="">Choose Hall</option>
                {HALL_OPTIONS.map((hall) => <option key={hall.id} value={hall.name}>{hall.label}</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <input type="date" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
              <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} />
              <input type="time" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" className="h-11 rounded-xl border border-[#e4ded1] bg-white px-3" placeholder="Expected Guests" value={form.expectedGuests || ''} onChange={(e) => onChange('expectedGuests', Number(e.target.value))} />
              <input className="h-11 rounded-xl border border-[#e4ded1] bg-[#faf7f1] px-3 text-[#6b6253]" value={quote > 0 ? formatTZS(quote) : 'Quote auto-calculated after hall/date'} readOnly />
            </div>
            <textarea className="w-full rounded-xl border border-[#e4ded1] bg-white px-3 py-2" rows={3} placeholder="Additional Notes" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />

            <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>{conflict ? 'Selected slot already occupied.' : 'Selected slot is available.'}</p>
            <Button type="submit" className="w-full rounded-full bg-[#1f1f1f] text-white hover:bg-[#2c2c2c]">Submit Booking</Button>
          </form>
        </section>
      </main>
    </div>
  );
}
