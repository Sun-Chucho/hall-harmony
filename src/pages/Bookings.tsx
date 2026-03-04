import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useMessages } from '@/contexts/MessageContext';
import { usePayments } from '@/contexts/PaymentContext';
import { useToast } from '@/hooks/use-toast';
import { BookingCarType, CreateBookingInput } from '@/types/booking';
import { PaymentMethod } from '@/types/payment';

const halls = [
  'Witness Hall',
  'Kilimanjaro Hall',
  'Garden Deck',
  'Hall D',
];
const HALL_OTHER_VALUE = '__other__';

const carOptions: { value: BookingCarType; label: string }[] = [
  { value: 'none', label: 'No Car' },
  { value: 'range_rover', label: 'Range Rover' },
  { value: 'lexus', label: 'Lexus' },
  { value: 'bmw', label: 'BMW' },
];

const carLabelMap: Record<BookingCarType, string> = {
  none: 'No Car',
  range_rover: 'Range Rover',
  lexus: 'Lexus',
  bmw: 'BMW',
};

const initialForm: CreateBookingInput = {
  customerName: '',
  customerPhone: '',
  eventName: '',
  eventType: '',
  hall: '',
  date: '',
  startTime: '',
  endTime: '',
  expectedGuests: 0,
  quotedAmount: 0,
  carType: 'none',
  carPrice: 0,
  notes: '',
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getYearStartIso() {
  return `${new Date().getUTCFullYear()}-01-01`;
}

function toShortStatus(value: string) {
  return value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function hallSelectValue(value: string, isOtherSelected: boolean) {
  if (isOtherSelected) return HALL_OTHER_VALUE;
  if (!value) return '';
  return halls.includes(value) ? value : HALL_OTHER_VALUE;
}

const cashierPaymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

interface InstallmentEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
  receivedAt: string;
  notes: string;
}

interface OtherBookingOption {
  id: string;
  label: string;
  unitPrice: number;
}

interface OtherBookingSelection extends OtherBookingOption {
  quantity: number;
  total: number;
}

const assistantOtherBookingOptions: OtherBookingOption[] = [
  { id: 'parent_tables', label: 'Meza za Wazazi (PC 2)', unitPrice: 60000 },
  { id: 'parent_chairs', label: 'Viti vya Wazazi', unitPrice: 5000 },
  { id: 'bride_groom_table', label: 'Meza ya Maharusi', unitPrice: 15000 },
  { id: 'bride_groom_chair', label: 'Kiti cha Maharusi', unitPrice: 10000 },
  { id: 'new_bride_groom_chair', label: 'Kiti cha Maharusi Kipya', unitPrice: 15000 },
  { id: 'charger_plate', label: 'Chaja Plate', unitPrice: 500 },
  { id: 'marine_board', label: 'Marine Board', unitPrice: 5000 },
  { id: 'vase', label: 'Versi', unitPrice: 1000 },
  { id: 'table_cloth', label: 'Kitamba cha Meza', unitPrice: 3000 },
  { id: 'seminar_table_cloth', label: 'Meza za Semina na Kitambaa', unitPrice: 7000 },
  { id: 'napkins', label: 'Napkins', unitPrice: 500 },
  { id: 'table_runner', label: 'Table Runner', unitPrice: 1000 },
  { id: 'decor_iron', label: 'Chuma za Mapambo', unitPrice: 10000 },
  { id: 'new_glass_tables', label: 'Meza za Kioo Mpya (PC 2)', unitPrice: 100000 },
  { id: 'snake_tables', label: 'Meza za Nyoka Nyoka', unitPrice: 25000 },
  { id: 'ld', label: 'LD', unitPrice: 10000 },
  { id: 'glass_charger_plate', label: 'Chaja Plate za Kioo', unitPrice: 1000 },
  { id: 'new_chairs', label: 'Viti Vipya', unitPrice: 5000 },
  { id: 'basketball_chair', label: 'Kuringe Basketball Chair', unitPrice: 4000 },
  { id: 'bride_sofa', label: 'Kochi la Maharusi', unitPrice: 50000 },
  { id: 'ladder_day', label: 'Ngazi Siku Nzima', unitPrice: 30000 },
  { id: 'truss_light', label: 'Taa za Truss', unitPrice: 10000 },
  { id: 'hall_tables', label: 'Meza za Ukumbini', unitPrice: 5000 },
  { id: 'banquet_chairs', label: 'Viti vya Benquit', unitPrice: 1500 },
  { id: 'banquet_chair_cover', label: 'Foronya za Benquit Chair', unitPrice: 500 },
  { id: 'flower_head', label: 'Maua Kichaa', unitPrice: 1000 },
];

function getDefaultPaidDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function ensureEndAfterStart(startTime: string, endTime: string): string {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (startMinutes < 0) return endTime;
  if (endMinutes > startMinutes) return endTime;
  return toTimeString(startMinutes + 60);
}

type CashierBookingsTab = 'pending-approval' | 'partial-payment' | 'completed-payment';
type AssistantBookingsTab = 'halls' | 'other-booking';

export default function Bookings() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const {
    bookings,
    createBooking,
    createPastBooking,
    reviewPastBooking,
    deleteBooking,
    updateBooking,
    updateBookingStatus,
    updateEventDetailStatus,
    hasConflict,
  } = useBookings();
  const { sendManagerAlert } = useMessages();
  const { payments, recordPayment, getBookingFinancials } = usePayments();
  const [form, setForm] = useState<CreateBookingInput>(initialForm);
  const [message, setMessage] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [isSavingPastBooking, setIsSavingPastBooking] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const [cashierTab, setCashierTab] = useState<CashierBookingsTab>('pending-approval');
  const [assistantTab, setAssistantTab] = useState<AssistantBookingsTab>('halls');
  const [otherBookingItemId, setOtherBookingItemId] = useState(assistantOtherBookingOptions[0]?.id ?? '');
  const [otherBookingQuantity, setOtherBookingQuantity] = useState(1);
  const [otherBookingSelections, setOtherBookingSelections] = useState<OtherBookingSelection[]>([]);
  const [isConfirmBookingModalOpen, setIsConfirmBookingModalOpen] = useState(false);
  const [confirmInstallments, setConfirmInstallments] = useState<InstallmentEntry[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidDateTime, setPaidDateTime] = useState(getDefaultPaidDateTime);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formHallIsOther, setFormHallIsOther] = useState(false);
  const [pastHallIsOther, setPastHallIsOther] = useState(false);
  const [pastApprovalAmount, setPastApprovalAmount] = useState<Record<string, number>>({});
  const [pastApprovalMethod, setPastApprovalMethod] = useState<Record<string, PaymentMethod>>({});
  const [pastApprovalDateTime, setPastApprovalDateTime] = useState<Record<string, string>>({});
  const [pastApprovalNotes, setPastApprovalNotes] = useState<Record<string, string>>({});
  const [pastForm, setPastForm] = useState<CreateBookingInput>({
    ...initialForm,
    date: getTodayIso(),
  });
  const lastBookingActionAtRef = useRef(0);
  const lastPastBookingActionAtRef = useRef(0);
  const lastPaymentActionAtRef = useRef(0);

  const createInstallmentEntry = (): InstallmentEntry => ({
    id: crypto.randomUUID(),
    method: 'cash',
    amount: 0,
    receivedAt: getDefaultPaidDateTime(),
    notes: '',
  });

  const refreshPageAfterUpdate = (notice?: string) => {
    setIsRefreshingPage(true);
    setMessage(notice ?? 'Update saved. Refreshing page...');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.reload();
      }, 450);
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const pending = bookings.filter((item) => item.bookingStatus === 'pending').length;
    const approved = bookings.filter((item) => item.bookingStatus === 'approved').length;
    const todayCount = bookings.filter((item) => item.date === today).length;
    return [
      { title: "Today's Bookings", value: `${todayCount}`, description: 'scheduled for today' },
      { title: 'Pending Approvals', value: `${pending}`, description: 'awaiting workflow action' },
      { title: 'Approved Bookings', value: `${approved}`, description: 'approved and active' },
      { title: 'Total Records', value: `${bookings.length}`, description: 'all booking requests' },
    ];
  }, [bookings]);

  const isAssistantHall = user?.role === 'assistant_hall_manager';
  const isCashier1 = user?.role === 'cashier_1';
  const isManager = user?.role === 'manager';
  const canManageBookings = user?.role === 'controller';
  const canFinalizeEvent = user?.role === 'controller';
  const canAccountantReview = user?.role === 'accountant';
  const canCreateBooking = user?.role === 'controller' || user?.role === 'manager';
  const canDeleteAnyBooking = user?.role === 'controller' || user?.role === 'manager';

  const conflict = form.hall && form.date && form.startTime && form.endTime
    ? hasConflict(form)
    : false;
  const isBookingFormComplete = Boolean(
    form.customerName.trim()
      && form.customerPhone.trim()
      && form.eventName.trim()
      && form.eventType.trim()
      && form.hall
      && form.date
      && form.startTime
      && form.endTime
      && Number.isFinite(form.expectedGuests)
      && form.expectedGuests > 0
      && Number.isFinite(form.quotedAmount)
      && form.quotedAmount > 0,
  );
  const isPastFormComplete = Boolean(
    pastForm.customerName.trim()
      && pastForm.customerPhone.trim()
      && pastForm.eventName.trim()
      && pastForm.eventType.trim()
      && pastForm.hall
      && pastForm.date
      && pastForm.startTime
      && pastForm.endTime
      && Number.isFinite(pastForm.expectedGuests)
      && pastForm.expectedGuests > 0
      && Number.isFinite(pastForm.quotedAmount)
      && pastForm.quotedAmount > 0,
  );

  const onChange = <K extends keyof CreateBookingInput>(field: K, value: CreateBookingInput[K]) => {
    if (field === 'carType') {
      const nextType = value as BookingCarType;
      setForm((prev) => ({ ...prev, carType: nextType }));
      return;
    }
    if (field === 'carPrice') {
      const numeric = Number(value);
      setForm((prev) => ({ ...prev, carPrice: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0 }));
      return;
    }
    if (field === 'startTime') {
      const nextStart = String(value);
      setForm((prev) => ({
        ...prev,
        startTime: nextStart,
        endTime: ensureEndAfterStart(nextStart, prev.endTime),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onPastChange = <K extends keyof CreateBookingInput>(field: K, value: CreateBookingInput[K]) => {
    if (field === 'carType') {
      const nextType = value as BookingCarType;
      setPastForm((prev) => ({ ...prev, carType: nextType }));
      return;
    }
    if (field === 'carPrice') {
      const numeric = Number(value);
      setPastForm((prev) => ({ ...prev, carPrice: Number.isFinite(numeric) && numeric >= 0 ? numeric : 0 }));
      return;
    }
    if (field === 'startTime') {
      const nextStart = String(value);
      setPastForm((prev) => ({
        ...prev,
        startTime: nextStart,
        endTime: ensureEndAfterStart(nextStart, prev.endTime),
      }));
      return;
    }
    setPastForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBooking = async (assistantFlow = false) => {
    if (isSavingBooking) return;
    if (Date.now() - lastBookingActionAtRef.current < 900) return;
    if (!isBookingFormComplete) {
      const invalidMessage = 'Complete all required booking fields before submitting.';
      setMessage(invalidMessage);
      toast({ title: 'Incomplete booking form', description: invalidMessage, variant: 'destructive' });
      return;
    }
    setIsSavingBooking(true);
    const editingId = editingBookingId;
    try {
      const result = editingBookingId
        ? await updateBooking(editingBookingId, form)
        : await createBooking(form, { actionId: crypto.randomUUID() });
      if (assistantFlow && result.ok && !editingBookingId) {
        setMessage('Booked and sent to Cashier 1 dashboard.');
      } else {
        setMessage(result.message);
      }
      toast({
        title: result.ok ? 'Booking submitted' : 'Booking failed',
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
      if (result.ok) {
        if (editingId) {
          await sendManagerAlert({
            bookingId: editingId,
            title: 'Booking Updated by Assistant Hall',
            body: `Booking ${editingId} updated: ${form.eventName} on ${form.date} ${form.startTime}-${form.endTime}.`,
          });
        }
        setForm(initialForm);
        setFormHallIsOther(false);
        setEditingBookingId(null);
        refreshPageAfterUpdate('Booking update saved. Refreshing page...');
      }
    } finally {
      lastBookingActionAtRef.current = Date.now();
      setIsSavingBooking(false);
    }
  };

  const beginEditBooking = (bookingId: string) => {
    const target = bookings.find((entry) => entry.id === bookingId);
    if (!target) return;
    setForm({
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      eventName: target.eventName,
      eventType: target.eventType,
      hall: target.hall,
      date: target.date,
      startTime: target.startTime,
      endTime: target.endTime,
      expectedGuests: target.expectedGuests,
      quotedAmount: target.quotedAmount,
      carType: target.carType ?? 'none',
      carPrice: target.carPrice ?? 0,
      notes: target.notes,
    });
    setFormHallIsOther(Boolean(target.hall && !halls.includes(target.hall)));
    setEditingBookingId(bookingId);
    setMessage(`Editing booking ${bookingId}. Update details, then click Save Booking Changes.`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookingStatus = async (bookingId: string, status: 'approved' | 'rejected' | 'cancelled' | 'completed') => {
    const result = await updateBookingStatus(bookingId, status);
    setMessage(result.message);
    if (result.ok) refreshPageAfterUpdate(`Booking marked as ${status}. Refreshing page...`);
  };

  const handleEventStatus = async (bookingId: string, status: 'approved_assistant' | 'approved_controller' | 'rejected') => {
    const result = await updateEventDetailStatus(bookingId, status);
    setMessage(result.message);
    if (result.ok) refreshPageAfterUpdate('Event status updated. Refreshing page...');
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const result = await deleteBooking(bookingId);
    setMessage(result.message);
    if (result.ok) refreshPageAfterUpdate('Booking deleted. Refreshing page...');
  };

  const handleAccountantDecision = async (bookingId: string, decision: 'approve' | 'disapprove') => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) {
      setMessage('Booking not found.');
      return;
    }
    const result = await sendManagerAlert({
      bookingId,
      title: `Accountant ${decision} recommendation`,
      body: `Booking ${booking.id} (${booking.eventName}) reviewed by accountant. Recommendation: ${decision.toUpperCase()}.`,
      decision,
    });
    setMessage(result.message);
    if (result.ok) refreshPageAfterUpdate('Recommendation sent. Refreshing page...');
  };

  const handleRecordPastBooking = async () => {
    if (isSavingPastBooking) return;
    if (Date.now() - lastPastBookingActionAtRef.current < 900) return;
    if (!isPastFormComplete) {
      const invalidMessage = 'Complete all required past booking fields before submitting.';
      setMessage(invalidMessage);
      toast({ title: 'Incomplete past booking form', description: invalidMessage, variant: 'destructive' });
      return;
    }
    setIsSavingPastBooking(true);
    try {
      const result = await createPastBooking(pastForm, { actionId: crypto.randomUUID() });
      setMessage(result.message);
      toast({
        title: result.ok ? 'Past booking submitted' : 'Past booking failed',
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
      if (result.ok) {
        setPastForm({
          ...initialForm,
          date: getTodayIso(),
        });
        setPastHallIsOther(false);
        refreshPageAfterUpdate('Past booking recorded. Refreshing page...');
      }
    } finally {
      lastPastBookingActionAtRef.current = Date.now();
      setIsSavingPastBooking(false);
    }
  };

  const openConfirmBookingModal = (bookingId?: string) => {
    if (bookingId) {
      setSelectedBookingId(bookingId);
    }
    setConfirmInstallments([createInstallmentEntry()]);
    setIsConfirmBookingModalOpen(true);
  };

  if (isAssistantHall && user) {
    const assistantBookings = bookings.filter((entry) => entry.createdByUserId === user.id);
    const sentToCashierCount = assistantBookings.filter((entry) => entry.assignedToRole === 'cashier_1' || !entry.assignedToRole).length;
    const otherBookingTotal = otherBookingSelections.reduce((sum, item) => sum + item.total, 0);
    const isSubmittedBookingsPage = location.pathname === '/bookings/submitted';

    const addOtherBookingSelection = () => {
      const selectedOption = assistantOtherBookingOptions.find((item) => item.id === otherBookingItemId);
      if (!selectedOption) return;
      const normalizedQuantity = Number.isFinite(otherBookingQuantity) ? Math.max(1, Math.round(otherBookingQuantity)) : 1;
      setOtherBookingSelections((prev) => {
        const existing = prev.find((item) => item.id === selectedOption.id);
        if (existing) {
          return prev.map((item) => item.id === selectedOption.id
            ? {
                ...item,
                quantity: item.quantity + normalizedQuantity,
                total: (item.quantity + normalizedQuantity) * item.unitPrice,
              }
            : item);
        }
        return [...prev, { ...selectedOption, quantity: normalizedQuantity, total: normalizedQuantity * selectedOption.unitPrice }];
      });
      setOtherBookingQuantity(1);
    };

    const applyOtherBookingToQuotedAmount = () => {
      if (otherBookingSelections.length === 0) {
        setMessage('Add at least one other booking item first.');
        return;
      }
      const details = otherBookingSelections.map((item) => `${item.label} x${item.quantity} = TZS ${item.total.toLocaleString()}`).join(' | ');
      onChange('quotedAmount', (Number(form.quotedAmount) || 0) + otherBookingTotal);
      onChange('notes', [form.notes, `Other Booking: ${details}`].filter(Boolean).join('\n'));
      setOtherBookingSelections([]);
      setAssistantTab('halls');
      setMessage('Other booking items applied to quoted amount.');
    };

    if (isSubmittedBookingsPage) {
      return (
        <ManagementPageTemplate
          pageTitle="Submitted Bookings"
          subtitle="Standalone list of bookings submitted from Assistant Hall desk."
          stats={[
            { title: 'My Bookings', value: `${assistantBookings.length}`, description: 'all submitted records' },
            { title: 'Sent to Cashier 1', value: `${sentToCashierCount}`, description: 'waiting payment workflow' },
            { title: 'Pending', value: `${assistantBookings.filter((entry) => entry.bookingStatus === 'pending').length}`, description: 'still pending approval' },
            { title: 'Updated', value: `${assistantBookings.filter((entry) => (entry.revision ?? 0) > 0).length}`, description: 'records edited at least once' },
          ]}
          sections={[]}
          action={
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Submitted Bookings</p>
                <Badge className="bg-slate-100 text-slate-700">{assistantBookings.length} records</Badge>
              </div>
              {assistantBookings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No submitted bookings yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {assistantBookings.map((booking) => (
                    <div key={booking.id} className={`rounded-2xl border p-4 text-sm ${booking.revision ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{booking.eventName}</p>
                        <div className="flex items-center gap-2">
                          {booking.revision ? <Badge className="bg-amber-100 text-amber-800">Updated x{booking.revision}</Badge> : null}
                          <Badge className="bg-blue-100 text-blue-700">Sent to Cashier 1</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-slate-600">{booking.hall} | {booking.date} | {booking.startTime}-{booking.endTime}</p>
                      <p className="text-slate-500">
                        {booking.customerName} ({booking.customerPhone}) | TZS {(Number(booking.quotedAmount) || 0).toLocaleString()} | Car: {carLabelMap[booking.carType ?? 'none']} (TZS {(Number(booking.carPrice) || 0).toLocaleString()})
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => beginEditBooking(booking.id)}>Edit Booking</Button>
                        <Button size="sm" variant="destructive" onClick={() => void handleDeleteBooking(booking.id)}>Delete Booking</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />
      );
    }

    return (
      <ManagementPageTemplate
        pageTitle="Bookings"
        subtitle="Hall Registration form and booking handoff to Cashier 1."
        stats={[
          { title: "Today's Bookings", value: stats[0].value, description: 'scheduled for today' },
          { title: 'Sent to Cashier 1', value: `${sentToCashierCount}`, description: 'waiting for payment processing' },
          { title: 'My Bookings', value: `${assistantBookings.length}`, description: 'created by you' },
          { title: 'Pending', value: `${assistantBookings.filter((entry) => entry.bookingStatus === 'pending').length}`, description: 'in booking workflow' },
        ]}
        sections={[
          {
            title: 'Assistant Booking Workflow',
            bullets: [
              'Fill hall registration details and quoted amount.',
              'Use Book to send booking to Cashier 1 dashboard.',
              'Inventory is visible as overview only.',
            ],
          },
        ]}
        action={
          <div className="space-y-6">
            <Tabs value={assistantTab} onValueChange={(value) => setAssistantTab(value as AssistantBookingsTab)} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="halls">Halls</TabsTrigger>
                <TabsTrigger value="other-booking">Other Booking</TabsTrigger>
                <TabsTrigger value="past-booking">Record Past Booking</TabsTrigger>
              </TabsList>

              <TabsContent value="halls">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Halls Booking Form</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking Date</p>
                      <input
                        type="date"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={form.date}
                        onChange={(event) => onChange('date', event.target.value)}
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">A. Client Information</p>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <input type="text" placeholder="Full Name / Jina Kamili" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} />
                        <input type="text" placeholder="Phone No. / Simu" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerPhone} onChange={(event) => onChange('customerPhone', event.target.value)} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">B. Event Details</p>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <input type="text" placeholder="Event Name" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventName} onChange={(event) => onChange('eventName', event.target.value)} />
                        <input type="text" placeholder="Event Type" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventType} onChange={(event) => onChange('eventType', event.target.value)} />
                        <input type="number" placeholder="No. of Guests / Idadi ya Wageni" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.expectedGuests || ''} onChange={(event) => onChange('expectedGuests', Number(event.target.value))} />
                        <select
                          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                          value={hallSelectValue(form.hall, formHallIsOther)}
                          onChange={(event) => {
                            if (event.target.value === HALL_OTHER_VALUE) {
                              setFormHallIsOther(true);
                              onChange('hall', '');
                              return;
                            }
                            setFormHallIsOther(false);
                            onChange('hall', event.target.value);
                          }}
                        >
                          <option value="">Select Hall</option>
                          {halls.map((hall) => (
                            <option key={hall} value={hall}>{hall}</option>
                          ))}
                          <option value={HALL_OTHER_VALUE}>Other hall</option>
                        </select>
                        {formHallIsOther ? (
                          <input
                            type="text"
                            placeholder="Hall name"
                            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                            value={form.hall}
                            onChange={(event) => onChange('hall', event.target.value)}
                          />
                        ) : null}
                        <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
                        <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">C. Payment Details</p>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <input type="number" placeholder="Quoted Amount (TZS)" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.quotedAmount || ''} onChange={(event) => onChange('quotedAmount', Number(event.target.value))} />
                        <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.carType ?? 'none'} onChange={(event) => onChange('carType', event.target.value as BookingCarType)}>
                          {carOptions.map((car) => (
                            <option key={car.value} value={car.value}>{car.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Car Amount (TZS)"
                          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                          value={Number(form.carPrice) || 0}
                          onChange={(event) => onChange('carPrice', Number(event.target.value))}
                        />
                        <input type="number" className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500" value={(Number(form.quotedAmount) || 0) + (Number(form.carPrice) || 0)} readOnly />
                        <input type="text" placeholder="Notes" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button size="sm" disabled={isSavingBooking || isRefreshingPage || !isBookingFormComplete} onClick={() => void handleCreateBooking(true)}>
                      {isSavingBooking
                        ? 'Saving...'
                        : editingBookingId ? 'Save Booking Changes' : 'Book & Send to Cashier 1'}
                    </Button>
                    {editingBookingId ? (
                      <Button size="sm" variant="outline" disabled={isRefreshingPage} onClick={() => { setEditingBookingId(null); setForm(initialForm); setFormHallIsOther(false); }}>
                        Cancel Edit
                      </Button>
                    ) : null}
                    {conflict ? <Badge className="bg-rose-100 text-rose-700">Conflict detected</Badge> : <Badge className="bg-emerald-100 text-emerald-700">No conflict</Badge>}
                    {message ? <span className="text-xs text-slate-600">{message}</span> : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="other-booking">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Bei ya Kukodisha Vifaa vya Mapambo</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={otherBookingItemId}
                      onChange={(event) => setOtherBookingItemId(event.target.value)}
                    >
                      {assistantOtherBookingOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} @ TZS {item.unitPrice.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={otherBookingQuantity}
                      onChange={(event) => setOtherBookingQuantity(Number(event.target.value))}
                    />
                    <Button size="sm" onClick={addOtherBookingSelection}>Add</Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {otherBookingSelections.length === 0 ? (
                      <p className="text-sm text-slate-600">No decoration items selected yet.</p>
                    ) : (
                      otherBookingSelections.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <p>{item.label} x{item.quantity}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-200 text-slate-900">TZS {item.total.toLocaleString()}</Badge>
                            <Button size="sm" variant="outline" onClick={() => setOtherBookingSelections((prev) => prev.filter((entry) => entry.id !== item.id))}>Remove</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700">Other Booking Total: TZS {otherBookingTotal.toLocaleString()}</Badge>
                    <Button size="sm" onClick={applyOtherBookingToQuotedAmount}>Apply to Quoted Amount</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="past-booking">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Record Past Booking (This Year)</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="date"
                      min={getYearStartIso()}
                      max={getTodayIso()}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={pastForm.date}
                      onChange={(event) => onPastChange('date', event.target.value)}
                    />
                    <select
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={hallSelectValue(pastForm.hall, pastHallIsOther)}
                      onChange={(event) => {
                        if (event.target.value === HALL_OTHER_VALUE) {
                          setPastHallIsOther(true);
                          onPastChange('hall', '');
                          return;
                        }
                        setPastHallIsOther(false);
                        onPastChange('hall', event.target.value);
                      }}
                    >
                      <option value="">Select Hall</option>
                      {halls.map((hall) => (
                        <option key={hall} value={hall}>{hall}</option>
                      ))}
                      <option value={HALL_OTHER_VALUE}>Other hall</option>
                    </select>
                    {pastHallIsOther ? (
                      <input
                        type="text"
                        placeholder="Hall name"
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                        value={pastForm.hall}
                        onChange={(event) => onPastChange('hall', event.target.value)}
                      />
                    ) : null}
                    <input type="text" placeholder="Customer Name" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.customerName} onChange={(event) => onPastChange('customerName', event.target.value)} />
                    <input type="text" placeholder="Customer Phone" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.customerPhone} onChange={(event) => onPastChange('customerPhone', event.target.value)} />
                    <input type="text" placeholder="Event Name" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.eventName} onChange={(event) => onPastChange('eventName', event.target.value)} />
                    <input type="text" placeholder="Event Type" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.eventType} onChange={(event) => onPastChange('eventType', event.target.value)} />
                    <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.startTime} onChange={(event) => onPastChange('startTime', event.target.value)} />
                    <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.endTime} onChange={(event) => onPastChange('endTime', event.target.value)} />
                    <input type="number" placeholder="Expected Guests" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.expectedGuests || ''} onChange={(event) => onPastChange('expectedGuests', Number(event.target.value))} />
                    <input type="number" placeholder="Amount Paid / Quoted (TZS)" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.quotedAmount || ''} onChange={(event) => onPastChange('quotedAmount', Number(event.target.value))} />
                    <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={pastForm.carType ?? 'none'} onChange={(event) => onPastChange('carType', event.target.value as BookingCarType)}>
                      {carOptions.map((car) => (
                        <option key={car.value} value={car.value}>{car.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Car Amount (TZS)"
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={Number(pastForm.carPrice) || 0}
                      onChange={(event) => onPastChange('carPrice', Number(event.target.value))}
                    />
                    <input type="text" placeholder="Notes" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2" value={pastForm.notes} onChange={(event) => onPastChange('notes', event.target.value)} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button size="sm" disabled={isSavingPastBooking || isRefreshingPage || !isPastFormComplete} onClick={() => void handleRecordPastBooking()}>
                      {isSavingPastBooking ? 'Saving...' : 'Record Past Booking'}
                    </Button>
                    <span className="text-xs text-slate-500">Allowed date range: {getYearStartIso()} to {getTodayIso()}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    );
  }

  if (isCashier1) {
    const cashierBookings = bookings.filter(
      (entry) =>
        entry.bookingStatus !== 'cancelled'
        && entry.bookingStatus !== 'rejected',
    );
    const selected = cashierBookings.find((entry) => entry.id === selectedBookingId) ?? null;
    const pendingApprovalBookings = cashierBookings.filter(
      (entry) => entry.bookingStatus === 'pending' && !entry.pastBookingSubmission,
    );
    const partialPaymentBookings = cashierBookings.filter((entry) => {
      if (entry.bookingStatus !== 'approved') return false;
      const itemFinancials = getBookingFinancials(entry.id);
      return itemFinancials.balance > 0;
    });
    const completedPaymentBookings = cashierBookings.filter((entry) => {
      if (entry.bookingStatus !== 'approved' && entry.bookingStatus !== 'completed') return false;
      const itemFinancials = getBookingFinancials(entry.id);
      return itemFinancials.quotedAmount > 0 && itemFinancials.balance <= 0;
    });
    const selectedPartial = partialPaymentBookings.find((entry) => entry.id === selectedBookingId) ?? null;
    const financials = selectedPartial ? getBookingFinancials(selectedPartial.id) : null;
    const bookingPayments = selectedPartial ? payments.filter((item) => item.bookingId === selectedPartial.id) : [];
    const quotedAmount = (Number(selected?.quotedAmount) || 0) + (Number(selected?.carPrice) || 0);
    const totalPaidSoFar = financials?.totalPaid ?? 0;
    const installmentDraftTotal = confirmInstallments.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? Number(row.amount) : 0), 0);
    const totalAfterDraft = totalPaidSoFar + installmentDraftTotal;
    const canCompleteEvent = Boolean(selected && financials && financials.balance <= 0 && selected.bookingStatus !== 'completed');
    const pendingPastBookings = bookings.filter(
      (entry) =>
        entry.pastBookingSubmission
        && entry.pastBookingApprovalStatus === 'pending_cashier_1'
        && entry.bookingStatus === 'pending',
    );
    const paymentMethodBreakdown = bookingPayments.reduce(
      (acc, payment) => {
        if (payment.method === 'cash') acc.cash += payment.amount;
        if (payment.method === 'bank_transfer') acc.bankTransfer += payment.amount;
        if (payment.method === 'mobile_money') acc.mobileMoney += payment.amount;
        return acc;
      },
      { cash: 0, bankTransfer: 0, mobileMoney: 0 },
    );

    const saveConfirmBookingInstallments = async () => {
      if (!selected) return;
      if (isRecordingPayment || isRefreshingPage) return;
      if (confirmInstallments.length === 0) {
        setMessage('Add at least one installment payment.');
        return;
      }
      const invalidInstallment = confirmInstallments.find(
        (item) => !Number.isFinite(item.amount) || item.amount <= 0 || !item.receivedAt,
      );
      if (invalidInstallment) {
        setMessage('Each installment must include amount greater than zero and payment date/time.');
        return;
      }

      setIsRecordingPayment(true);
      let successfulPayments = 0;
      for (const installment of confirmInstallments) {
        const paymentResult = await recordPayment({
          actionId: crypto.randomUUID(),
          bookingId: selected.id,
          amount: installment.amount,
          method: installment.method,
          receivedAt: installment.receivedAt,
          notes: installment.notes || 'Installment recorded during booking confirmation.',
        });
        if (!paymentResult.ok) {
          setMessage(paymentResult.message);
          toast({ title: 'Payment failed', description: paymentResult.message, variant: 'destructive' });
          setIsRecordingPayment(false);
          return;
        }
        successfulPayments += 1;
      }

      if (selected.bookingStatus === 'pending') {
        const confirmResult = await updateBookingStatus(selected.id, 'approved');
        if (!confirmResult.ok) {
          setMessage(confirmResult.message);
          toast({ title: 'Booking confirmation failed', description: confirmResult.message, variant: 'destructive' });
          setIsRecordingPayment(false);
          return;
        }
      }

      setIsConfirmBookingModalOpen(false);
      setConfirmInstallments([]);
      setMessage(`Booking confirmed with ${successfulPayments} installment payment(s).`);
      toast({
        title: 'Booking confirmed',
        description: `Recorded ${successfulPayments} installment payment(s).`,
      });
      setSelectedBookingId(selected.id);
      const bookingTotalDue = (Number(selected.quotedAmount) || 0) + (Number(selected.carPrice) || 0);
      if (Math.max(bookingTotalDue - totalAfterDraft, 0) <= 0) {
        setCashierTab('completed-payment');
      } else {
        setCashierTab('partial-payment');
      }
      setIsRecordingPayment(false);
    };

    return (
      <ManagementPageTemplate
        pageTitle="Bookings"
        subtitle="Cashier 1 workflow for approvals, partial payments, and completed payments."
        stats={[
          { title: 'Pending Approval', value: `${pendingApprovalBookings.length}`, description: 'bookings not yet confirmed' },
          { title: 'Partial Payment', value: `${partialPaymentBookings.length}`, description: 'approved bookings still owing' },
          { title: 'Completed Payment', value: `${completedPaymentBookings.length}`, description: 'fully paid bookings' },
          { title: "Today's Records", value: `${payments.filter((item) => item.receivedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}`, description: 'payments tracked today' },
        ]}
        sections={[
          {
            title: 'Cashier 1 Booking Payment Workflow',
            bullets: [
              'Pending Approval tab is for bookings waiting cashier confirmation.',
              'Partial Payment tab is for confirmed bookings with remaining balance.',
              'Completed Payment tab tracks fully paid bookings and event completion.',
            ],
          },
        ]}
        action={
          <div className="space-y-6">
            {editingBookingId ? (
              <div className="rounded-3xl border border-amber-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Editing booking {editingBookingId}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="text" placeholder="Customer Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} />
                  <input type="text" placeholder="Customer Phone" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerPhone} onChange={(event) => onChange('customerPhone', event.target.value)} />
                  <input type="text" placeholder="Event Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventName} onChange={(event) => onChange('eventName', event.target.value)} />
                  <input type="text" placeholder="Event Type" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventType} onChange={(event) => onChange('eventType', event.target.value)} />
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={hallSelectValue(form.hall, formHallIsOther)}
                    onChange={(event) => {
                      if (event.target.value === HALL_OTHER_VALUE) {
                        setFormHallIsOther(true);
                        onChange('hall', '');
                        return;
                      }
                      setFormHallIsOther(false);
                      onChange('hall', event.target.value);
                    }}
                  >
                    <option value="">Select Hall</option>
                    {halls.map((hall) => (
                      <option key={hall} value={hall}>{hall}</option>
                    ))}
                    <option value={HALL_OTHER_VALUE}>Other hall</option>
                  </select>
                  {formHallIsOther ? (
                    <input
                      type="text"
                      placeholder="Hall name"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={form.hall}
                      onChange={(event) => onChange('hall', event.target.value)}
                    />
                  ) : null}
                  <input type="date" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.date} onChange={(event) => onChange('date', event.target.value)} />
                  <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
                  <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
                  <input type="number" placeholder="Expected Guests" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.expectedGuests || ''} onChange={(event) => onChange('expectedGuests', Number(event.target.value))} />
                  <input type="number" placeholder="Quoted Amount (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.quotedAmount || ''} onChange={(event) => onChange('quotedAmount', Number(event.target.value))} />
                  <select className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.carType ?? 'none'} onChange={(event) => onChange('carType', event.target.value as BookingCarType)}>
                    {carOptions.map((car) => (
                      <option key={car.value} value={car.value}>{car.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Car Amount (TZS)"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={Number(form.carPrice) || 0}
                    onChange={(event) => onChange('carPrice', Number(event.target.value))}
                  />
                  <input type="text" placeholder="Notes" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button size="sm" disabled={isSavingBooking || isRefreshingPage || !isBookingFormComplete} onClick={() => void handleCreateBooking()}>
                    {isSavingBooking ? 'Saving...' : 'Save Booking Changes'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingBooking || isRefreshingPage}
                    onClick={() => {
                      setEditingBookingId(null);
                      setForm(initialForm);
                      setFormHallIsOther(false);
                      setMessage('Edit cancelled.');
                    }}
                  >
                    Cancel Edit
                  </Button>
                </div>
              </div>
            ) : null}

            <Tabs value={cashierTab} onValueChange={(value) => setCashierTab(value as CashierBookingsTab)} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
                <TabsTrigger value="partial-payment">Partial Payment</TabsTrigger>
                <TabsTrigger value="completed-payment">Completed Payment</TabsTrigger>
              </TabsList>

              <TabsContent value="pending-approval" className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending Booking Confirmation</p>
                    <Badge className="bg-slate-100 text-slate-700">{pendingApprovalBookings.length} pending</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {pendingApprovalBookings.length === 0 ? (
                      <p className="text-sm text-slate-600">No pending bookings to confirm.</p>
                    ) : (
                      pendingApprovalBookings.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{entry.id} | {entry.eventName}</p>
                            <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                          </div>
                          <p className="text-slate-600">{entry.customerName} ({entry.customerPhone})</p>
                          <p className="text-slate-500">{entry.hall} | {entry.date} | {entry.startTime}-{entry.endTime}</p>
                          <p className="text-slate-500">Quoted: TZS {(Number(entry.quotedAmount) || 0).toLocaleString()}</p>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              disabled={isRecordingPayment || isRefreshingPage}
                              onClick={() => openConfirmBookingModal(entry.id)}
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Past Booking Submissions (Assistant)</p>
                <Badge className="bg-slate-100 text-slate-700">{pendingPastBookings.length} pending</Badge>
              </div>
              <div className="mt-3 space-y-3">
                {pendingPastBookings.length === 0 ? (
                  <p className="text-sm text-slate-600">No pending past bookings for approval.</p>
                ) : (
                  pendingPastBookings.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{entry.id} | {entry.eventName}</p>
                        <Badge className="bg-amber-100 text-amber-800">Pending Cashier 1</Badge>
                      </div>
                      <p className="text-slate-600">{entry.customerName} ({entry.customerPhone})</p>
                      <p className="text-slate-500">{entry.hall} | {entry.date} | {entry.startTime}-{entry.endTime}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-4">
                        <input
                          type="number"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          placeholder="Paid Amount"
                          value={pastApprovalAmount[entry.id] ?? entry.quotedAmount}
                          onChange={(event) => setPastApprovalAmount((prev) => ({ ...prev, [entry.id]: Number(event.target.value) }))}
                        />
                        <select
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          value={pastApprovalMethod[entry.id] ?? 'cash'}
                          onChange={(event) => setPastApprovalMethod((prev) => ({ ...prev, [entry.id]: event.target.value as PaymentMethod }))}
                        >
                          {cashierPaymentMethods.map((method) => (
                            <option key={method.value} value={method.value}>{method.label}</option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          value={pastApprovalDateTime[entry.id] ?? getDefaultPaidDateTime()}
                          onChange={(event) => setPastApprovalDateTime((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                        />
                        <input
                          type="text"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          placeholder="Payment note"
                          value={pastApprovalNotes[entry.id] ?? ''}
                          onChange={(event) => setPastApprovalNotes((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          disabled={isRefreshingPage}
                          onClick={async () => {
                            if (Date.now() - lastPaymentActionAtRef.current < 900) return;
                            const amount = Number.isFinite(pastApprovalAmount[entry.id])
                              ? Number(pastApprovalAmount[entry.id])
                              : Number(entry.quotedAmount);
                            if (!Number.isFinite(amount) || amount <= 0) {
                              setMessage('Enter a valid paid amount for past booking approval.');
                              return;
                            }
                            const paymentResult = await recordPayment({
                              actionId: crypto.randomUUID(),
                              bookingId: entry.id,
                              amount,
                              method: pastApprovalMethod[entry.id] ?? 'cash',
                              receivedAt: pastApprovalDateTime[entry.id] ?? getDefaultPaidDateTime(),
                              notes: pastApprovalNotes[entry.id] ?? 'Past booking payment recorded by Cashier 1',
                            });
                            if (!paymentResult.ok) {
                              setMessage(paymentResult.message);
                              toast({ title: 'Payment failed', description: paymentResult.message, variant: 'destructive' });
                              return;
                            }
                            const reviewResult = await reviewPastBooking(entry.id, 'approved_cashier_1');
                            setMessage(reviewResult.message);
                            toast({
                              title: reviewResult.ok ? 'Past booking approved' : 'Past booking approval failed',
                              description: reviewResult.message,
                              variant: reviewResult.ok ? 'default' : 'destructive',
                            });
                            if (reviewResult.ok) {
                              lastPaymentActionAtRef.current = Date.now();
                              refreshPageAfterUpdate('Past booking payment recorded and approved. Refreshing page...');
                            }
                          }}
                        >
                          Record & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRefreshingPage}
                          onClick={async () => {
                            const reviewResult = await reviewPastBooking(entry.id, 'rejected_cashier_1');
                            setMessage(reviewResult.message);
                            if (reviewResult.ok) {
                              refreshPageAfterUpdate('Past booking rejected. Refreshing page...');
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            </TabsContent>

            <TabsContent value="partial-payment" className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Registered Bookings</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <select
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={selectedBookingId}
                  onChange={(event) => setSelectedBookingId(event.target.value)}
                >
                  <option value="">Select approved booking with partial payment</option>
                  {partialPaymentBookings.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.id} | {entry.customerName} | {entry.eventName}
                    </option>
                  ))}
                </select>
                {selectedPartial && financials ? (
                  <Badge className="bg-slate-100 text-slate-700 self-center">Left: TZS {financials.balance.toLocaleString()}</Badge>
                ) : null}
              </div>
            </div>

            {selectedPartial ? (
              <>
                <div className={`rounded-3xl border bg-white p-5 shadow-sm ${selectedPartial.revision ? 'border-amber-300' : 'border-slate-200'}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking Details (Approved)</p>
                  {selectedPartial.revision ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      Updated booking revision x{selectedPartial.revision}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p><span className="font-semibold">Booking:</span> {selectedPartial.id}</p>
                    <p><span className="font-semibold">Customer:</span> {selectedPartial.customerName}</p>
                    <p><span className="font-semibold">Phone:</span> {selectedPartial.customerPhone}</p>
                    <p><span className="font-semibold">Event:</span> {selectedPartial.eventName}</p>
                    <p><span className="font-semibold">Hall:</span> {selectedPartial.hall}</p>
                    <p><span className="font-semibold">Date:</span> {selectedPartial.date}</p>
                    <p><span className="font-semibold">Time:</span> {selectedPartial.startTime} - {selectedPartial.endTime}</p>
                    <p><span className="font-semibold">Quoted Amount:</span> TZS {(Number(selectedPartial.quotedAmount) || 0).toLocaleString()}</p>
                    <p><span className="font-semibold">Car:</span> {carLabelMap[selectedPartial.carType ?? 'none']} (TZS {(Number(selectedPartial.carPrice) || 0).toLocaleString()})</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-700">Status: {toShortStatus(selectedPartial.bookingStatus)}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRefreshingPage}
                      onClick={() => beginEditBooking(selectedPartial.id)}
                    >
                      Edit Booking
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Section</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    >
                      {cashierPaymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount Paid (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={paidAmount || ''}
                      onChange={(event) => setPaidAmount(Number(event.target.value))}
                    />
                    <input
                      type="datetime-local"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={paidDateTime}
                      onChange={(event) => setPaidDateTime(event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Notes / Comment"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.target.value)}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          disabled={isRecordingPayment || isRefreshingPage || !Number.isFinite(paidAmount) || paidAmount <= 0 || !paidDateTime}
                          onClick={async () => {
                            if (isRecordingPayment || isRefreshingPage) return;
                            if (Date.now() - lastPaymentActionAtRef.current < 900) return;
                            if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
                              setMessage('Enter a valid payment amount greater than zero.');
                              toast({ title: 'Invalid payment amount', description: 'Enter a valid payment amount greater than zero.', variant: 'destructive' });
                              return;
                            }
                            if (!paidDateTime) {
                              setMessage('Enter paid date and time before submitting.');
                              toast({ title: 'Missing paid date/time', description: 'Enter paid date and time before submitting.', variant: 'destructive' });
                              return;
                            }
                            const currentBalance = financials?.balance ?? 0;
                            setIsRecordingPayment(true);
                            const result = await recordPayment({
                              actionId: crypto.randomUUID(),
                              bookingId: selectedPartial.id,
                              amount: paidAmount,
                              method: paymentMethod,
                              receivedAt: paidDateTime || undefined,
                              notes: paymentNotes,
                            });
                            setMessage(result.message);
                            toast({
                              title: result.ok ? 'Payment submitted' : 'Payment failed',
                              description: result.message,
                              variant: result.ok ? 'default' : 'destructive',
                            });
                            if (result.ok) {
                              const remainingBalance = Math.max(currentBalance - paidAmount, 0);
                              setPaidAmount(0);
                              setPaidDateTime(getDefaultPaidDateTime());
                              setPaymentNotes('');
                              lastPaymentActionAtRef.current = Date.now();
                              refreshPageAfterUpdate(
                                `Payment recorded successfully. Remaining balance: TZS ${remainingBalance.toLocaleString()}. Refreshing page...`,
                              );
                        }
                        setIsRecordingPayment(false);
                      }}
                    >
                      {isRecordingPayment ? 'Saving...' : isRefreshingPage ? 'Refreshing...' : 'Add Payment'}
                    </Button>
                    {financials ? <Badge className="bg-slate-100 text-slate-700">Remaining: TZS {financials.balance.toLocaleString()}</Badge> : null}
                    {message ? <span className="text-xs text-slate-600">{message}</span> : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Tracking by Date, Module and Comment</p>
                    <Badge className="bg-emerald-100 text-emerald-800">Cash: TZS {paymentMethodBreakdown.cash.toLocaleString()}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">Bank: TZS {paymentMethodBreakdown.bankTransfer.toLocaleString()}</Badge>
                    <Badge className="bg-violet-100 text-violet-800">Mobile: TZS {paymentMethodBreakdown.mobileMoney.toLocaleString()}</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {bookingPayments.length === 0 ? (
                      <p className="text-sm text-slate-600">No payment entries yet for this booking.</p>
                    ) : (
                      bookingPayments.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">TZS {entry.amount.toLocaleString()}</p>
                            <Badge className="bg-slate-200 text-slate-900">{new Date(entry.receivedAt).toLocaleDateString()}</Badge>
                          </div>
                          <p className="text-slate-600">{new Date(entry.receivedAt).toLocaleString()}</p>
                          <p className="text-slate-500">Module: {toShortStatus(entry.method)}</p>
                          <p className="text-slate-500">Comment: {entry.notes || '-'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            </TabsContent>

            <TabsContent value="completed-payment" className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fully Paid Bookings</p>
                  <Badge className="bg-slate-100 text-slate-700">{completedPaymentBookings.length} completed payments</Badge>
                </div>
                <div className="mt-3 space-y-3">
                  {completedPaymentBookings.length === 0 ? (
                    <p className="text-sm text-slate-600">No bookings with completed payment yet.</p>
                  ) : (
                    completedPaymentBookings.map((entry) => {
                      const entryPayments = payments
                        .filter((item) => item.bookingId === entry.id)
                        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
                      const completedAt = entryPayments[0]?.receivedAt;
                      const entryFinancials = getBookingFinancials(entry.id);
                      return (
                        <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{entry.id} | {entry.eventName}</p>
                            {entry.bookingStatus === 'completed' ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Event Completed</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700">Payment Complete</Badge>
                            )}
                          </div>
                          <p className="text-slate-600">{entry.customerName} ({entry.customerPhone})</p>
                          <p className="text-slate-500">Quoted: TZS {entryFinancials.quotedAmount.toLocaleString()} | Paid: TZS {entryFinancials.totalPaid.toLocaleString()}</p>
                          <p className="text-slate-500">Payment completed at: {completedAt ? new Date(completedAt).toLocaleString() : '-'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRefreshingPage}
                              onClick={() => beginEditBooking(entry.id)}
                            >
                              Edit Booking
                            </Button>
                            {entry.bookingStatus !== 'completed' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isRefreshingPage}
                                onClick={() => void handleBookingStatus(entry.id, 'completed')}
                              >
                                Complete Event
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
            </Tabs>

            {isConfirmBookingModalOpen && selected ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Confirm Booking Installments</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (isRecordingPayment) return;
                        setIsConfirmBookingModalOpen(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-3">
                    <p><span className="font-semibold">Booking:</span> {selected.id}</p>
                    <p><span className="font-semibold">Quoted (locked):</span> TZS {quotedAmount.toLocaleString()}</p>
                    <p><span className="font-semibold">Paid so far:</span> TZS {totalPaidSoFar.toLocaleString()}</p>
                    <p><span className="font-semibold">Draft installments:</span> TZS {installmentDraftTotal.toLocaleString()}</p>
                    <p><span className="font-semibold">After save:</span> TZS {totalAfterDraft.toLocaleString()}</p>
                    <p><span className="font-semibold">Remaining after save:</span> TZS {Math.max(quotedAmount - totalAfterDraft, 0).toLocaleString()}</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {confirmInstallments.map((row, index) => (
                      <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Installment {index + 1}</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-4">
                          <input
                            type="datetime-local"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                            value={row.receivedAt}
                            onChange={(event) => setConfirmInstallments((prev) => prev.map((item) => (item.id === row.id ? { ...item, receivedAt: event.target.value } : item)))}
                          />
                          <select
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                            value={row.method}
                            onChange={(event) => setConfirmInstallments((prev) => prev.map((item) => (item.id === row.id ? { ...item, method: event.target.value as PaymentMethod } : item)))}
                          >
                            {cashierPaymentMethods.map((method) => (
                              <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Amount"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                            value={row.amount || ''}
                            onChange={(event) => setConfirmInstallments((prev) => prev.map((item) => (item.id === row.id ? { ...item, amount: Number(event.target.value) } : item)))}
                          />
                          <input
                            type="text"
                            placeholder="Notes"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                            value={row.notes}
                            onChange={(event) => setConfirmInstallments((prev) => prev.map((item) => (item.id === row.id ? { ...item, notes: event.target.value } : item)))}
                          />
                        </div>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmInstallments.length === 1 || isRecordingPayment}
                            onClick={() => setConfirmInstallments((prev) => prev.filter((item) => item.id !== row.id))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingPayment}
                      onClick={() => setConfirmInstallments((prev) => [...prev, createInstallmentEntry()])}
                    >
                      Add Installment
                    </Button>
                    <Button
                      size="sm"
                      disabled={isRecordingPayment || isRefreshingPage}
                      onClick={() => void saveConfirmBookingInstallments()}
                    >
                      {isRecordingPayment ? 'Saving...' : 'Save & Confirm Booking'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        }
      />
    );
  }

  return (
    <ManagementPageTemplate
      pageTitle="Bookings"
      subtitle={isManager ? 'Hall Manager oversight of booking records and statuses.' : 'Booking and event approval workflow with conflict checks and status controls.'}
      stats={stats}
      sections={[
        {
          title: 'Workflow',
          bullets: [
            'Controller manages booking and event approvals.',
            'Accountant can submit recommendations to Hall Manager.',
            'Conflict checks run before a booking is submitted for approval.',
          ],
        },
      ]}
      action={
        <div className="space-y-6">
          {canCreateBooking ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create Booking Request</p>
              {editingBookingId ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Editing booking {editingBookingId}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="text" placeholder="Customer Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} />
                <input type="text" placeholder="Customer Phone" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerPhone} onChange={(event) => onChange('customerPhone', event.target.value)} />
                <input type="text" placeholder="Event Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventName} onChange={(event) => onChange('eventName', event.target.value)} />
                <input type="text" placeholder="Event Type" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventType} onChange={(event) => onChange('eventType', event.target.value)} />
                <select
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={hallSelectValue(form.hall, formHallIsOther)}
                  onChange={(event) => {
                    if (event.target.value === HALL_OTHER_VALUE) {
                      setFormHallIsOther(true);
                      onChange('hall', '');
                      return;
                    }
                    setFormHallIsOther(false);
                    onChange('hall', event.target.value);
                  }}
                >
                  <option value="">Select Hall</option>
                  {halls.map((hall) => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                  <option value={HALL_OTHER_VALUE}>Other hall</option>
                </select>
                {formHallIsOther ? (
                  <input
                    type="text"
                    placeholder="Hall name"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                    value={form.hall}
                    onChange={(event) => onChange('hall', event.target.value)}
                  />
                ) : null}
                <input type="date" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.date} onChange={(event) => onChange('date', event.target.value)} />
                <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
                <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
                <input type="number" placeholder="Expected Guests" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.expectedGuests || ''} onChange={(event) => onChange('expectedGuests', Number(event.target.value))} />
                <input type="number" placeholder="Quoted Amount (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.quotedAmount || ''} onChange={(event) => onChange('quotedAmount', Number(event.target.value))} />
                <select className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.carType ?? 'none'} onChange={(event) => onChange('carType', event.target.value as BookingCarType)}>
                  {carOptions.map((car) => (
                    <option key={car.value} value={car.value}>{car.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Car Amount (TZS)"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={Number(form.carPrice) || 0}
                  onChange={(event) => onChange('carPrice', Number(event.target.value))}
                />
                <input type="text" placeholder="Notes" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={isSavingBooking || isRefreshingPage || !isBookingFormComplete} onClick={() => void handleCreateBooking()}>
                  {isSavingBooking ? 'Saving...' : editingBookingId ? 'Save Booking Changes' : 'Submit Booking'}
                </Button>
                {editingBookingId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingBooking || isRefreshingPage}
                    onClick={() => {
                      setEditingBookingId(null);
                      setForm(initialForm);
                      setFormHallIsOther(false);
                      setMessage('Edit cancelled.');
                    }}
                  >
                    Cancel Edit
                  </Button>
                ) : null}
                {conflict ? <Badge className="bg-rose-100 text-rose-700">Conflict detected</Badge> : <Badge className="bg-emerald-100 text-emerald-700">No conflict</Badge>}
                {message ? <span className="text-xs text-slate-600">{message}</span> : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking Queue</p>
              <Badge className="bg-slate-100 text-slate-700">{bookings.length} records</Badge>
            </div>
            {bookings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No booking requests yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className={`rounded-2xl border p-4 text-sm ${booking.revision ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{booking.eventName}</p>
                      <div className="flex gap-2">
                        {booking.revision ? <Badge className="bg-amber-100 text-amber-800">Updated x{booking.revision}</Badge> : null}
                        <Badge className="bg-slate-200 text-slate-900">Booking: {toShortStatus(booking.bookingStatus)}</Badge>
                        <Badge className="bg-slate-200 text-slate-900">Event: {toShortStatus(booking.eventDetailStatus)}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-slate-600">{booking.hall} | {booking.date} | {booking.startTime}-{booking.endTime}</p>
                    <p className="text-slate-500">
                      {booking.customerName} ({booking.customerPhone}) | {booking.eventType} | {booking.expectedGuests} guests | TZS {(Number(booking.quotedAmount) || 0).toLocaleString()} | Car: {carLabelMap[booking.carType ?? 'none']} (TZS {(Number(booking.carPrice) || 0).toLocaleString()})
                    </p>
                    {booking.pastBookingSubmission ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                        Past Record: {toShortStatus(booking.pastBookingApprovalStatus ?? 'pending_cashier_1')}
                        {booking.pastReviewedAt ? ` | ${new Date(booking.pastReviewedAt).toLocaleString()}` : ''}
                      </p>
                    ) : null}
                    {booking.createdByUserId === 'public-web' ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Source: Public Web Booking</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canManageBookings && booking.bookingStatus === 'pending' ? (
                        <>
                          <Button size="sm" onClick={() => void handleBookingStatus(booking.id, 'approved')}>Approve Booking</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleBookingStatus(booking.id, 'rejected')}>Reject Booking</Button>
                        </>
                      ) : null}

                      {canManageBookings && booking.eventDetailStatus === 'pending_assistant' ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => void handleEventStatus(booking.id, 'approved_assistant')}>Approve Event Details</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleEventStatus(booking.id, 'rejected')}>Reject Event Details</Button>
                        </>
                      ) : null}

                      {canFinalizeEvent && booking.eventDetailStatus === 'pending_controller' ? (
                        <>
                          <Button size="sm" onClick={() => void handleEventStatus(booking.id, 'approved_controller')}>Final Authorize Event</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleEventStatus(booking.id, 'rejected')}>Final Reject Event</Button>
                        </>
                      ) : null}

                      {canManageBookings && booking.bookingStatus === 'approved' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => void handleBookingStatus(booking.id, 'cancelled')}>Cancel</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleBookingStatus(booking.id, 'completed')}>Complete</Button>
                        </>
                      ) : null}

                      {(user?.role === 'controller' || user?.role === 'manager') ? (
                        <Button size="sm" variant="outline" onClick={() => beginEditBooking(booking.id)}>
                          Edit Booking
                        </Button>
                      ) : null}

                      {(canDeleteAnyBooking || booking.createdByUserId === user?.id) ? (
                        <Button size="sm" variant="destructive" onClick={() => void handleDeleteBooking(booking.id)}>
                          Delete Booking
                        </Button>
                      ) : null}

                      {canAccountantReview ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => void handleAccountantDecision(booking.id, 'approve')}>Recommend Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleAccountantDecision(booking.id, 'disapprove')}>Recommend Disapprove</Button>
                        </>
                      ) : null}
                    </div>
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
