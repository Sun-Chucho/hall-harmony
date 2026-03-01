import { useMemo, useState } from 'react';
import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { useMessages } from '@/contexts/MessageContext';
import { usePayments } from '@/contexts/PaymentContext';
import { CreateBookingInput } from '@/types/booking';

const halls = [
  'Witness Hall',
  'Kilimanjaro Hall',
  'Garden Deck',
  'Hall D',
];

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
  notes: '',
};

function toShortStatus(value: string) {
  return value.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Bookings() {
  const { user } = useAuth();
  const {
    bookings,
    createBooking,
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
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');

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
  const canCreateBooking = user?.role === 'controller';
  const canDeleteAnyBooking = user?.role === 'controller' || user?.role === 'manager';

  const conflict = form.hall && form.date && form.startTime && form.endTime
    ? hasConflict(form)
    : false;

  const onChange = <K extends keyof CreateBookingInput>(field: K, value: CreateBookingInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBooking = async (assistantFlow = false) => {
    if (isSavingBooking) return;
    setIsSavingBooking(true);
    const editingId = editingBookingId;
    try {
      const result = editingBookingId
        ? await updateBooking(editingBookingId, form)
        : await createBooking(form);
      if (assistantFlow && result.ok && !editingBookingId) {
        setMessage('Booked and sent to Cashier 1 dashboard.');
      } else {
        setMessage(result.message);
      }
      if (result.ok) {
        if (editingId) {
          await sendManagerAlert({
            bookingId: editingId,
            title: 'Booking Updated by Assistant Hall',
            body: `Booking ${editingId} updated: ${form.eventName} on ${form.date} ${form.startTime}-${form.endTime}.`,
          });
        }
        setForm(initialForm);
        setEditingBookingId(null);
      }
    } finally {
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
      notes: target.notes,
    });
    setEditingBookingId(bookingId);
  };

  const handleBookingStatus = async (bookingId: string, status: 'approved' | 'rejected' | 'cancelled' | 'completed') => {
    const result = await updateBookingStatus(bookingId, status);
    setMessage(result.message);
  };

  const handleEventStatus = async (bookingId: string, status: 'approved_assistant' | 'approved_controller' | 'rejected') => {
    const result = await updateEventDetailStatus(bookingId, status);
    setMessage(result.message);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const result = await deleteBooking(bookingId);
    setMessage(result.message);
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
  };

  if (isAssistantHall && user) {
    const assistantBookings = bookings.filter((entry) => entry.createdByUserId === user.id);
    const sentToCashierCount = assistantBookings.filter((entry) => entry.assignedToRole === 'cashier_1').length;

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
            <Tabs defaultValue="hall-registration" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="hall-registration">Hall Registration Form</TabsTrigger>
                <TabsTrigger value="submitted-bookings">Submitted Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value="hall-registration">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Hall Registration Form</p>
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
                        <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.hall} onChange={(event) => onChange('hall', event.target.value)}>
                          <option value="">Select Hall</option>
                          {halls.map((hall) => (
                            <option key={hall} value={hall}>{hall}</option>
                          ))}
                        </select>
                        <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
                        <input type="time" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">C. Payment Details</p>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <input type="number" placeholder="Quoted Amount (TZS)" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.quotedAmount || ''} onChange={(event) => onChange('quotedAmount', Number(event.target.value))} />
                        <input type="number" className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500" value={Number(form.quotedAmount) || 0} readOnly />
                        <input type="text" placeholder="Notes" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm md:col-span-2" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button size="sm" disabled={isSavingBooking} onClick={() => void handleCreateBooking(true)}>
                      {isSavingBooking
                        ? 'Saving...'
                        : editingBookingId ? 'Save Booking Changes' : 'Book & Send to Cashier 1'}
                    </Button>
                    {editingBookingId ? (
                      <Button size="sm" variant="outline" onClick={() => { setEditingBookingId(null); setForm(initialForm); }}>
                        Cancel Edit
                      </Button>
                    ) : null}
                    {conflict ? <Badge className="bg-rose-100 text-rose-700">Conflict detected</Badge> : <Badge className="bg-emerald-100 text-emerald-700">No conflict</Badge>}
                    {message ? <span className="text-xs text-slate-600">{message}</span> : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="submitted-bookings">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">My Submitted Bookings</p>
                    <Badge className="bg-slate-100 text-slate-700">{assistantBookings.length} records</Badge>
                  </div>
                  {assistantBookings.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">No booking requests yet.</p>
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
                          <p className="text-slate-500">{booking.customerName} ({booking.customerPhone}) | TZS {(Number(booking.quotedAmount) || 0).toLocaleString()}</p>
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => beginEditBooking(booking.id)}>Edit Booking</Button>
                              <Button size="sm" variant="destructive" onClick={() => void handleDeleteBooking(booking.id)}>Delete Booking</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        }
      />
    );
  }

  if (isCashier1) {
    const cashierBookings = bookings.filter((entry) => entry.assignedToRole === 'cashier_1');
    const selected = cashierBookings.find((entry) => entry.id === selectedBookingId) ?? null;
    const financials = selected ? getBookingFinancials(selected.id) : null;
    const bookingPayments = selected ? payments.filter((item) => item.bookingId === selected.id) : [];

    return (
      <ManagementPageTemplate
        pageTitle="Bookings"
        subtitle="Registered bookings from Assistant Halls with payment tracking."
        stats={[
          { title: 'Registered Bookings', value: `${cashierBookings.length}`, description: 'from assistant hall desk' },
          { title: 'Selected Balance', value: selected && financials ? `TZS ${financials.balance.toLocaleString()}` : 'TZS 0', description: 'remaining amount to be paid' },
          { title: 'Payment Entries', value: `${bookingPayments.length}`, description: 'for selected event' },
          { title: "Today's Records", value: `${payments.filter((item) => item.receivedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}`, description: 'payments tracked today' },
        ]}
        sections={[
          {
            title: 'Cashier 1 Booking Payment Workflow',
            bullets: [
              'Select a registered booking from Assistant Halls.',
              'View booking details in read-only mode.',
              'Enter paid amount and notes, then mark Paid to update remaining balance.',
            ],
          },
        ]}
        action={
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Registered Bookings</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <select
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  value={selectedBookingId}
                  onChange={(event) => setSelectedBookingId(event.target.value)}
                >
                  <option value="">Select booking</option>
                  {cashierBookings.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.id} | {entry.customerName} | {entry.eventName}
                    </option>
                  ))}
                </select>
                {selected && financials ? (
                  <Badge className="bg-slate-100 text-slate-700 self-center">Left: TZS {financials.balance.toLocaleString()}</Badge>
                ) : null}
              </div>
            </div>

            {selected ? (
              <>
                <div className={`rounded-3xl border bg-white p-5 shadow-sm ${selected.revision ? 'border-amber-300' : 'border-slate-200'}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking Details (Read-only)</p>
                  {selected.revision ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      Updated booking revision x{selected.revision}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p><span className="font-semibold">Booking:</span> {selected.id}</p>
                    <p><span className="font-semibold">Customer:</span> {selected.customerName}</p>
                    <p><span className="font-semibold">Phone:</span> {selected.customerPhone}</p>
                    <p><span className="font-semibold">Event:</span> {selected.eventName}</p>
                    <p><span className="font-semibold">Hall:</span> {selected.hall}</p>
                    <p><span className="font-semibold">Date:</span> {selected.date}</p>
                    <p><span className="font-semibold">Time:</span> {selected.startTime} - {selected.endTime}</p>
                    <p><span className="font-semibold">Quoted Amount:</span> TZS {(Number(selected.quotedAmount) || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Section</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      placeholder="Amount Paid (TZS)"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={paidAmount || ''}
                      onChange={(event) => setPaidAmount(Number(event.target.value))}
                    />
                    <input
                      type="text"
                      placeholder="Notes / Comment"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.target.value)}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        const result = recordPayment({
                          bookingId: selected.id,
                          amount: paidAmount,
                          method: 'cash',
                          notes: paymentNotes,
                        });
                        setMessage(result.message);
                        if (result.ok) {
                          setPaidAmount(0);
                          setPaymentNotes('');
                        }
                      }}
                    >
                      Paid
                    </Button>
                    {financials ? <Badge className="bg-slate-100 text-slate-700">Remaining: TZS {financials.balance.toLocaleString()}</Badge> : null}
                    {message ? <span className="text-xs text-slate-600">{message}</span> : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Tracking by Date and Comment</p>
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
                          <p className="text-slate-500">Comment: {entry.notes || '-'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
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
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="text" placeholder="Customer Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} />
                <input type="text" placeholder="Customer Phone" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.customerPhone} onChange={(event) => onChange('customerPhone', event.target.value)} />
                <input type="text" placeholder="Event Name" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventName} onChange={(event) => onChange('eventName', event.target.value)} />
                <input type="text" placeholder="Event Type" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.eventType} onChange={(event) => onChange('eventType', event.target.value)} />
                <select className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.hall} onChange={(event) => onChange('hall', event.target.value)}>
                  <option value="">Select Hall</option>
                  {halls.map((hall) => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
                <input type="date" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.date} onChange={(event) => onChange('date', event.target.value)} />
                <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
                <input type="time" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
                <input type="number" placeholder="Expected Guests" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.expectedGuests || ''} onChange={(event) => onChange('expectedGuests', Number(event.target.value))} />
                <input type="number" placeholder="Quoted Amount (TZS)" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.quotedAmount || ''} onChange={(event) => onChange('quotedAmount', Number(event.target.value))} />
                <input type="text" placeholder="Notes" className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={isSavingBooking} onClick={() => void handleCreateBooking()}>
                  {isSavingBooking ? 'Saving...' : 'Submit Booking'}
                </Button>
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
                    <p className="text-slate-500">{booking.customerName} ({booking.customerPhone}) | {booking.eventType} | {booking.expectedGuests} guests | TZS {(Number(booking.quotedAmount) || 0).toLocaleString()}</p>
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
