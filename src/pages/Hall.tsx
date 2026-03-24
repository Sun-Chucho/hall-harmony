import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/contexts/BookingContext';
import { CreateBookingInput } from '@/types/booking';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, MapPin, Sparkles, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

const formatTZS = (value: number) =>
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

  /* scroll-reveal observer */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('[class*="reveal-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const conflict = useMemo(() => {
    if (!bookForm.hall || !bookForm.date || !bookForm.startTime || !bookForm.endTime) return false;
    return hasConflict(bookForm);
  }, [bookForm, hasConflict]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-white text-[#0A0A0A]">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7A151B]">{isSw ? 'Ukumbi haujapatikana' : 'Destination not found'}</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight">{isSw ? 'Hatukuweza kupata maelezo ya ukumbi huu.' : 'We could not locate this destination.'}</h1>
          <button
            onClick={() => navigate('/#destinations')}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/10 px-7 py-3 text-sm font-semibold transition hover:border-[#7A151B] hover:text-[#7A151B]"
          >
            {isSw ? 'Rudi kwenye kumbi' : 'Back to destinations'} <ArrowRight className="h-4 w-4" />
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
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <PublicNavbar />

      {/* ─── HERO ─── */}
      <div className="relative isolate">
        <div
          className="h-[52vh] min-h-[400px] w-full bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.7)), url('${heroImage}')` }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12 md:pb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/60">{profile.alias}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl">{profile.name}</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80">{profile.heroSummary}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={openBookModal} className="h-11 rounded-full bg-[#7A151B] px-7 text-sm font-semibold text-white hover:bg-[#5C0A0F]">{isSw ? 'Hifadhi Sasa' : 'Book Now'}</Button>
              <Button variant="outline" onClick={() => setShowScheduleModal(true)} className="h-11 rounded-full border-white/30 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white/10">{isSw ? 'Panga Tasting' : 'Schedule Tasting'}</Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-14 space-y-14">

        {/* ─── KEY STATS ─── */}
        <section className="reveal-fade-up grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#faf5f5] p-2.5"><Users className="h-5 w-5 text-[#7A151B]" /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0A0A0A]/40">{isSw ? 'Uwezo' : 'Capacity'}</p>
            </div>
            <p className="mt-4 text-3xl font-bold">{profile.capacity} <span className="text-base font-normal text-[#0A0A0A]/40">{isSw ? 'wageni' : 'guests'}</span></p>
          </article>
          <article className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#faf5f5] p-2.5"><MapPin className="h-5 w-5 text-[#7A151B]" /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0A0A0A]/40">{isSw ? 'Bei ya chini (Ukumbi)' : 'Starting Hall Rate'}</p>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#7A151B]">{formatTZS(Math.min(...profile.standardRentalRates.map((r) => r.price)))}</p>
          </article>
          <article className="rounded-2xl border border-black/[.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#faf5f5] p-2.5"><Sparkles className="h-5 w-5 text-[#7A151B]" /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0A0A0A]/40">{isSw ? 'Bei ya Gala Dinner' : 'Gala Dinner Rate'}</p>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#7A151B]">{formatTZS(Math.min(...profile.galaDinnerRates.map((r) => r.price)))}</p>
          </article>
        </section>

        {/* ─── RATE TABLES ─── */}
        <section className="reveal-slide-left grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Bei ya Kukodi Ukumbi' : 'Hall Rental Rates'}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{profile.name}</h2>
            <div className="mt-6 space-y-0">
              {profile.standardRentalRates.map((rate) => (
                <div key={rate.label} className="flex items-center justify-between border-b border-black/[.06] py-4 last:border-b-0">
                  <span className="text-sm text-[#0A0A0A]/60">{rate.label}</span>
                  <span className="text-base font-bold">{formatTZS(rate.price)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Gala Dinner' : 'Gala Dinner Package'}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{profile.name}</h2>
            <div className="mt-6 space-y-0">
              {profile.galaDinnerRates.map((rate) => (
                <div key={rate.label} className="flex items-center justify-between border-b border-black/[.06] py-4 last:border-b-0">
                  <span className="text-sm text-[#0A0A0A]/60">{rate.label}</span>
                  <span className="text-base font-bold">{formatTZS(rate.price)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* ─── HIGHLIGHTS & IDEAL FIT ─── */}
        <section className="reveal-fade-up grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Vipengele vya Kipekee' : 'Signature Highlights'}</p>
            <ul className="mt-5 space-y-3">
              {profile.signatureHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A151B]" />
                  <span className="text-sm leading-relaxed text-[#0A0A0A]/65">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Inafaa kwa Matukio Haya' : 'Ideal Event Fits'}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {profile.idealFor.map((item) => (
                <div key={item} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/65">{item}</div>
              ))}
            </div>
          </article>
        </section>

        {/* ─── DECOR BY PAX ─── */}
        <section className="reveal-scale">
          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Gharama za Mapambo' : 'Decoration Packages (By PAX)'}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {decorByPax.map((pack) => (
                <article key={pack.title} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(122,21,27,0.06)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]/40">{pack.title}</p>
                  <p className="mt-2 text-xl font-bold text-[#7A151B]">{formatTZS(pack.price)}</p>
                  <ul className="mt-4 space-y-2">
                    {pack.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#0A0A0A]/55">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#7A151B]/50" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/[.06] bg-gradient-to-r from-[#0A0A0A] to-[#3B0B12] p-6 text-white">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">Photoshoot</p>
                  <p className="mt-1 text-lg font-bold">{photoshootPackage.title}</p>
                </div>
                <p className="text-2xl font-bold text-[#ff9999]">{formatTZS(photoshootPackage.price)}</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {photoshootPackage.items.map((item) => (
                  <p key={item} className="flex items-start gap-2 text-sm text-white/60">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#ff9999]" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* ─── FOOD MENUS ─── */}
        <section className="reveal-slide-right">
          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Menu za Chakula' : 'Food Menus'}</p>
            <Accordion type="single" collapsible className="mt-5">
              {foodMenus.map((menu) => (
                <AccordionItem key={menu.title} value={menu.title}>
                  <AccordionTrigger className="text-left text-base font-semibold">{menu.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]/40">Starter</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {menu.starter.map((item) => (
                            <p key={item} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/65">{item}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]/40">Buffet</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {menu.buffet.map((item) => (
                            <p key={item} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/65">{item}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </article>
        </section>

        {/* ─── POLICIES & NOTICES ─── */}
        <section className="reveal-fade-up grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Taratibu za Ukumbi' : 'Hall Operations'}</p>
            <Accordion type="single" collapsible className="mt-5">
              <AccordionItem value="operations">
                <AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Taratibu na masharti' : 'Terms & procedures'}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {hallOperationsPolicy.map((item) => (
                      <p key={item} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/60">{item}</p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="payment">
                <AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Accounts za malipo' : 'Payment accounts'}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3">
                    {bankAccounts.map((bank) => (
                      <div key={bank.bank} className="rounded-xl border border-black/[.06] bg-[#faf5f5] p-4">
                        <p className="font-bold">{bank.bank}</p>
                        <p className="mt-1 text-sm text-[#0A0A0A]/55">{bank.name}</p>
                        <p className="mt-1 text-sm font-semibold text-[#7A151B]">{bank.account}</p>
                      </div>
                    ))}
                    <p className="text-sm text-[#0A0A0A]/55"><span className="font-semibold text-[#0A0A0A]">{isSw ? 'Mawasiliano' : 'Contact'}:</span> {destinationContact}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </article>

          <article className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Taarifa Muhimu' : 'Important Notices'}</p>
            <ul className="mt-5 space-y-2">
              {importantNotices.map((item) => (
                <li key={item} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/60">{item}</li>
              ))}
            </ul>
          </article>
        </section>

        {/* ─── CTA BUTTONS ─── */}
        <section className="reveal-blur flex flex-wrap gap-4">
          <Button onClick={openBookModal} className="h-12 rounded-full bg-[#7A151B] px-8 text-sm font-semibold text-white hover:bg-[#5C0A0F]">
            {isSw ? 'Hifadhi Sasa' : 'Book Now'}
          </Button>
          <Button variant="outline" onClick={() => setShowScheduleModal(true)} className="h-12 rounded-full border-black/10 px-8 text-sm font-semibold">
            {isSw ? 'Panga Tasting' : 'Schedule Tasting'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="h-12 rounded-full border-black/10 px-8 text-sm font-semibold">
            {isSw ? 'Rudi Nyumbani' : 'Back Home'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A0A0A] px-6 py-12 text-center text-white">
        <p className="text-xl font-bold">Kuringe <span className="text-[#7A151B]">Halls</span></p>
        <p className="mt-2 text-xs text-white/30">© {new Date().getFullYear()} All rights reserved.</p>
      </footer>

      {/* ─── SCHEDULE TASTING MODAL ─── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{isSw ? 'Panga Tasting' : 'Schedule a Tasting'}</h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="rounded-full p-1.5 text-[#0A0A0A]/60 transition hover:bg-black/5" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 text-sm text-[#0A0A0A]/50">{isSw ? 'Na tutawasiliana nawe kuhusu ratiba.' : 'We will follow up with your preferred schedule.'}</p>
            <form className="mt-5 space-y-3" onSubmit={handleScheduleSubmit}>
              <input className="h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Jina kamili' : 'Your full name'} value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} required />
              <input className="h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Namba ya simu' : 'Phone number'} value={schedulePhone} onChange={(e) => setSchedulePhone(e.target.value)} required />
              <input type="date" className="h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              <textarea className="w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 py-3 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" rows={3} placeholder={isSw ? 'Maelezo ya ziada' : 'Additional details'} value={scheduleNote} onChange={(e) => setScheduleNote(e.target.value)} />
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowScheduleModal(false)}>{isSw ? 'Funga' : 'Cancel'}</Button>
                <Button type="submit" className="rounded-full bg-[#7A151B] text-white hover:bg-[#5C0A0F]">{isSw ? 'Tuma kupitia Gmail' : 'Open Gmail Draft'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BOOK NOW MODAL ─── */}
      {showBookModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{isSw ? `Hifadhi ${profile.name}` : `Book ${profile.name}`}</h3>
              <button type="button" onClick={() => setShowBookModal(false)} className="rounded-full p-1.5 text-[#0A0A0A]/60 transition hover:bg-black/5" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleBookSubmit}>
              <input className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Jina la mteja' : 'Customer name'} value={bookForm.customerName} onChange={(e) => setBookForm((p) => ({ ...p, customerName: e.target.value }))} required />
              <input className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Namba ya simu' : 'Phone number'} value={bookForm.customerPhone} onChange={(e) => setBookForm((p) => ({ ...p, customerPhone: e.target.value }))} required />
              <input className="h-12 md:col-span-2 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Jina la tukio' : 'Event name'} value={bookForm.eventName} onChange={(e) => setBookForm((p) => ({ ...p, eventName: e.target.value }))} required />
              <input type="date" className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" value={bookForm.date} onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))} required />
              <input className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" value={quote > 0 ? formatTZS(quote) : isSw ? 'Chagua tarehe' : 'Select date'} readOnly />
              <input type="time" className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" value={bookForm.startTime} onChange={(e) => setBookForm((p) => ({ ...p, startTime: e.target.value }))} required />
              <input type="time" className="h-12 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" value={bookForm.endTime} onChange={(e) => setBookForm((p) => ({ ...p, endTime: e.target.value }))} required />
              <input type="number" min={1} className="h-12 md:col-span-2 rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Idadi ya wageni' : 'Expected guests'} value={bookForm.expectedGuests || ''} onChange={(e) => setBookForm((p) => ({ ...p, expectedGuests: Number(e.target.value) }))} required />
              <textarea className="md:col-span-2 rounded-xl border border-black/10 bg-[#faf5f5] px-4 py-3 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" rows={3} placeholder={isSw ? 'Maelezo ya ziada' : 'Additional notes'} value={bookForm.notes} onChange={(e) => setBookForm((p) => ({ ...p, notes: e.target.value }))} />
              <div className="md:col-span-2">
                <p className={`text-xs font-medium ${conflict ? 'text-red-600' : 'text-emerald-600'}`}>
                  {conflict
                    ? isSw ? 'Muda uliochaguliwa tayari umechukuliwa.' : 'Selected slot is already occupied.'
                    : isSw ? 'Muda uliochaguliwa unapatikana.' : 'Selected slot is available.'}
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowBookModal(false)}>{isSw ? 'Funga' : 'Cancel'}</Button>
                <Button type="submit" className="rounded-full bg-[#7A151B] text-white hover:bg-[#5C0A0F]">{isSw ? 'Wasilisha Uhifadhi' : 'Submit Booking'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hall;
