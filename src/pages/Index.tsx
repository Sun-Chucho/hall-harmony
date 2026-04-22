import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Phone, Sparkles, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { beverageList, beverageNotes, cakeOptions, clientDeclaration, conferencePackages, decorationPackages, eventPackageCategories, externalServices } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { getDecorationPackageName, getDecorationPackageVisual } from '@/lib/packageStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { bankAccounts, destinationContact, destinationProfiles, foodMenus, hallOperationsPolicy, importantNotices } from '@/lib/destinationProfiles';
import { SITE_IMAGES, VENUE_IMAGE_BY_ID } from '@/lib/siteImages';
import heroVideo from '../../HALLS.mp4';

const CONTACT_EMAIL = 'kuringenexus.moshi@gmail.com';

const IMAGES = {
  witness: VENUE_IMAGE_BY_ID.witness,
  kilimanjaro: VENUE_IMAGE_BY_ID.kilimanjaro,
  'kilimanjaro-garden': VENUE_IMAGE_BY_ID['kilimanjaro-garden'],
  'hall-d': VENUE_IMAGE_BY_ID['hall-d'],
  suite: SITE_IMAGES.lounge,
  premium: SITE_IMAGES.premium,
  journal: SITE_IMAGES.journal,
  editorial: SITE_IMAGES.editorial,
};

const GALLERY_IMAGES = [
  { src: SITE_IMAGES.premium, alt: 'Premium hall styling' },
  { src: SITE_IMAGES.journal, alt: 'Journal event styling' },
  { src: SITE_IMAGES.editorial, alt: 'Editorial hall view' },
];

const STORY_CARDS = [
  {
    titleEn: 'Nymphenburg Porcelain Style Setup', titleSw: 'Mpangilio wa Nymphenburg Porcelain',
    noteEn: 'Elegant table styling and layered textures for premium receptions.',
    noteSw: 'Mpangilio wa meza wa kifahari na muunganiko wa muundo kwa mapokezi ya kiwango cha juu.',
    tagEn: 'Feature Story', tagSw: 'Hadithi Maalum', image: SITE_IMAGES.premium, to: '/?section=planner',
  },
  {
    titleEn: 'Hall A Signature Wedding', titleSw: 'Harusi Maalum ya Ukumbi A',
    noteEn: 'A 600-guest celebration built around custom lighting and stage reveals.',
    noteSw: 'Sherehe ya wageni 600 iliyoandaliwa kwa taa maalum na mpangilio wa stage.',
    tagEn: 'Event Journal', tagSw: 'Jarida la Tukio', image: SITE_IMAGES.journal, to: '/?section=planner',
  },
  {
    titleEn: 'Boardroom to Banquet in Hall D', titleSw: 'Kutoka Bodi hadi Banquet katika Ukumbi D',
    noteEn: 'Flexible transitions for intimate meetings and evening dinners.',
    noteSw: 'Mpangilio unaobadilika kwa mikutano ya karibu na chakula cha jioni.',
    tagEn: 'Planning Guide', tagSw: 'Mwongozo wa Mipango', image: SITE_IMAGES.editorial, to: '/?section=planner',
  },
];

const getTierLabel = (tier: string, isSw: boolean) => {
  if (!isSw) return tier;
  if (tier === 'Bronze Plan') return 'Mpango wa Bronze';
  if (tier === 'Silver Plan') return 'Mpango wa Silver';
  if (tier === 'Gold Plan') return 'Mpango wa Gold';
  if (tier === 'Platinum Plan') return 'Mpango wa Platinum';
  if (tier === 'Royal Plan') return 'Mpango wa Royal';
  return tier;
};

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const PACKAGE_ACCENT_CLASSES = [
  'bg-[#7A151B] text-white',
  'bg-[#F4E7D3] text-[#7A151B]',
  'bg-[#EAF3EC] text-[#1D5B3A]',
  'bg-[#E8EEF9] text-[#1F4E79]',
];

export default function Index() {
  const location = useLocation();
  const { language } = useLanguage();
  const isSw = language === 'sw';
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    const revealClasses = ['.reveal-on-scroll', '.reveal-fade-up', '.reveal-scale', '.reveal-slide-left', '.reveal-slide-right', '.reveal-blur'];
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(revealClasses.join(',')));
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } }),
      { threshold: 0.12 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section');
    if (!section) return;
    const target = document.getElementById(section);
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }, [location.search]);

  const openSupportEmail = () => {
    const subject = isSw ? 'Ombi la Msaada wa Moja kwa Moja' : 'Live Local Support Request';
    const body = [`${isSw ? 'Jina' : 'Name'}: ${supportName || (isSw ? 'Halijajazwa' : 'Not provided')}`, '', `${isSw ? 'Tunakusaidiaje' : 'How can we help'}:`, supportMessage || (isSw ? 'Tafadhali eleza ombi lako.' : 'Please share your request.')].join('\n');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    setShowSupportDialog(false); setSupportName(''); setSupportMessage('');
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <PublicNavbar ctaLabel={isSw ? 'Hifadhi Tarehe Yako' : 'Book Your Date'} />

      {/* ─── HERO ─── */}
      <section className="relative isolate h-screen min-h-[640px] overflow-hidden">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" aria-label="Kuringe Halls hero video">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 text-center">
          <div className="max-w-3xl text-white reveal-blur">
            <p className="text-[11px] font-medium uppercase tracking-[0.5em] text-white/60">Kuringe Halls — Moshi</p>
            <h1 className="mt-8 text-5xl font-extrabold leading-[1.08] tracking-tight md:text-7xl">
              {isSw ? 'Nafasi Maalum kwa Harusi, Mikutano, na Matukio' : 'Crafted Spaces for Weddings, Conferences & Events'}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              {isSw ? 'Fanya tukio lako liwe la kifahari kuanzia mapokezi hadi mwisho.' : 'Keep your event elegant from first arrival to final toast.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/booking">
                <Button className="h-12 rounded-full bg-[#7A151B] px-8 text-sm font-semibold text-white hover:bg-[#5C0A0F] transition-colors duration-300">{isSw ? 'Hifadhi Tarehe' : 'Reserve A Date'}</Button>
              </Link>
              <a href="#destinations">
                <Button variant="outline" className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors duration-300">
                  {isSw ? 'Chunguza Kumbi' : 'Explore Venues'}
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <main className="mx-auto max-w-7xl px-6 pb-24">

        {/* ─── INTRO CARDS ─── */}
        <section className="reveal-scale -mt-20 relative z-10 pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="overflow-hidden rounded-3xl border border-black/[.06] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
              <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
                <div className="p-8 md:p-10 lg:p-12">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A151B]">{isSw ? 'Mwonekano wa Kiwango cha Juu' : 'World-Class Presentation'}</p>
                  <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                    {isSw ? 'Picha nyingi zaidi, maelezo zaidi, bado ukurasa mmoja safi' : 'More imagery, fuller detail, one sleek page'}
                  </h2>
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#0A0A0A]/60">
                    {isSw ? 'Kila sehemu muhimu sasa inaweza kufunguliwa kwa kitufe, huku picha halisi za Kuringe zikibaki mbele.' : 'Every section opens on demand while real Kuringe photography stays front and center.'}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link to="/?section=destinations"><Button className="rounded-full bg-[#0A0A0A] px-6 text-white hover:bg-[#1a1a1a]">{isSw ? 'Tazama Kumbi' : 'View Venues'}</Button></Link>
                    <Link to="/?section=planner"><Button variant="outline" className="rounded-full border-black/10 px-6">{isSw ? 'Fungua Maelezo' : 'Reveal Details'}</Button></Link>
                  </div>
                </div>
                <div className="grid min-h-[320px] grid-cols-2 grid-rows-2 gap-2 bg-[#f7f5f2] p-3">
                  <img src={GALLERY_IMAGES[0].src} alt={GALLERY_IMAGES[0].alt} className="col-span-2 h-full w-full rounded-2xl object-cover" />
                  <img src={GALLERY_IMAGES[1].src} alt={GALLERY_IMAGES[1].alt} className="h-full w-full rounded-2xl object-cover" />
                  <img src={GALLERY_IMAGES[2].src} alt={GALLERY_IMAGES[2].alt} className="h-full w-full rounded-2xl object-cover" />
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A0A0A] via-[#2A0A0E] to-[#7A151B] p-8 text-white shadow-[0_20px_60px_rgba(122,21,27,0.15)] lg:p-10">
              <div className="flex items-center gap-2 text-[#ff9999]">
                <Sparkles className="h-4 w-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]">{isSw ? 'Sasa ni rahisi zaidi' : 'Cleaner & easier'}</p>
              </div>
              <div className="mt-8 grid gap-4">
                {[
                  { label: isSw ? 'Kumbi' : 'Venues', value: `${destinationProfiles.length} ${isSw ? 'nafasi tofauti' : 'distinct spaces'}` },
                  { label: isSw ? 'Huduma' : 'Services', value: `${externalServices.length + conferencePackages.length} ${isSw ? 'mipango ya ziada' : 'planning options'}` },
                  { label: isSw ? 'Sera na malipo' : 'Policies & payments', value: `${bankAccounts.length} ${isSw ? 'accounts rasmi na masharti' : 'official accounts & full terms'}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[.06] p-5 backdrop-blur-sm">
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* ─── DESTINATIONS ─── */}
        <section id="destinations" className="reveal-fade-up py-24">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7A151B]">{isSw ? 'Kumbi Zetu' : 'Our Venues'}</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{isSw ? 'Kumbi' : 'Destinations'}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#0A0A0A]/55">{isSw ? 'Chagua mazingira sahihi kulingana na idadi ya wageni na aina ya tukio.' : 'Select the right atmosphere for your guest count and event mood.'}</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destinationProfiles.map((d, i) => (
              <Link key={d.id} to={`/halls/${d.id}`} className={`reveal-fade-up delay-${i + 1} group relative h-[400px] overflow-hidden rounded-2xl bg-black block`}>
                <img src={IMAGES[d.id as keyof typeof IMAGES]} alt={d.name} className="h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/60">{d.capacity} {isSw ? 'wageni' : 'guests'}</p>
                  <h3 className="mt-2 text-2xl font-bold">{d.name}</h3>
                  <p className="mt-2 text-sm font-medium text-white/85">{d.marketingLine}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-white/60 opacity-0 transition-all duration-500 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                    {isSw ? 'Tazama zaidi' : 'View details'} <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-black/[.06] bg-white p-8 shadow-[0_16px_64px_rgba(0,0,0,0.04)] md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <img src={IMAGES.witness} alt="Witness Hall" className="h-[240px] w-full rounded-2xl object-cover sm:h-full" />
                <div className="grid gap-3">
                  <img src={IMAGES.kilimanjaro} alt="Kilimanjaro Hall" className="h-[150px] w-full rounded-2xl object-cover" />
                  <img src={IMAGES['kilimanjaro-garden']} alt="Kilimanjaro Garden" className="h-[150px] w-full rounded-2xl object-cover" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Maelezo yaliyofichwa' : 'Expanded venue reveal'}</p>
                <h3 className="mt-4 text-3xl font-bold tracking-tight">{isSw ? 'Fungua profaili kamili ya kila ukumbi' : 'Full profile for each venue'}</h3>
                <Accordion type="single" collapsible className="mt-6">
                  {destinationProfiles.map((d) => (
                    <AccordionItem key={d.id} value={d.id}>
                      <AccordionTrigger className="text-left text-base font-semibold">{d.name}</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
                          <img src={IMAGES[d.id as keyof typeof IMAGES]} alt={d.name} className="h-[220px] w-full rounded-2xl object-cover" />
                          <div>
                            <p className="text-sm font-bold text-[#7A151B]">{d.alias} · {d.capacity} {isSw ? 'wageni' : 'guests'}</p>
                            <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A]/60">{d.heroSummary}</p>
                            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0A0A0A]/40">{isSw ? 'Bora kwa' : 'Ideal for'}</p>
                            <p className="mt-2 text-sm text-[#0A0A0A]/60">{d.idealFor.join(' · ')}</p>
                            <div className="mt-4 grid gap-2">
                              {d.signatureHighlights.map((h) => (<p key={h} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/70">{h}</p>))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        {/* ─── RATES ─── */}
        <section id="rates" className="reveal-fade-up py-16">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7A151B]">{isSw ? 'Bei Rasmi' : 'Official Pricing'}</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{isSw ? 'Bei za Kukodi Kumbi' : 'Hall Rental Rates'}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#0A0A0A]/55">{isSw ? 'Kumbi zote na bei rasmi kulingana na siku.' : 'All halls with their official day-based pricing.'}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {destinationProfiles.map((hall, i) => (
              <article key={hall.id} className={`reveal-fade-up delay-${i + 1} overflow-hidden rounded-2xl border border-black/[.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-shadow duration-500 hover:shadow-[0_12px_48px_rgba(122,21,27,0.08)]`}>
                <h3 className="text-xl font-bold">{hall.name}</h3>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]/40">{hall.capacity} {isSw ? 'wageni' : 'guests'}</p>
                <div className="mt-4 space-y-3 border-t border-black/[.06] pt-4">
                  {hall.standardRentalRates.map((rate) => (
                    <div key={`${hall.id}-${rate.label}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#0A0A0A]/55">{rate.label}</span>
                      <span className="font-bold text-[#0A0A0A]">{formatTZS(rate.price)}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/halls/${hall.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7A151B] transition-colors hover:text-[#5C0A0F]">
                  {isSw ? 'Tazama maelezo' : 'View details'} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-black/[.06] bg-[#0A0A0A] p-8 text-white md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">{isSw ? 'Bei Zilizofichwa' : 'Refined rate reveal'}</p>
                <h3 className="mt-4 text-3xl font-bold tracking-tight">{isSw ? 'Bei rasmi zote zipo hapa' : 'All official rates in one place'}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/60">{isSw ? 'Bonyeza kufungua viwango vya gala dinner na viwango vya kila ukumbi.' : 'Press to reveal gala dinner and hall-specific rate tables.'}</p>
              </div>
              <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-white/[.04] px-5">
                {destinationProfiles.map((hall) => (
                  <AccordionItem key={`${hall.id}-rates`} value={`${hall.id}-rates`} className="border-white/10">
                    <AccordionTrigger className="text-left text-base font-semibold text-white">{hall.name}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-white/[.06] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">{isSw ? 'Ukumbi wa kawaida' : 'Standard rental'}</p>
                          <div className="mt-3 space-y-2">{hall.standardRentalRates.map((r) => (<div key={`${hall.id}-s-${r.label}`} className="flex items-center justify-between gap-3 text-sm text-white/70"><span>{r.label}</span><span className="font-semibold text-white">{formatTZS(r.price)}</span></div>))}</div>
                        </div>
                        <div className="rounded-2xl bg-[#7A151B]/15 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ff9999]">Gala dinner</p>
                          <div className="mt-3 space-y-2">{hall.galaDinnerRates.map((r) => (<div key={`${hall.id}-g-${r.label}`} className="flex items-center justify-between gap-3 text-sm text-white/70"><span>{r.label}</span><span className="font-semibold text-white">{formatTZS(r.price)}</span></div>))}</div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <section className="reveal-blur py-4">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0A0A0A]/30">
            <span className="h-px flex-1 bg-black/10" />
            {isSw ? 'Kumbi Maalum za Kuringe' : 'Kuringe Signature Venues'}
            <span className="h-px flex-1 bg-black/10" />
          </div>
        </section>

        {/* ─── FEATURED EXPERIENCE ─── */}
        <section className="reveal-scale py-16">
          <article className="relative min-h-[440px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A0A0A] via-[#3B0B12] to-[#7A151B]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />
            <div className="relative flex min-h-[440px] items-center p-10 md:p-16">
              <div className="max-w-xl text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">{isSw ? 'Uzoefu Maalum' : 'Featured Experience'}</p>
                <h3 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{isSw ? 'Hisia ya Kifalme kwa Wageni Wako' : 'A Palace Feeling for Your Guests'}</h3>
                <p className="mt-5 text-[15px] leading-relaxed text-white/70">{isSw ? 'Unganisha ngazi za mapambo, stage, na mpangilio maalum wa mtiririko.' : 'Combine premium decor tiers, staging, and tailored flow plans for a seamless event.'}</p>
                <Link to="/?section=planner" className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff9999] transition-colors hover:text-white">
                  {isSw ? 'Tazama Maelezo Kamili' : 'View Full Details'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        </section>

        {/* ─── STORIES ─── */}
        <section className="reveal-slide-left py-12">
          <h2 className="text-4xl font-bold tracking-tight">{isSw ? 'Hadithi Zetu' : 'Our Stories'}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STORY_CARDS.map((card, i) => (
              <article key={card.titleEn} className={`reveal-fade-up delay-${i + 1} group overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_16px_56px_rgba(122,21,27,0.08)]`}>
                <div className="overflow-hidden"><img src={card.image} alt={isSw ? card.titleSw : card.titleEn} className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                <div className="p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7A151B]">{isSw ? card.tagSw : card.tagEn}</p>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{isSw ? card.titleSw : card.titleEn}</h3>
                  <p className="mt-3 text-sm text-[#0A0A0A]/55 leading-relaxed">{isSw ? card.noteSw : card.noteEn}</p>
                  <Link to={card.to} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:text-[#7A151B]">
                    {isSw ? 'Soma hadithi' : 'Read story'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ─── PACKAGES ─── */}
        <section id="packages" className="reveal-fade-up py-16">
          <article className="relative overflow-hidden rounded-3xl bg-[#0A0A0A] px-8 py-24 text-center text-white md:px-14">
            <img src={IMAGES.suite} alt={isSw ? 'Mpangilio wa kifurushi' : 'Premium suite'} className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
            <div className="relative mx-auto max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#ff9999]">{isSw ? 'Vifurushi' : 'Packages'}</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{isSw ? 'Vifurushi vya Matukio' : 'Event Packages'}</h2>
              <p className="mt-5 text-[15px] text-white/70">{isSw ? 'Package za ukumbi, birthday, gala dinner, na graduation sasa zipo wazi kwenye landing page.' : 'Hall, birthday, gala dinner, and graduation packages are now visible directly on the landing page.'}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link to="/?section=packages"><Button className="h-11 rounded-full bg-white px-7 text-sm font-semibold text-[#0A0A0A] hover:bg-white/90">{isSw ? 'Tazama Package' : 'View Packages'}</Button></Link>
                <Link to="/?section=planner"><Button variant="outline" className="h-11 rounded-full border-white/25 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white/10">{isSw ? 'Maelezo Zaidi' : 'See Details'}</Button></Link>
              </div>
            </div>
          </article>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] lg:col-span-2">
              <img src={IMAGES.premium} alt="Premium package" className="h-[260px] w-full object-cover" />
              <div className="p-7 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7A151B]">{isSw ? 'Makundi ya package' : 'Package categories'}</p>
                <Accordion type="single" collapsible className="mt-5">
                  {eventPackageCategories.map((pkg, index) => {
                    return (
                      <AccordionItem key={pkg.id} value={pkg.id}>
                        <AccordionTrigger className="text-left">
                          <div>
                            <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${PACKAGE_ACCENT_CLASSES[index % PACKAGE_ACCENT_CLASSES.length]}`}>{pkg.title}</p>
                            <p className="mt-2 text-base font-bold">{pkg.title}</p>
                            <p className="text-sm text-[#0A0A0A]/60">{pkg.summary}</p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {pkg.tables?.length ? (
                              <div className="grid gap-4 xl:grid-cols-2">
                                {pkg.tables.map((table) => (
                                  <div key={`${pkg.id}-${table.title}`} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4">
                                    <p className="font-bold text-[#0A0A0A]">{table.title}</p>
                                    {table.capacity ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#0A0A0A]/40">{table.capacity}</p> : null}
                                    <div className="mt-3 space-y-2">
                                      {table.rows.map((row) => (
                                        <div key={`${table.title}-${row.label}`} className="flex items-center justify-between gap-3 text-sm">
                                          <span className="text-[#0A0A0A]/60">{row.label}</span>
                                          <span className="font-semibold text-[#7A151B]">{row.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <div className="grid gap-4 xl:grid-cols-2">
                              {pkg.blocks.map((block) => (
                                <div key={`${pkg.id}-${block.title}`} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4">
                                  <p className="font-bold text-[#0A0A0A]">{block.title}</p>
                                  <div className="mt-3 grid gap-2">
                                    {block.items.map((item) => (
                                      <p key={`${block.title}-${item}`} className="rounded-xl bg-white px-4 py-3 text-sm text-[#0A0A0A]/65">{item}</p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
              <img src={IMAGES.journal} alt="Decor by pax" className="h-[220px] w-full object-cover" />
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7A151B]">{isSw ? 'Muhtasari wa package' : 'Quick package scan'}</p>
                <Accordion type="single" collapsible className="mt-4">
                  {eventPackageCategories.map((pkg, index) => (
                    <AccordionItem key={`${pkg.id}-summary`} value={`${pkg.id}-summary`}>
                      <AccordionTrigger className="text-left">
                        <div>
                          <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${PACKAGE_ACCENT_CLASSES[index % PACKAGE_ACCENT_CLASSES.length]}`}>{pkg.title}</p>
                          <p className="mt-2 text-sm font-bold">{pkg.summary}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-2">
                          {pkg.blocks.slice(0, 3).map((block) => (
                            <div key={`${pkg.id}-${block.title}-summary`} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/65">
                              <span className="font-semibold text-[#0A0A0A]">{block.title}:</span> {block.items[0]}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </article>
          </div>
        </section>

        {/* ─── CONTACT CTA ─── */}
        <section id="contact" className="reveal-scale py-16">
          <article className="overflow-hidden rounded-3xl bg-[#0A0A0A] px-8 py-16 text-center text-white md:px-14">
            <div className="grid gap-4 md:grid-cols-3">
              <Link to="/booking" className="group rounded-2xl border border-white/15 px-6 py-10 text-xl font-semibold transition-all duration-300 hover:bg-[#7A151B] hover:border-[#7A151B]">{isSw ? 'Uhifadhi wa Haraka' : 'Instant Booking'}</Link>
              <Link to="/?section=destinations" className="group rounded-2xl border border-white/15 px-6 py-10 text-xl font-semibold transition-all duration-300 hover:bg-[#7A151B] hover:border-[#7A151B]">{isSw ? 'Chunguza Kumbi' : 'Explore Venues'}</Link>
              <button type="button" onClick={() => setShowSupportDialog(true)} className="rounded-2xl border border-white/15 px-6 py-10 text-xl font-semibold transition-all duration-300 hover:bg-[#7A151B] hover:border-[#7A151B]">{isSw ? 'Msaada wa Moja kwa Moja' : 'Live Local Support'}</button>
            </div>
          </article>
        </section>

        {/* ─── PLANNER ─── */}
        <section id="planner" className="reveal-slide-right py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
            <article>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7A151B]">{isSw ? 'Uratibu' : 'Planning'}</p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight">{isSw ? 'Panga na Kuringe' : 'Plan With Kuringe'}</h3>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#0A0A0A]/55">{isSw ? 'Shirikiana na timu yetu kuratibu uchaguzi wa ukumbi, kifurushi, mpangilio wa chakula, na mtiririko wa wageni.' : 'Work with our team to align hall choice, decor package, food flow, and guest movement in one clear booking path.'}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/booking"><Button className="rounded-full bg-[#0A0A0A] px-7 text-white hover:bg-[#1a1a1a]">{isSw ? 'Anza Uhifadhi' : 'Start Booking'}</Button></Link>
                <Link to="/?section=policies"><Button variant="outline" className="rounded-full border-black/10 px-7">{isSw ? 'Soma Sera' : 'Read Policies'}</Button></Link>
              </div>
            </article>
            <article className="w-full overflow-hidden rounded-2xl border border-black/[.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
              <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-3">
                  <img src={IMAGES.editorial} alt="Event planner" className="min-h-[220px] w-full rounded-2xl object-cover" />
                  <img src={IMAGES.suite} alt="Luxury setup" className="h-[120px] w-full rounded-2xl object-cover" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{isSw ? 'Vifurushi Bora vya Mapambo' : 'Top Decoration Packages'}</h4>
                  <ul className="mt-5 space-y-4">
                    {decorationPackages.map((pkg, index) => {
                      const style = getDecorationPackageVisual(index);
                      return (
                        <li key={pkg.title} className="border-b border-black/[.06] pb-4 last:border-b-0 last:pb-0">
                          <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${style.badgeClass}`}>{getTierLabel(style.tier, isSw)}</p>
                          <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-[#0A0A0A]/40">{getDecorationPackageName(pkg.title)}</p>
                          <p className="mt-1 text-xl font-bold">{formatTZS(pkg.price)}</p>
                          <p className="mt-2 text-sm text-[#0A0A0A]/55">{pkg.highlights[0]}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ─── DETAILS + POLICIES ─── */}
        <section className="reveal-fade-up py-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)] md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Mahitaji ya Tukio' : 'Event Planning Details'}</p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{isSw ? 'Fungua kile unachohitaji' : 'Open only what you need'}</h3>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="decor"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Package za matukio' : 'Event packages'}</AccordionTrigger>
                  <AccordionContent><div className="space-y-4"><img src={IMAGES.premium} alt="Package detail" className="h-[220px] w-full rounded-2xl object-cover" />{eventPackageCategories.map((pkg) => (<div key={pkg.id} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{pkg.title}</p><p className="text-sm font-semibold text-[#7A151B]">{pkg.summary}</p></div><div className="mt-3 grid gap-3">{pkg.blocks.map((block) => (<div key={`${pkg.id}-${block.title}-detail`} className="rounded-xl bg-white px-4 py-3 text-sm text-[#0A0A0A]/65"><span className="font-semibold text-[#0A0A0A]">{block.title}:</span> {block.items.join(' · ')}</div>))}</div></div>))}</div></AccordionContent>
                </AccordionItem>
                <AccordionItem value="food"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Chakula na menus' : 'Food & conference menus'}</AccordionTrigger>
                  <AccordionContent><div className="space-y-4">{foodMenus.map((m) => (<div key={m.title} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4"><p className="font-bold">{m.title}</p><p className="mt-2 text-sm text-[#0A0A0A]/55">{[...m.starter, ...m.buffet].join(' · ')}</p></div>))}{conferencePackages.map((p) => (<div key={p.attendees} className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4"><p className="font-bold">Conference {p.attendees}</p><p className="mt-1 text-sm text-[#0A0A0A]/55">{p.pricePoint}</p><p className="mt-2 text-sm text-[#0A0A0A]/55">{p.amenities.join(' · ')}</p></div>))}</div></AccordionContent>
                </AccordionItem>
                <AccordionItem value="drinks"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Vinywaji na huduma' : 'Drinks & extra services'}</AccordionTrigger>
                  <AccordionContent><div className="space-y-4"><div className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4"><p className="font-bold">{isSw ? 'Vinywaji maarufu' : 'Popular beverages'}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{beverageList.map((d) => (<div key={d.name} className="flex items-center justify-between gap-3 text-sm text-[#0A0A0A]/55"><span>{d.name}</span><span className="font-semibold text-[#0A0A0A]">{formatTZS(d.price)}</span></div>))}</div>{beverageNotes.map((n) => (<p key={n} className="mt-1 text-xs text-[#0A0A0A]/40">{n}</p>))}</div><div className="rounded-2xl border border-black/[.06] bg-[#faf5f5] p-4"><p className="font-bold">{isSw ? 'Huduma nyingine' : 'Additional services'}</p><p className="mt-2 text-sm text-[#0A0A0A]/55">{externalServices.join(' · ')}</p><p className="mt-3 text-sm text-[#0A0A0A]/55">{cakeOptions.map((c) => `${c.title} (${c.pricePoint})`).join(' · ')}</p></div></div></AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>

            <article id="policies" className="overflow-hidden rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.04)] md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A151B]">{isSw ? 'Sera na Malipo' : 'Policies & Payments'}</p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{isSw ? 'Masharti yamefichwa kwa mpangilio safi' : 'Policies behind clean toggles'}</h3>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="operations"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Taratibu za ukumbi' : 'Hall operations'}</AccordionTrigger>
                  <AccordionContent><div className="space-y-3">{hallOperationsPolicy.map((p) => (<p key={p} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/60">{p}</p>))}</div></AccordionContent>
                </AccordionItem>
                <AccordionItem value="payment"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Accounts za malipo' : 'Payment accounts'}</AccordionTrigger>
                  <AccordionContent><div className="grid gap-3">{bankAccounts.map((a) => (<div key={a.bank} className="rounded-xl border border-black/[.06] bg-[#faf5f5] p-4"><p className="font-bold">{a.bank}</p><p className="mt-1 text-sm text-[#0A0A0A]/55">{a.name}</p><p className="mt-1 text-sm font-semibold text-[#7A151B]">{a.account}</p></div>))}</div></AccordionContent>
                </AccordionItem>
                <AccordionItem value="important"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Taarifa muhimu' : 'Important notices'}</AccordionTrigger>
                  <AccordionContent><div className="space-y-3">{importantNotices.map((n) => (<p key={n} className="rounded-xl bg-[#faf5f5] px-4 py-3 text-sm text-[#0A0A0A]/60">{n}</p>))}</div></AccordionContent>
                </AccordionItem>
                <AccordionItem value="declaration"><AccordionTrigger className="text-left text-base font-semibold">{isSw ? 'Tamko la mteja' : 'Client declaration'}</AccordionTrigger>
                  <AccordionContent><div className="rounded-xl border border-black/[.06] bg-[#faf5f5] p-5"><p className="text-sm leading-relaxed text-[#0A0A0A]/60">{clientDeclaration}</p><p className="mt-4 text-sm font-semibold text-[#7A151B]">{isSw ? 'Mawasiliano ya ofisi' : 'Office contact'}: {destinationContact}</p></div></AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>
          </div>
        </section>

        {/* ─── BRAND CLOSER ─── */}
        <section className="reveal-blur py-12">
          <div className="border-t border-black/[.06] pt-10 text-center">
            <p className="text-3xl font-bold tracking-tight">Kuringe <span className="text-[#7A151B]">Halls</span></p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#0A0A0A]/35">{isSw ? 'Ukumbi wa sherehe zako muhimu' : 'A venue for your defining celebrations'}</p>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A0A0A] px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">Kuringe <span className="text-[#7A151B]">Halls</span></p>
            <p className="mt-3 text-sm text-white/50">{isSw ? 'Ukumbi wa Kifahari wa Harusi na Matukio' : 'Luxury Wedding & Event Venue'}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/70"><Phone className="h-4 w-4 text-[#7A151B]" /> +255 717 000 000</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">{isSw ? 'Chunguza' : 'Explore'}</p>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              <li><Link to="/?section=destinations" className="transition-colors hover:text-white">{isSw ? 'Kumbi' : 'Venues'}</Link></li>
              <li><Link to="/?section=packages" className="transition-colors hover:text-white">{isSw ? 'Vifurushi' : 'Packages'}</Link></li>
              <li><Link to="/?section=planner" className="transition-colors hover:text-white">{isSw ? 'Upishi' : 'Catering'}</Link></li>
              <li><Link to="/?section=policies" className="transition-colors hover:text-white">{isSw ? 'Sera' : 'Policies'}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">{isSw ? 'Pendwa ya Wageni' : 'Guest Favorite'}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-sm font-semibold">{isSw ? 'Ukumbi wa Witness Premium' : 'Witness Hall Premium'}</p>
              <div className="mt-2 flex items-center gap-1 text-[#7A151B]">{[1,2,3,4,5].map((n) => (<Star key={n} className="h-4 w-4 fill-current" />))}</div>
              <p className="mt-2 text-xs text-white/50">{isSw ? 'Maandalizi ya ukubwa mkubwa yenye chandelier na stage.' : 'Large scale setup with chandelier finish and full stage flexibility.'}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">{isSw ? 'Mawasiliano' : 'Quick Contact'}</p>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              <li className="inline-flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-[#7A151B]" /> {CONTACT_EMAIL}</li>
              <li className="inline-flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-[#7A151B]" /> Kuringe Complex, Moshi</li>
              <li><Link to="/booking" className="inline-flex items-center gap-2 font-semibold text-[#ff9999] transition-colors hover:text-white">{isSw ? 'Hifadhi sasa' : 'Reserve now'} <ArrowRight className="h-4 w-4" /></Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Kuringe Halls. All rights reserved.
        </div>
      </footer>

      {/* ─── SUPPORT DIALOG ─── */}
      {showSupportDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{isSw ? 'Tunakusaidiaje?' : 'How can we help?'}</h3>
              <button type="button" onClick={() => setShowSupportDialog(false)} className="rounded-full p-1.5 text-[#0A0A0A]/60 transition hover:bg-black/5" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 text-sm text-[#0A0A0A]/50">{isSw ? 'Tuma ombi lako na tutaandaa msaada mara moja.' : 'Share your request and we will prepare support right away.'}</p>
            <div className="mt-5 space-y-3">
              <input className="h-12 w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" placeholder={isSw ? 'Jina lako' : 'Your name'} value={supportName} onChange={(e) => setSupportName(e.target.value)} />
              <textarea className="w-full rounded-xl border border-black/10 bg-[#faf5f5] px-4 py-3 text-sm outline-none focus:border-[#7A151B]/30 focus:ring-2 focus:ring-[#7A151B]/10" rows={4} placeholder={isSw ? 'Andika ujumbe wako' : 'Type your message'} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} />
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setShowSupportDialog(false)}>{isSw ? 'Funga' : 'Close'}</Button>
                <Button className="rounded-full bg-[#7A151B] text-white hover:bg-[#5C0A0F]" onClick={openSupportEmail}>{isSw ? 'Tuma Ombi' : 'Send Request'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
