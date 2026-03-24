import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { SITE_IMAGES } from '@/lib/siteImages';

const STORIES = [
  {
    id: 'feature-story',
    tag: 'Feature Story',
    title: 'Nymphenburg Porcelain Style Setup',
    note: 'Elegant table styling and layered textures for premium receptions.',
    image: SITE_IMAGES.premium,
    detail:
      'This setup combines porcelain tone layering, warm gold accents, and balanced centerpiece geometry to maintain visual harmony from stage line to guest seating.',
  },
  {
    id: 'event-journal',
    tag: 'Event Journal',
    title: 'Hall A Signature Wedding',
    note: 'A 600-guest celebration built around custom lighting and stage reveals.',
    image: SITE_IMAGES.journal,
    detail:
      'The Hall A flow used timed lighting scenes, mapped aisle movement, and a layered dance-floor reveal to coordinate photography, speeches, and live moments without delays.',
  },
  {
    id: 'planning-guide',
    tag: 'Planning Guide',
    title: 'Boardroom to Banquet in Hall D',
    note: 'Flexible transitions for intimate meetings and evening dinners.',
    image: SITE_IMAGES.editorial,
    detail:
      'Hall D layouts can move from conference mode to dining mode in one service window by pre-zoning decor, cable routes, and table staging before first guest arrival.',
  },
];

export default function Stories() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#171717]">
      <PublicNavbar ctaLabel={isSw ? 'Hifadhi Tarehe Yako' : 'Book Your Date'} />

      <section className="relative isolate h-[60vh] min-h-[460px] overflow-hidden px-4">
        <img
          src={SITE_IMAGES.lounge}
          alt="Kuringe stories"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <div className="mx-auto flex h-full max-w-7xl items-center">
          <div className="max-w-3xl text-white">
            <p className="text-xs uppercase tracking-[0.32em] text-white/75">Kuringe Journal</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
              {isSw ? 'Hadithi na Maelezo ya Matukio' : 'Stories and Event Details'}
            </h1>
            <p className="mt-4 text-sm text-white/85 md:text-base">
              {isSw
                ? 'Chunguza maelezo ya kina ya mipangilio yetu maalum, kumbukumbu za matukio, na miongozo ya upangaji.'
                : 'Explore full breakdowns behind our featured setups, event journals, and planning guides.'}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <section id="featured-experience" className="mb-12 border border-black/10 bg-white p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7a7a7a]">Featured Experience</p>
          <h2 className="mt-3 text-3xl font-semibold">{isSw ? 'Hisia ya Kifalme kwa Wageni Wako' : 'A Palace Feeling for Your Guests'}</h2>
          <p className="mt-3 max-w-3xl text-sm text-[#545454]">
            {isSw
              ? 'Mwelekeo huu wa kipekee unaunganisha stage ya ubora wa juu, ngazi za mapambo maalum, na mtiririko wa huduma ulioratibiwa. Umeundwa kwa matukio yanayohitaji mwonekano wa kuvutia huku harakati za wageni zikiendelea vizuri.'
              : 'This signature direction blends premium staging, custom decor tiers, and coordinated service flow. It is designed for events that need cinematic impact while keeping guest movement smooth.'}
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/packages">
              <Button className="rounded-none bg-black text-white hover:bg-black/90">
                {isSw ? 'Tazama Ngazi za Vifurushi' : 'See Package Levels'}
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="outline" className="rounded-none border-black/20">
                {isSw ? 'Anza Uhifadhi' : 'Start Booking'}
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-10">
          {STORIES.map((story) => (
            <article key={story.id} id={story.id} className="overflow-hidden border border-black/10 bg-white">
              <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
                <img src={story.image} alt={story.title} className="h-[320px] w-full object-cover md:h-full" />
                <div className="p-8">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a8a8a]">{story.tag}</p>
                  <h3 className="mt-4 text-3xl font-semibold leading-snug">{story.title}</h3>
                  <p className="mt-3 text-base text-[#4f4f4f]">{story.note}</p>
                  <p className="mt-4 text-sm leading-relaxed text-[#5b5b5b]">{story.detail}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/venues">
                      <Button variant="outline" className="rounded-none border-black/25">Tour Venues</Button>
                    </Link>
                    <Link to="/booking">
                      <Button className="rounded-none bg-black text-white hover:bg-black/90">
                        Book This Style <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="bg-[#070d22] px-4 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold">Kuringe Halls</p>
            <p className="mt-2 text-sm text-white/70">Luxury Wedding and Event Venue</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/90">
              <Phone className="h-4 w-4 text-[#C6A75E]" /> +255 717 000 000
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> kuringenexus.moshi@gmail.com
              </li>
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> Kuringe Complex, Moshi
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Actions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/booking">
                <Button className="rounded-none bg-white text-black hover:bg-white/90">{isSw ? 'Hifadhi Sasa' : 'Book Now'}</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="rounded-none border-white/30 text-white hover:bg-white/15">{isSw ? 'Rudi Mwanzo' : 'Back Home'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
