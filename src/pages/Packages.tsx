import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { conferencePackages } from '@/lib/landingData';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const weddingPackages = [
  {
    title: 'Wedding Essential',
    price: 2000000,
    highlights: ['Stage decoration', 'Entrance decor', 'Photobooth banner 3 metre', 'Red carpet flow setup', 'Dancing floor sticker + printed names'],
  },
  {
    title: 'Wedding Premium',
    price: 5000000,
    highlights: ['Chrome chairs mix (gold/silver/black)', 'Fog machine + moving heads', 'Enhanced floral setup', 'Walking way sticker', 'Table styling with charger plates'],
  },
  {
    title: 'Wedding Royal',
    price: 8000000,
    highlights: ['LED stage feature', 'Truss + printed banner', '8 chandeliers', 'Laser machine first dance', 'Crystal table glassware set'],
  },
];

const galaPackages = [
  {
    title: 'Gala Signature',
    price: 1000000,
    highlights: ['Formal red carpet entrance', 'Reception stage styling', 'Coordinated table mood lighting', 'Premium ushering flow', 'Brand-ready photo points'],
  },
  {
    title: 'Gala Prestige',
    price: 1500000,
    highlights: ['Expanded floral and stage layering', 'Enhanced VIP seating zones', 'Lighting choreography for arrivals', 'Premium dining table curation', 'Media-friendly backdrops'],
  },
  {
    title: 'Gala Imperial',
    price: 2500000,
    highlights: ['High-impact arrival reveal', 'Cinematic hall atmosphere design', 'Executive protocol seating map', 'Live stage visual control', 'Luxury grand finale setup'],
  },
];

const studentPackages = [
  {
    title: 'Campus Social',
    price: 500000,
    highlights: ['Set up table', 'Stage decor', 'Theme setup', 'LED light', 'Group photo corner'],
  },
  {
    title: 'Campus Festival',
    price: 800000,
    highlights: ['Expanded capacity decor', 'Flowers and charger plates', 'Stage decor + LED light', 'Theme and table styling', 'Audience movement zoning'],
  },
  {
    title: 'Campus Graduation Plus',
    price: 1000000,
    highlights: ['Photo booth feature', 'Red carpet line', 'Napkin + table styling', 'High-capacity decor finish', 'Celebration reveal moments'],
  },
];

const sectionTheme = [
  {
    key: 'wedding',
    title: 'Wedding Packages',
    subtitle: 'Designed for vows, elegance, and unforgettable first moments.',
    card: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200',
    button: 'bg-rose-700 text-white hover:bg-rose-800',
    data: weddingPackages,
  },
  {
    key: 'gala',
    title: 'Gala Packages',
    subtitle: 'Built for grand hosting, executive flow, and statement impact.',
    card: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    button: 'bg-amber-700 text-white hover:bg-amber-800',
    data: galaPackages,
  },
  {
    key: 'conference',
    title: 'Conference Packages',
    subtitle: 'Structured for clarity, delivery speed, and attendee comfort.',
    card: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
    button: 'bg-blue-700 text-white hover:bg-blue-800',
    data: conferencePackages.map((pkg, index) => ({
      title: `Conference Tier ${index + 1} (${pkg.attendees})`,
      price: Number(pkg.pricePoint.match(/\d[\d,]*/)?.[0]?.replace(/,/g, '') ?? '0'),
      highlights: pkg.amenities,
    })),
  },
  {
    key: 'students',
    title: 'Student Packages',
    subtitle: 'Affordable, vibrant, and optimized for school and campus events.',
    card: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
    button: 'bg-emerald-700 text-white hover:bg-emerald-800',
    data: studentPackages,
  },
];

export default function Packages() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Vifurushi vya Matukio' : 'Event Packages'}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Wedding, Gala, Conference na Students' : 'Wedding, Gala, Conference, and Students'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            {isSw
              ? 'Tuligawanya vifurushi kwa aina ya tukio ili maamuzi yawe rahisi, bei ziwe wazi, na utekelezaji uwe wa kiwango cha kimataifa.'
              : 'We grouped packages by event class so decision-making is faster, pricing is clearer, and execution remains world-class.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16 space-y-16">
        {sectionTheme.map((section) => (
          <section key={section.key}>
            <div className="mb-7">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{section.title}</h2>
              <p className="mt-2 text-muted-foreground">{section.subtitle}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {section.data.slice(0, 3).map((pkg) => (
                <article key={`${section.key}-${pkg.title}`} className={`rounded-3xl border p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${section.card} min-h-[560px]`}>
                  <h3 className="text-2xl font-bold text-foreground">{pkg.title}</h3>
                  <p className="mt-3 text-3xl font-extrabold text-foreground">
                    {pkg.price > 0 ? formatTZS(pkg.price) : 'LIPA UKUMBI'}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {pkg.highlights.slice(0, 8).map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-foreground/85">
                        <Check className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link to={`/booking?package=${encodeURIComponent(pkg.title)}`}>
                      <Button className={`w-full py-6 text-base ${section.button}`}>
                        {isSw ? 'Chagua Kifurushi Hiki' : 'Select This Package'}
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
