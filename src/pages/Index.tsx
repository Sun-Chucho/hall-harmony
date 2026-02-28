import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { getDecorationPackageName, getDecorationPackageVisual } from '@/lib/packageStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { destinationProfiles } from '@/lib/destinationProfiles';

const CONTACT_EMAIL = 'kuringenexus.moshi@gmail.com';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2200&q=80',
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80',
  'kilimanjaro-garden': 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
  story: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=2200&q=80',
  suite: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2200&q=80',
};

const STORY_CARDS = [
  {
    title: 'Nymphenburg Porcelain Style Setup',
    note: 'Elegant table styling and layered textures for premium receptions.',
    tag: 'Feature Story',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
    to: '/stories#feature-story',
  },
  {
    title: 'Hall A Signature Wedding',
    note: 'A 600-guest celebration built around custom lighting and stage reveals.',
    tag: 'Event Journal',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    to: '/stories#event-journal',
  },
  {
    title: 'Boardroom to Banquet in Hall D',
    note: 'Flexible transitions for intimate meetings and evening dinners.',
    tag: 'Planning Guide',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    to: '/stories#planning-guide',
  },
];

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function Index() {
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
        <img src={IMAGES.hero} alt="Kuringe wedding arrival" className="absolute inset-0 -z-20 h-full w-full object-cover" />
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
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">{destination.capacity} guests</p>
                  <h3 className="mt-2 text-2xl">{destination.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-white/90">{destination.marketingLine}</p>
                  <p className="mt-1 text-xs text-white/75">{destination.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll py-10">
          <div className="text-center">
            <h2 className="text-4xl font-semibold md:text-5xl">{isSw ? 'Bei za Kukodi Kumbi' : 'Hall Rental Rates'}</h2>
            <p className="mt-3 text-sm text-[#6f6f6f]">{isSw ? 'Kumbi zote na bei rasmi kulingana na siku.' : 'All halls with their official day-based pricing.'}</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {destinationProfiles.map((hall) => (
              <article key={hall.id} className="border border-black/10 bg-white p-6">
                <h3 className="text-xl font-semibold">{hall.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7b7b7b]">{hall.capacity} guests</p>
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
            Kuringe Signature Venues
            <span className="h-px flex-1 bg-black/20" />
          </div>
        </section>

        <section className="reveal-on-scroll py-16">
          <article className="relative min-h-[420px] overflow-hidden">
            <img src={IMAGES.story} alt="Premium featured setup" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative flex min-h-[420px] items-center p-8 md:p-14">
              <div className="max-w-xl text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">Featured Experience</p>
                <h3 className="mt-4 text-3xl leading-tight md:text-4xl">{isSw ? 'Hisia ya Kifalme kwa Wageni Wako' : 'A Palace Feeling for Your Guests'}</h3>
                <p className="mt-4 text-sm text-white/85 md:text-base">
                  {isSw
                    ? 'Unganisha ngazi za mapambo ya ubora wa juu, stage, na mpangilio maalum wa mtiririko ili tukio liende kwa mpangilio kamili.'
                    : 'Combine premium decor tiers, staging, and tailored flow plans to deliver a seamless event story from welcome to finale.'}
                </p>
                <Link to="/stories#featured-experience" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#E6CB8E]">
                  {isSw ? 'Tazama Uzoefu Kamili' : 'View Full Experience'} <ArrowRight className="h-4 w-4" />
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
                <img src={card.image} alt={card.title} className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a8a8a]">{card.tag}</p>
                  <h3 className="mt-4 text-xl leading-snug">{card.title}</h3>
                  <p className="mt-3 text-sm text-[#5a5a5a]">{card.note}</p>
                  <Link to={card.to} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
                    {isSw ? 'Soma hadithi' : 'Read story'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
            <Link to="/stories" className="md:col-span-12 mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
              {isSw ? 'Tazama hadithi zaidi' : 'See more stories'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="reveal-on-scroll py-14">
          <article className="relative overflow-hidden bg-black px-6 py-20 text-center text-white md:px-12">
            <img src={IMAGES.suite} alt="Premium suite styling" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-4xl font-semibold md:text-5xl">{isSw ? 'Vifurushi vya Kipekee' : 'Sensational Suites'}</h2>
              <p className="mt-4 text-sm text-white/85 md:text-base">{isSw ? 'Chagua ngazi ya kifurushi kulingana na ukubwa wa tukio na mahitaji ya uzalishaji.' : 'Choose package levels based on event scale, production needs, and guest impact.'}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/packages">
                  <Button className="rounded-full bg-white px-6 text-[#111111] hover:bg-white/90">{isSw ? 'Tazama Vifurushi' : 'View Packages'}</Button>
                </Link>
                <Link to="/catering">
                  <Button variant="outline" className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/15">
                    {isSw ? 'Tazama Catering' : 'View Catering'}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.16em] text-white/80">
                <span>Weddings</span>
                <span>Conferences</span>
                <span>Private Events</span>
                <span>Corporate Nights</span>
                <span>Gala Dinners</span>
              </div>
            </div>
          </article>
        </section>

        <section className="reveal-on-scroll py-14">
          <article className="bg-black px-6 py-14 text-center text-white md:px-12">
            <div className="grid gap-5 md:grid-cols-3">
              <Link to="/booking" className="border border-white/30 px-4 py-8 text-xl transition hover:bg-white hover:text-black">
                {isSw ? 'Uhifadhi wa Haraka' : 'Instant Booking'}
              </Link>
              <Link to="/venues" className="border border-white/30 px-4 py-8 text-xl transition hover:bg-white hover:text-black">
                {isSw ? 'Ziara za Utambuzi' : 'Discovery Tours'}
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

        <section className="reveal-on-scroll py-14">
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
                <Link to="/taratibu">
                  <Button variant="outline" className="rounded-full border-black/20 px-7">{isSw ? 'Soma Sera' : 'Read Policies'}</Button>
                </Link>
              </div>
            </article>

            <article className="border border-black/10 bg-white p-6">
              <h4 className="text-lg font-semibold">{isSw ? 'Vifurushi Bora vya Mapambo' : 'Top Decoration Packages'}</h4>
              <ul className="mt-5 space-y-4">
                {decorationPackages.map((pkg, index) => {
                  const style = getDecorationPackageVisual(index);
                  return (
                  <li key={pkg.title} className="border-b border-black/10 pb-4 last:border-b-0 last:pb-0">
                    <p className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${style.badgeClass}`}>
                      {style.tier}
                    </p>
                    <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[#787878]">{getDecorationPackageName(pkg.title)}</p>
                    <p className="mt-1 text-xl font-semibold">{formatTZS(pkg.price)}</p>
                    <p className="mt-2 text-sm text-[#5d5d5d]">{pkg.highlights[0]}</p>
                  </li>
                )})}
              </ul>
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
              <li><Link to="/packages">{isSw ? 'Vifurushi' : 'Packages'}</Link></li>
              <li><Link to="/catering">{isSw ? 'Upishi' : 'Catering'}</Link></li>
              <li><Link to="/drinks">{isSw ? 'Vinywaji' : 'Drinks'}</Link></li>
              <li><Link to="/stories">{isSw ? 'Hadithi' : 'Stories'}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">{isSw ? 'Pendwa ya Wageni' : 'Guest Favorite'}</p>
            <div className="mt-4 rounded border border-white/20 p-4">
              <p className="text-sm font-medium">Witness Hall Premium</p>
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
                aria-label="Close support dialog"
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
