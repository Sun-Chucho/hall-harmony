import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { destinationProfiles } from '@/lib/destinationProfiles';
import { VENUE_IMAGE_BY_ID } from '@/lib/siteImages';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function Venues() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Kumbi Zetu' : 'Our Destinations'}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Chagua Jukwaa la Tukio Lako Kuu' : 'Choose the Stage for Your Signature Event'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            {isSw
              ? 'Kutoka ukumbi wa kifahari wa wageni wengi hadi mazingira ya karibu ya kiwango cha juu, kila destination imeandaliwa kwa mwonekano wa kuvutia na uendeshaji wa uhakika.'
              : 'From large-scale ballroom drama to intimate premium settings, each destination is engineered for visual impact, operational precision, and unforgettable guest experience.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 space-y-14">
        {destinationProfiles.map((destination, index) => (
          <section
            key={destination.id}
            className={`grid gap-10 items-center lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
          >
            <div className="relative overflow-hidden border border-black/10">
              <img
                src={VENUE_IMAGE_BY_ID[destination.id]}
                alt={destination.name}
                className="h-[380px] w-full object-cover md:h-[460px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/80">{destination.alias}</p>
                <h2 className="mt-2 text-3xl font-semibold">{destination.name}</h2>
                <p className="mt-2 text-sm text-white/85">{destination.capacity} {isSw ? 'wageni' : 'guests'}</p>
              </div>
              {index === 0 ? (
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 bg-[#111111]/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  <Star className="h-4 w-4 fill-current text-[#e9c36a]" />
                  {isSw ? 'Kiwango cha Juu' : 'Signature Tier'}
                </div>
              ) : null}
            </div>

            <article className="border border-black/10 bg-white p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isSw ? 'Mstari wa Uuzaji' : 'Marketing Hook'}</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight">{destination.marketingLine}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">{destination.shortDescription}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {destination.signatureHighlights.slice(0, 4).map((line) => (
                  <div key={line} className="flex items-start gap-2 border border-black/10 bg-[#faf9f6] px-3 py-3 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a80c10]" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{isSw ? 'Bei ya Kuanzia' : 'Starting Price'}</p>
                <p className="mt-2 text-2xl font-bold text-[#111111]">
                  {formatTZS(Math.min(...destination.standardRentalRates.map((row) => row.price)))}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={`/halls/${destination.id}`}>
                  <Button className="rounded-none bg-black text-white hover:bg-black/90">
                    {isSw ? 'Fungua Maelezo Kamili' : 'Open Full Destination'} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/booking">
                  <Button variant="outline" className="rounded-none border-black/20">
                    <Calendar className="mr-2 h-4 w-4" />
                    {isSw ? 'Anza Uhifadhi' : 'Start Booking'}
                  </Button>
                </Link>
              </div>
            </article>
          </section>
        ))}
      </main>

      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isSw ? 'Uko Tayari Kuweka Tarehe Yako?' : 'Ready to Lock Your Date?'}
          </h2>
          <p className="text-lg text-background/70 mb-8">
            {isSw
              ? 'Timu yetu itakusaidia kuchagua destination sahihi, kifurushi, na mpangilio wa huduma kulingana na ukubwa na hadhi ya tukio lako.'
              : 'Our team will help you match the right destination, package tier, and service flow to your event scale and vision.'}
          </p>
          <Link to="/booking">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
              {isSw ? 'Wasilisha Ombi la Uhifadhi' : 'Submit Booking Request'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
