import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  bankAccounts,
  decorByPax,
  destinationContact,
  destinationProfiles,
  foodMenus,
  hallOperationsPolicy,
  importantNotices,
  photoshootPackage,
} from '@/lib/destinationProfiles';
import { VENUE_IMAGE_BY_ID } from '@/lib/siteImages';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const rateForDay = (rows: { price: number }[], day: number): number => {
  if (rows.length === 2) return day === 1 || day === 2 ? rows[0].price : rows[1].price;
  return day === 6 ? rows[0].price : day === 1 || day === 2 ? rows[1].price : rows[2].price;
};

const Hall = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const profile = destinationProfiles.find((entry) => entry.id === hallId);
  const { toast } = useToast();
  const { createPublicBooking, hasConflict } = useBookings();
  const { language } = useLanguage();
  const isSw = language === 'sw';

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

  const conflict = useMemo(() => {
    if (!bookForm.hall || !bookForm.date || !bookForm.startTime || !bookForm.endTime) return false;
    return hasConflict(bookForm);
  }, [bookForm, hasConflict]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{isSw ? 'Ukumbi haujapatikana' : 'Destination not found'}</p>
          <h1 className="mt-4 text-3xl font-bold">{isSw ? 'Hatukuweza kupata maelezo ya ukumbi huu.' : 'We could not locate this destination.'}</h1>
          <button
            onClick={() => navigate('/#destinations')}
            className="mt-8 rounded-full border border-slate-300 px-6 py-3 text-xs uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-700 hover:text-slate-900"
          >
            {isSw ? 'Rudi kwenye kumbi' : 'Back to destinations'}
          </button>
        </div>
      </div>
    );
  }

  const heroImage = VENUE_IMAGE_BY_ID[profile.id];
  const quote = bookForm.date ? rateForDay(profile.standardRentalRates, new Date(bookForm.date).getDay()) : 0;

  const handleScheduleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = `${isSw ? 'Ombi la tasting' : 'Schedule Tasting'} - ${profile.name}`;
    const body = [
      `${isSw ? 'Jina' : 'Name'}: ${scheduleName}`,
      `${isSw ? 'Simu' : 'Phone'}: ${schedulePhone}`,
      `${isSw ? 'Tarehe unayopendelea' : 'Preferred Date'}: ${scheduleDate || '-'}`,
      `${isSw ? 'Ukumbi' : 'Destination'}: ${profile.name}`,
      `${isSw ? 'Maelezo' : 'Notes'}: ${scheduleNote || '-'}`,
    ].join('\n');
    const gmailComposeUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('kuringenexus.moshi@gmail.com')}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
    setShowScheduleModal(false);
  };

  const openBookModal = () => {
    setBookForm((prev) => ({
      ...prev,
      hall: profile.name,
      quotedAmount: rateForDay(profile.standardRentalRates, prev.date ? new Date(prev.date).getDay() : 1),
    }));
    setShowBookModal(true);
  };

  const handleBookSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CreateBookingInput = {
      ...bookForm,
      hall: profile.name,
      quotedAmount: rateForDay(profile.standardRentalRates, new Date(bookForm.date).getDay()),
    };
    const result = await createPublicBooking(payload);
    toast({
      title: result.ok ? (isSw ? 'Uhifadhi umetumwa' : 'Booking submitted') : (isSw ? 'Uhifadhi umeshindikana' : 'Booking failed'),
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    if (result.ok) setShowBookModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-slate-900">
      <PublicNavbar />
      <div className="relative isolate">
        <div
          className="h-[46vh] min-h-[340px] w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8, 13, 26, 0.28), rgba(8, 13, 26, 0.75)), url('${heroImage}')`,
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="text-xs uppercase tracking-[0.35em] text-white/75">{profile.alias}</p>
            <h1 className="mt-3 text-4xl font-bold text-white md:text-6xl">{profile.name}</h1>
            <p className="mt-4 max-w-3xl text-sm text-white/85 md:text-base">{profile.heroSummary}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:py-14">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{isSw ? 'Uwezo' : 'Capacity'}</p>
            <p className="mt-2 text-2xl font-semibold">{profile.capacity} {isSw ? 'wageni' : 'guests'}</p>
          </article>
          <article className="border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{isSw ? 'Bei ya chini (Ukumbi)' : 'Starting Hall Rate'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111111]">{formatCurrency(Math.min(...profile.standardRentalRates.map((r) => r.price)))}</p>
          </article>
          <article className="border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{isSw ? 'Bei ya chini (Gala Dinner)' : 'Starting Gala Rate'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111111]">{formatCurrency(Math.min(...profile.galaDinnerRates.map((r) => r.price)))}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">BEI YA KUKODI UKUMBI</p>
            <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
            <div className="mt-5 space-y-3 text-sm">
              {profile.standardRentalRates.map((rate) => (
                <div key={rate.label} className="flex items-center justify-between border-b border-black/10 pb-3">
                  <span>{rate.label}</span>
                  <span className="font-semibold">{formatCurrency(rate.price)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">GALA DINNER PACKAGE</p>
            <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
            <div className="mt-5 space-y-3 text-sm">
              {profile.galaDinnerRates.map((rate) => (
                <div key={rate.label} className="flex items-center justify-between border-b border-black/10 pb-3">
                  <span>{rate.label}</span>
                  <span className="font-semibold">{formatCurrency(rate.price)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isSw ? 'Vipengele vya Kipekee' : 'Signature Highlights'}</p>
            <ul className="mt-4 space-y-2 text-sm leading-7">
              {profile.signatureHighlights.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isSw ? 'Inafaa kwa Matukio Haya' : 'Ideal Event Fits'}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
              {profile.idealFor.map((item) => (
                <li key={item} className="border border-black/10 bg-[#fbfaf8] px-3 py-2">{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">GHARAMA ZA MAPAMBO (BY PAX)</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {decorByPax.map((pack) => (
              <article key={pack.title} className="border border-black/10 bg-[#faf9f6] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{pack.title}</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(pack.price)}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {pack.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-6 border border-black/10 p-4">
            <p className="text-sm font-semibold">{photoshootPackage.title} - {formatCurrency(photoshootPackage.price)}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {photoshootPackage.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">MENU ZA CHAKULA</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {foodMenus.map((menu) => (
              <article key={menu.title} className="border border-black/10 bg-[#faf9f6] p-4">
                <h3 className="text-lg font-semibold">{menu.title}</h3>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Starter</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {menu.starter.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Buffet</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {menu.buffet.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">TARATIBU ZA UKUMBI</p>
            <ul className="mt-4 space-y-2 text-sm leading-7">
              {hallOperationsPolicy.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="mt-5 border border-black/10 bg-[#faf9f6] p-4 text-sm">
              {bankAccounts.map((bank) => (
                <p key={bank.bank}>
                  <span className="font-semibold">{bank.bank}:</span> {bank.account} ({bank.name})
                </p>
              ))}
              <p className="mt-2"><span className="font-semibold">CONTACT:</span> {destinationContact}</p>
            </div>
          </article>

          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">MUHIMU</p>
            <ul className="mt-4 space-y-2 text-sm leading-7">
              {importantNotices.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={openBookModal}
            className="rounded-full bg-[#111111] px-7 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-[#252525]"
          >
            {isSw ? 'Hifadhi Sasa' : 'Book Now'}
          </button>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="rounded-full border border-black/25 px-7 py-3 text-xs uppercase tracking-[0.35em] text-slate-800 transition hover:border-black"
          >
            {isSw ? 'Panga Tasting' : 'Schedule Tasting'}
          </button>
        </section>
      </main>

      {showScheduleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">{isSw ? 'Panga Tasting' : 'Schedule a Tasting'}</h3>
            <form className="mt-5 space-y-3" onSubmit={handleScheduleSubmit}>
              <input className="h-11 w-full border border-slate-300 px-3 text-sm" placeholder={isSw ? 'Jina kamili' : 'Your full name'} value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} required />
              <input className="h-11 w-full border border-slate-300 px-3 text-sm" placeholder={isSw ? 'Namba ya simu' : 'Phone number'} value={schedulePhone} onChange={(event) => setSchedulePhone(event.target.value)} required />
              <input type="date" className="h-11 w-full border border-slate-300 px-3 text-sm" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
              <textarea className="w-full border border-slate-300 px-3 py-2 text-sm" rows={3} placeholder={isSw ? 'Maelezo ya ziada' : 'Additional details'} value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{isSw ? 'Funga' : 'Cancel'}</button>
                <button type="submit" className="bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#262626]">{isSw ? 'Tuma kupitia Gmail' : 'Open Gmail Draft'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showBookModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">{isSw ? `Hifadhi ${profile.name}` : `Book ${profile.name}`}</h3>
            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleBookSubmit}>
              <input className="h-11 border border-slate-300 px-3 text-sm" placeholder={isSw ? 'Jina la mteja' : 'Customer name'} value={bookForm.customerName} onChange={(event) => setBookForm((prev) => ({ ...prev, customerName: event.target.value }))} required />
              <input className="h-11 border border-slate-300 px-3 text-sm" placeholder={isSw ? 'Namba ya simu' : 'Phone number'} value={bookForm.customerPhone} onChange={(event) => setBookForm((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
              <input className="h-11 border border-slate-300 px-3 text-sm md:col-span-2" placeholder={isSw ? 'Jina la tukio' : 'Event name'} value={bookForm.eventName} onChange={(event) => setBookForm((prev) => ({ ...prev, eventName: event.target.value }))} required />
              <input type="date" className="h-11 border border-slate-300 px-3 text-sm" value={bookForm.date} onChange={(event) => setBookForm((prev) => ({ ...prev, date: event.target.value }))} required />
              <input className="h-11 border border-slate-300 bg-slate-100 px-3 text-sm" value={quote > 0 ? formatCurrency(quote) : isSw ? 'Chagua tarehe' : 'Select date'} readOnly />
              <input type="time" className="h-11 border border-slate-300 px-3 text-sm" value={bookForm.startTime} onChange={(event) => setBookForm((prev) => ({ ...prev, startTime: event.target.value }))} required />
              <input type="time" className="h-11 border border-slate-300 px-3 text-sm" value={bookForm.endTime} onChange={(event) => setBookForm((prev) => ({ ...prev, endTime: event.target.value }))} required />
              <input type="number" min={1} className="h-11 border border-slate-300 px-3 text-sm md:col-span-2" placeholder={isSw ? 'Idadi ya wageni' : 'Expected guests'} value={bookForm.expectedGuests || ''} onChange={(event) => setBookForm((prev) => ({ ...prev, expectedGuests: Number(event.target.value) }))} required />
              <textarea className="border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder={isSw ? 'Maelezo ya ziada' : 'Additional notes'} value={bookForm.notes} onChange={(event) => setBookForm((prev) => ({ ...prev, notes: event.target.value }))} />
              <div className="md:col-span-2">
                <p className={`text-xs ${conflict ? 'text-red-600' : 'text-emerald-700'}`}>
                  {conflict
                    ? isSw ? 'Muda uliochaguliwa tayari umechukuliwa.' : 'Selected slot is already occupied.'
                    : isSw ? 'Muda uliochaguliwa unapatikana.' : 'Selected slot is available.'}
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowBookModal(false)} className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{isSw ? 'Funga' : 'Cancel'}</button>
                <button type="submit" className="bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#262626]">{isSw ? 'Wasilisha Uhifadhi' : 'Submit Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Hall;
