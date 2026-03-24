import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Phone, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { beverageList, beverageNotes, cakeOptions, conferencePackages, decorationPackages, externalServices } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { getDecorationPackageName, getDecorationPackageVisual } from '@/lib/packageStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { bankAccounts, destinationProfiles, foodMenus, hallOperationsPolicy, importantNotices } from '@/lib/destinationProfiles';
import { SITE_IMAGES, VENUE_IMAGE_BY_ID } from '@/lib/siteImages';
import heroVideo from '../../HALLS.mp4';

const CONTACT_EMAIL = 'kuringenexus.moshi@gmail.com';

const IMAGES = {
  witness: VENUE_IMAGE_BY_ID.witness,
  kilimanjaro: VENUE_IMAGE_BY_ID.kilimanjaro,
  'kilimanjaro-garden': VENUE_IMAGE_BY_ID['kilimanjaro-garden'],
  'hall-d': VENUE_IMAGE_BY_ID['hall-d'],
  suite: SITE_IMAGES.lounge,
};

const STORY_CARDS = [
  {
    titleEn: 'Nymphenburg Porcelain Style Setup',
    titleSw: 'Mpangilio wa Nymphenburg Porcelain',
    noteEn: 'Elegant table styling and layered textures for premium receptions.',
    noteSw: 'Mpangilio wa meza wa kifahari na muunganiko wa muundo kwa mapokezi ya kiwango cha juu.',
    tagEn: 'Feature Story',
    tagSw: 'Hadithi Maalum',
    image: SITE_IMAGES.premium,
    to: '/?section=planner',
  },
  {
    titleEn: 'Hall A Signature Wedding',
    titleSw: 'Harusi Maalum ya Ukumbi A',
    noteEn: 'A 600-guest celebration built around custom lighting and stage reveals.',
    noteSw: 'Sherehe ya wageni 600 iliyoandaliwa kwa taa maalum na mpangilio wa stage.',
    tagEn: 'Event Journal',
    tagSw: 'Jarida la Tukio',
    image: SITE_IMAGES.journal,
    to: '/?section=planner',
  },
  {
    titleEn: 'Boardroom to Banquet in Hall D',
    titleSw: 'Kutoka Bodi hadi Banquet katika Ukumbi D',
    noteEn: 'Flexible transitions for intimate meetings and evening dinners.',
    noteSw: 'Mpangilio unaobadilika kwa mikutano ya karibu na chakula cha jioni.',
    tagEn: 'Planning Guide',
    tagSw: 'Mwongozo wa Mipango',
    image: SITE_IMAGES.editorial,
    to: '/?section=planner',
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
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function Index() {
  const location = useLocation();
  const { language } = useLanguage();
  const isSw = language === 'sw';
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (!section) return;
    const target = document.getElementById(section);
    if (!target) return;
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, [location.search]);

  const openSupportEmail = () => {
    const subject = isSw ? 'Ombi la Msaada wa Moja kwa Moja' : 'Live Local Support Request';
    const body = [
      `${isSw ? 'Jina' : 'Name'}: ${supportName || (isSw ? 'Halijajazwa' : 'Not provided')}`,
      '',
      `${isSw ? 'Tunakusaidiaje' : 'How can we help'}:`,
      supportMessage || (isSw ? 'Tafadhali eleza ombi lako.' : 'Please share your request.'),
    ].join('\n');

    const gmailComposeUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
    setShowSupportDialog(false);
    setSupportName('');
    setSupportMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#161616]">
      <PublicNavbar ctaLabel={isSw ? 'Hifadhi Tarehe Yako' : 'Book Your Date'} />

      <section className="relative isolate h-[82vh] min-h-[560px] overflow-hidden px-4">
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Kuringe Halls hero video"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto flex h-full max-w-7xl items-center justify-center text-center">
          <div className="max-w-3xl text-white reveal-on-scroll">
            <p className="text-xs uppercase tracking-[0.42em] text-white/75">Kuringe Halls, Moshi</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              {isSw ? 'Nafasi Maalum kwa Harusi, Mikutano, na Matukio Muhimu' : 'Crafted Spaces for Weddings, Conferences, and Milestone Events'}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm text-white/85 md:text-base">
              {isSw
                ? 'Fanya tukio lako liwe la kifahari kuanzia mapokezi hadi mwisho kwa uratibu wa ukumbi, mapambo, na huduma.'
                : 'Keep your event elegant from first arrival to final toast with coordinated halls, decor, and service planning.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/booking">
                <Button className="rounded-full bg-[#C6A75E] px-7 text-[#121212] hover:bg-[#d4b56b]">{isSw ? 'Hifadhi Tarehe' : 'Reserve A Date'}</Button>
              </Link>
              <a href="#destinations">
                <Button variant="outline" className="rounded-full border-white/45 bg-white/10 px-7 text-white hover:bg-white/20">
                  {isSw ? 'Chunguza Kumbi' : 'Explore Destinations'}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20">
        <section id="destinations" className="reveal-on-scroll py-20">
          <div className="text-center">
            <h2 className="text-4xl font-semibold md:text-5xl">{isSw ? 'Kumbi' : 'Destinations'}</h2>
            <p className="mt-3 text-sm text-[#6f6f6f]">
              {isSw ? 'Chagua mazingira sahihi kulingana na idadi ya wageni na aina ya tukio.' : 'Select the right atmosphere for your guest count and event mood.'}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {destinationProfiles.map((destination) => (
              <Link key={destination.id} to={`/halls/${destination.id}`} className="group relative h-[380px] overflow-hidden border border-black/10 bg-black block">
                <img
                  src={IMAGES[destination.id as keyof typeof IMAGES]}
                  alt={destination.name}
                  className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">{destination.capacity} {isSw ? 'wageni' : 'guests'}</p>
                  <h3 className="mt-2 text-2xl">{destination.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-white/90">{destination.marketingLine}</p>
                  <p className="mt-1 text-xs text-white/75">{destination.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="rates" className="reveal-on-scroll py-10">
          <div className="text-center">
            <h2 className="text-4xl font-semibold md:text-5xl">{isSw ? 'Bei za Kukodi Kumbi' : 'Hall Rental Rates'}</h2>
            <p className="mt-3 text-sm text-[#6f6f6f]">{isSw ? 'Kumbi zote na bei rasmi kulingana na siku.' : 'All halls with their official day-based pricing.'}</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {destinationProfiles.map((hall) => (
              <article key={hall.id} className="border border-black/10 bg-white p-6">
                <h3 className="text-xl font-semibold">{hall.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7b7b7b]">{hall.capacity} {isSw ? 'wageni' : 'guests'}</p>
                <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
                  {hall.standardRentalRates.map((rate) => (
                    <div key={`${hall.id}-${rate.label}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#4a4a4a]">{rate.label}</span>
                      <span className="font-semibold text-[#161616]">{formatTZS(rate.price)}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/halls/${hall.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
                  {isSw ? 'Tazama maelezo ya ukumbi' : 'View hall details'} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll py-2">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-4 text-[11px] uppercase tracking-[0.24em] text-[#6e6e6e]">
            <span className="h-px flex-1 bg-black/20" />
            {isSw ? 'Kumbi Maalum za Kuringe' : 'Kuringe Signature Venues'}
            <span className="h-px flex-1 bg-black/20" />
          </div>
        </section>

        <section className="reveal-on-scroll py-16">
          <article className="relative min-h-[420px] overflow-hidden bg-[linear-gradient(135deg,#14070a_0%,#3b0b12_42%,#a80c10_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_36%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:auto,34px_34px,34px_34px]" />
            <div className="relative flex min-h-[420px] items-center p-8 md:p-14">
              <div className="max-w-xl text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">{isSw ? 'Uzoefu Maalum' : 'Featured Experience'}</p>
                <h3 className="mt-4 text-3xl leading-tight md:text-4xl">{isSw ? 'Hisia ya Kifalme kwa Wageni Wako' : 'A Palace Feeling for Your Guests'}</h3>
                <p className="mt-4 text-sm text-white/85 md:text-base">
                  {isSw
                    ? 'Unganisha ngazi za mapambo ya ubora wa juu, stage, na mpangilio maalum wa mtiririko ili tukio liende kwa mpangilio kamili.'
                    : 'Combine premium decor tiers, staging, and tailored flow plans to deliver a seamless event story from welcome to finale.'}
                </p>
                <Link to="/?section=planner" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#E6CB8E]">
                  {isSw ? 'Tazama Maelezo Kamili' : 'View Full Details'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className="reveal-on-scroll py-8">
          <h2 className="text-4xl font-semibold">{isSw ? 'Hadithi Zetu' : 'Our Stories'}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-12">
            {STORY_CARDS.map((card, index) => (
              <article
                key={card.title}
                className={`overflow-hidden border border-black/10 bg-white ${index === 0 ? 'md:col-span-5 md:min-h-[360px]' : 'md:col-span-3'} ${index === 1 ? 'md:translate-y-6' : ''}`}
              >
                <img src={card.image} alt={isSw ? card.titleSw : card.titleEn} className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a8a8a]">{isSw ? card.tagSw : card.tagEn}</p>
                  <h3 className="mt-4 text-xl leading-snug">{isSw ? card.titleSw : card.titleEn}</h3>
                  <p className="mt-3 text-sm text-[#5a5a5a]">{isSw ? card.noteSw : card.noteEn}</p>
                  <Link to={card.to} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
                    {isSw ? 'Soma hadithi' : 'Read story'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
            <Link to="/?section=planner" className="md:col-span-12 mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
              {isSw ? 'Tazama maelezo zaidi' : 'See more details'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="packages" className="reveal-on-scroll py-14">
          <article className="relative overflow-hidden bg-black px-6 py-20 text-center text-white md:px-12">
            <img src={IMAGES.suite} alt={isSw ? 'Mpangilio wa kifurushi cha kifahari' : 'Premium suite styling'} className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-4xl font-semibold md:text-5xl">{isSw ? 'Vifurushi vya Kipekee' : 'Sensational Suites'}</h2>
              <p className="mt-4 text-sm text-white/85 md:text-base">{isSw ? 'Chagua ngazi ya kifurushi kulingana na ukubwa wa tukio na mahitaji ya uzalishaji.' : 'Choose package levels based on event scale, production needs, and guest impact.'}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/?section=packages">
                  <Button className="rounded-full bg-white px-6 text-[#111111] hover:bg-white/90">{isSw ? 'Tazama Vifurushi' : 'View Packages'}</Button>
                </Link>
                <Link to="/?section=planner">
                  <Button variant="outline" className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/15">
                    {isSw ? 'Angalia Maelezo Zaidi' : 'See More Details'}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.16em] text-white/80">
                <span>{isSw ? 'Harusi' : 'Weddings'}</span>
                <span>{isSw ? 'Mikutano' : 'Conferences'}</span>
                <span>{isSw ? 'Matukio Binafsi' : 'Private Events'}</span>
                <span>{isSw ? 'Usiku wa Kampuni' : 'Corporate Nights'}</span>
                <span>{isSw ? 'Gala Dinners' : 'Gala Dinners'}</span>
              </div>
            </div>
          </article>
        </section>

        <section id="contact" className="reveal-on-scroll py-14">
          <article className="bg-black px-6 py-14 text-center text-white md:px-12">
            <div className="grid gap-5 md:grid-cols-3">
              <Link to="/booking" className="border border-white/30 px-4 py-8 text-xl transition hover:bg-white hover:text-black">
                {isSw ? 'Uhifadhi wa Haraka' : 'Instant Booking'}
              </Link>
              <Link to="/?section=destinations" className="border border-white/30 px-4 py-8 text-xl transition hover:bg-white hover:text-black">
                {isSw ? 'Chunguza Kumbi' : 'Explore Venues'}
              </Link>
              <button
                type="button"
                onClick={() => setShowSupportDialog(true)}
                className="border border-white/30 px-4 py-8 text-xl transition hover:bg-white hover:text-black"
              >
                {isSw ? 'Msaada wa Moja kwa Moja' : 'Live Local Support'}
              </button>
            </div>
          </article>
        </section>

        <section id="planner" className="reveal-on-scroll py-14">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <article>
              <h3 className="text-3xl font-semibold">{isSw ? 'Panga na Kuringe' : 'Plan With Kuringe'}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#545454]">
                {isSw
                  ? 'Shirikiana na timu yetu kuratibu uchaguzi wa ukumbi, kifurushi cha mapambo, mpangilio wa chakula, na mtiririko wa wageni katika njia moja ya uhifadhi.'
                  : 'Work with our team to align hall choice, decor package, food flow, and guest movement in one clear booking path.'}
                {isSw
                  ? ' Iwe una wageni 50 au 700, tunahakikisha ubora wa maandalizi unabaki wa kiwango cha juu.'
                  : ' Whether you host 50 or 700 guests, we keep setup quality consistent.'}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/booking">
                  <Button className="rounded-full bg-[#121212] px-7 text-white hover:bg-[#272727]">{isSw ? 'Anza Uhifadhi' : 'Start Booking'}</Button>
                </Link>
                <Link to="/?section=policies">
                  <Button variant="outline" className="rounded-full border-black/20 px-7">{isSw ? 'Soma Sera' : 'Read Policies'}</Button>
                </Link>
              </div>
            </article>

            <article className="border border-black/10 bg-white p-6">
              <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative overflow-hidden border border-black/10 min-h-[220px]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#f6efe2_0%,#ebd1a2_45%,#7a151b_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_30%),linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[length:auto,26px_26px,26px_26px]" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{isSw ? 'Vifurushi Bora vya Mapambo' : 'Top Decoration Packages'}</h4>
                  <ul className="mt-5 space-y-4">
                    {decorationPackages.map((pkg, index) => {
                      const style = getDecorationPackageVisual(index);
                      return (
                      <li key={pkg.title} className="border-b border-black/10 pb-4 last:border-b-0 last:pb-0">
                        <p className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${style.badgeClass}`}>
                          {getTierLabel(style.tier, isSw)}
                        </p>
                        <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[#787878]">{getDecorationPackageName(pkg.title)}</p>
                        <p className="mt-1 text-xl font-semibold">{formatTZS(pkg.price)}</p>
                        <p className="mt-2 text-sm text-[#5d5d5d]">{pkg.highlights[0]}</p>
                      </li>
                    )})}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="reveal-on-scroll py-6">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="overflow-hidden border border-black/10 bg-white p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">{isSw ? 'Maelezo Yanayofunguka' : 'Expandable Details'}</p>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                {isSw ? 'Taarifa Zote Muhimu Zimebaki Hapa Kwenye Ukurasa Mmoja' : 'Everything Important Lives on This Single Landing Page'}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5b5b5b]">
                {isSw
                  ? 'Badala ya kurasa nyingi za maelezo, tumebaki na ukurasa mmoja wenye vifungo vya kufungua maelezo ya kina pale tu mgeni anapovihitaji.'
                  : 'Instead of scattering visitors across multiple detail pages, the site now keeps deeper information behind click-to-open sections on one polished homepage.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/booking">
                  <Button className="rounded-full bg-[#121212] px-6 text-white hover:bg-[#272727]">{isSw ? 'Omba Uhifadhi' : 'Request Booking'}</Button>
                </Link>
                <Link to="/?section=policies">
                  <Button variant="outline" className="rounded-full border-black/20 px-6">{isSw ? 'Soma Masharti' : 'Review Policies'}</Button>
                </Link>
              </div>
            </article>

            <article className="overflow-hidden border border-black/10 bg-[#111111] p-6 text-white md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">{isSw ? 'Muhtasari wa Haraka' : 'Quick Summary'}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{isSw ? 'Kumbi' : 'Venues'}</p>
                  <p className="mt-2 text-2xl font-semibold">{destinationProfiles.length}</p>
                  <p className="mt-1 text-sm text-white/75">{isSw ? 'Kuanzia mikusanyiko ya karibu hadi matukio makubwa' : 'From intimate gatherings to major celebrations'}</p>
                </div>
                <div className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{isSw ? 'Vifurushi' : 'Packages'}</p>
                  <p className="mt-2 text-2xl font-semibold">{decorationPackages.length}</p>
                  <p className="mt-1 text-sm text-white/75">{isSw ? 'Ngazi tofauti za mapambo na uzalishaji' : 'Tiered decor and production options'}</p>
                </div>
                <div className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{isSw ? 'Menus' : 'Menus'}</p>
                  <p className="mt-2 text-2xl font-semibold">{foodMenus.length}</p>
                  <p className="mt-1 text-sm text-white/75">{isSw ? 'Chakula, vinywaji, na huduma za ziada' : 'Food, drinks, and extra service options'}</p>
                </div>
                <div className="border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{isSw ? 'Mwongozo' : 'Policies'}</p>
                  <p className="mt-2 text-2xl font-semibold">{hallOperationsPolicy.length + importantNotices.length}</p>
                  <p className="mt-1 text-sm text-white/75">{isSw ? 'Masharti na taarifa muhimu zimefichwa kwa mpangilio' : 'Terms and key notices stay neatly tucked away'}</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="reveal-on-scroll py-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="border border-black/10 bg-white p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">{isSw ? 'Mahitaji ya Tukio' : 'Event Planning Details'}</p>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">{isSw ? 'Fungua tu kile unachohitaji' : 'Open only the details you need'}</h3>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="decor">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Vifurushi vya mapambo' : 'Decoration packages'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {decorationPackages.map((pkg) => (
                        <div key={pkg.title} className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-[#161616]">{getDecorationPackageName(pkg.title)}</p>
                            <p className="text-sm font-semibold text-[#7a151b]">{formatTZS(pkg.price)}</p>
                          </div>
                          <p className="mt-2 text-sm text-[#5d5d5d]">{pkg.highlights.slice(0, 4).join(' • ')}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="food">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Chakula na conference menus' : 'Food and conference menus'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {foodMenus.map((menu) => (
                        <div key={menu.title} className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-[#161616]">{menu.title}</p>
                            <p className="text-sm text-[#5d5d5d]">{isSw ? 'Starter + Buffet' : 'Starter + Buffet'}</p>
                          </div>
                          <p className="mt-2 text-sm text-[#5d5d5d]">{[...menu.starter, ...menu.buffet].slice(0, 7).join(' • ')}</p>
                        </div>
                      ))}
                      {conferencePackages.slice(0, 2).map((pkg) => (
                        <div key={pkg.attendees} className="rounded-2xl border border-black/10 bg-[#f5f2eb] p-4">
                          <p className="font-semibold text-[#161616]">{isSw ? 'Conference' : 'Conference'} {pkg.attendees}</p>
                          <p className="mt-1 text-sm text-[#5d5d5d]">{pkg.pricePoint}</p>
                          <p className="mt-2 text-sm text-[#5d5d5d]">{pkg.amenities.slice(0, 6).join(' • ')}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="drinks">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Vinywaji na huduma za ziada' : 'Drinks and extra services'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4">
                        <p className="font-semibold text-[#161616]">{isSw ? 'Vinywaji maarufu' : 'Popular beverages'}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {beverageList.slice(0, 8).map((drink) => (
                            <div key={drink.name} className="flex items-center justify-between gap-3 text-sm text-[#5d5d5d]">
                              <span>{drink.name}</span>
                              <span className="font-medium text-[#161616]">{formatTZS(drink.price)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-[#6a6a6a]">{beverageNotes[0]}</p>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-[#f5f2eb] p-4">
                        <p className="font-semibold text-[#161616]">{isSw ? 'Huduma nyingine' : 'Additional services'}</p>
                        <p className="mt-2 text-sm text-[#5d5d5d]">{externalServices.join(' • ')}</p>
                        <p className="mt-3 text-sm text-[#5d5d5d]">{cakeOptions.map((item) => `${item.title} (${item.pricePoint})`).join(' • ')}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>

            <article id="policies" className="border border-black/10 bg-white p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">{isSw ? 'Sera na Malipo' : 'Policies and Payments'}</p>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">{isSw ? 'Masharti yamefichwa kwa mpangilio safi' : 'Policies stay tucked behind clean buttons'}</h3>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="operations">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Taratibu za ukumbi' : 'Hall operations policy'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {hallOperationsPolicy.map((item) => (
                        <p key={item} className="rounded-2xl bg-[#faf8f4] px-4 py-3 text-sm text-[#5d5d5d]">{item}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="payment">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Accounts za malipo' : 'Payment accounts'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3">
                      {bankAccounts.map((account) => (
                        <div key={account.bank} className="rounded-2xl border border-black/10 bg-[#faf8f4] p-4">
                          <p className="font-semibold text-[#161616]">{account.bank}</p>
                          <p className="mt-1 text-sm text-[#5d5d5d]">{account.name}</p>
                          <p className="mt-1 text-sm font-medium text-[#7a151b]">{account.account}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="important">
                  <AccordionTrigger className="text-left text-base">{isSw ? 'Taarifa muhimu' : 'Important notices'}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {importantNotices.map((item) => (
                        <p key={item} className="rounded-2xl bg-[#faf8f4] px-4 py-3 text-sm text-[#5d5d5d]">{item}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>
          </div>
        </section>

        <section className="reveal-on-scroll py-8">
          <div className="border-t border-black/15 pt-8">
            <p className="text-center text-2xl">kuringe halls</p>
            <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-[#7a7a7a]">
              {isSw ? 'Ukumbi wa sherehe zako muhimu' : 'A venue for your defining celebrations'}
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-[#070d22] px-4 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold">Kuringe Halls</p>
            <p className="mt-2 text-sm text-white/70">{isSw ? 'Ukumbi wa Kifahari wa Harusi na Matukio' : 'Luxury Wedding and Event Venue'}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/90">
              <Phone className="h-4 w-4 text-[#C6A75E]" /> +255 717 000 000
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{isSw ? 'Chunguza' : 'Explore'}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li><Link to="/?section=destinations">{isSw ? 'Kumbi' : 'Venues'}</Link></li>
              <li><Link to="/?section=packages">{isSw ? 'Vifurushi' : 'Packages'}</Link></li>
              <li><Link to="/?section=planner">{isSw ? 'Upishi na Huduma' : 'Catering and Services'}</Link></li>
              <li><Link to="/?section=policies">{isSw ? 'Sera' : 'Policies'}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{isSw ? 'Pendwa ya Wageni' : 'Guest Favorite'}</p>
            <div className="mt-4 rounded border border-white/20 p-4">
              <p className="text-sm font-medium">{isSw ? 'Ukumbi wa Witness Premium' : 'Witness Hall Premium'}</p>
              <div className="mt-2 flex items-center gap-1 text-[#C6A75E]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-xs text-white/70">{isSw ? 'Maandalizi ya ukubwa mkubwa yenye mwonekano wa chandelier na stage inayobadilika kwa urahisi.' : 'Large scale setup with chandelier finish and full stage flexibility.'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{isSw ? 'Mawasiliano ya Haraka' : 'Quick Contact'}</p>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> {CONTACT_EMAIL}
              </li>
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> Kuringe Complex, Moshi
              </li>
              <li>
                <Link to="/booking" className="inline-flex items-center gap-2 font-medium text-[#E6CB8E]">
                  {isSw ? 'Hifadhi sasa' : 'Reserve now'} <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {showSupportDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-black">{isSw ? 'Tunakusaidiaje?' : 'How can we help?'}</h3>
              <button
                type="button"
                onClick={() => setShowSupportDialog(false)}
                className="rounded-full p-1 text-black/70 transition hover:bg-black/10"
                aria-label={isSw ? 'Funga dirisha la msaada' : 'Close support dialog'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#5a5a5a]">{isSw ? 'Tuma ombi lako na tutaandaa msaada mara moja.' : 'Share your request and we will prepare support details right away.'}</p>
            <div className="mt-4 space-y-3">
              <input
                className="h-11 w-full border border-black/15 px-3 text-sm"
                placeholder={isSw ? 'Jina lako' : 'Your name'}
                value={supportName}
                onChange={(event) => setSupportName(event.target.value)}
              />
              <textarea
                className="w-full border border-black/15 px-3 py-2 text-sm"
                rows={4}
                placeholder={isSw ? 'Andika ujumbe wako' : 'Type your message'}
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-none" onClick={() => setShowSupportDialog(false)}>
                  {isSw ? 'Funga' : 'Close'}
                </Button>
                <Button className="rounded-none bg-black text-white hover:bg-black/90" onClick={openSupportEmail}>
                  {isSw ? 'Tuma Ombi' : 'Send Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
