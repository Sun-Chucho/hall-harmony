import { Link } from 'react-router-dom';
import {
  beverageList,
  conferencePackages,
  decorationPackages,
  hallCatalog,
  muhimuNotes,
  taratibuChecklist,
} from '@/lib/landingData';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const heroStats = [
  { label: 'Premium spaces', value: '3 curated halls' },
  { label: 'Dedicated team', value: 'On-ground hospitality crew' },
  { label: 'Global taste', value: 'Local + international menus' },
];
const heroBackgroundImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const managementCards = [
  {
    title: 'Bookings & approvals',
    description: 'Review schedules, confirm deposits, and lock your preferred hall.',
    path: '/bookings',
  },
  {
    title: 'Customer care',
    description: 'Stay in touch with clients, handle feedback, and share bespoke proposals.',
    path: '/customers',
  },
  {
    title: 'Payments & cash',
    description: 'Capture receipts, prepare deposits, and keep every transaction transparent.',
    path: '/payments',
  },
  {
    title: 'Operations & rentals',
    description: 'Coordinate rentals, equipment, and the on-site crew in one view.',
    path: '/rentals',
  },
];

const culinaryHighlights = [
  {
    name: 'Kilimanjaro Sunset Platter',
    details: 'Grilled seafood, tandoori spices, coconut rice, and citrus tourne.',
    price: 'TSh 85,000 pp',
  },
  {
    name: 'Coastal Harvest Feast',
    details: 'Madras curry, swahili pilau, roasted veggies, and urban salad bowls.',
    price: 'TSh 65,000 pp',
  },
  {
    name: 'Executive Gala Station',
    details: 'Mini wagyu sliders, truffle fries, champagne sorbet, and tasting towers.',
    price: 'TSh 120,000 pp',
  },
];

const processSteps = [
  'Choose the hall or combination that matches your guest count.',
  'Select services, rentals, and décor packages to define the mood.',
  'Lock payments, finalize documents, and notify the operations crew.',
];

const highlightCards = [
  { title: 'Events hosted', value: '450+', description: 'Weddings, conferences, galas' },
  { title: 'Average monthly bookings', value: '24', description: 'Ready for bespoke touches' },
  { title: 'Guest satisfaction', value: '98%', description: 'Repeat clients & referrals' },
];

const HighlightCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
    <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Kuringe<span className="text-red-600">Halls</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#venues" className="hover:text-slate-900">
              Venues
            </a>
            <a href="#culinary" className="hover:text-slate-900">
              Culinary
            </a>
            <a href="#process" className="hover:text-slate-900">
              Process
            </a>
            <Link to="/foods" className="hover:text-slate-900">
              Food menu
            </Link>
          </nav>
          <div className="hidden items-center gap-4 text-sm md:flex">
            <Link to="/customers" className="text-slate-600 hover:text-slate-900">
              <span className="border-b border-transparent pb-0.5 hover:border-slate-900">Customers</span>
            </Link>
            <Link
              to="/bookings"
              className="rounded-full border border-slate-200 bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-slate-800"
            >
              Book now
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-20 pb-24">
        <section className="px-6 pt-16">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-slate-500">Kuringe Halls</p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                World-class celebrations and conferences in Dar es Salaam.
              </h1>
              <p className="text-lg text-slate-500">
                Experience regal venues, curated hospitality, and a culinary team that composes flavors
                fit for executives and family gatherings alike. Every detail is engineered to feel effortless.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/bookings"
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
                >
                  Book your hall
                </Link>
                <Link
                  to="/foods"
                  className="rounded-full border border-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-600 transition hover:border-red-500"
                >
                  View culinary menu
                </Link>
              </div>
              <div className="grid gap-4 pt-8 md:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white shadow-2xl">
                <h2 className="text-xl font-semibold text-white">Refined arrival</h2>
                <p className="mt-2 text-sm text-slate-200">
                  Entry lounges, bespoke lighting, and concierge service keep every guest centered on the celebration.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 border-b border-white/20 pb-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Capacity range</p>
                    <p className="text-2xl font-semibold">30–700</p>
                  </div>
                  <div className="space-y-1 border-b border-white/20 pb-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Avg. events</p>
                    <p className="text-2xl font-semibold">24 / month</p>
                  </div>
                  <div className="space-y-1 border-b border-white/20 pb-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Menu tiers</p>
                    <p className="text-2xl font-semibold">5+</p>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/40 shadow-lg backdrop-blur-sm">
                <div
                  className="relative h-72 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroBackgroundImage})` }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-white/70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="management" className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Management system</p>
                <h2 className="text-3xl font-bold text-slate-900">Every flow ends with a signature experience.</h2>
              </div>
              <Link
                to="/dashboard"
                className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-600 transition hover:text-slate-900"
              >
                Explore the control room →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {managementCards.map((card) => (
                <Link
                  key={card.title}
                  to={card.path}
                  className="group rounded-3xl border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-1 hover:border-slate-300"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Operations</p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                    Open refined view →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="culinary" className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Culinary artistry</p>
                <h2 className="text-3xl font-bold text-slate-900">The food is the stage.</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Global chefs craft menus inspired by Tanzanian coastlines and international trends.
                </p>
              </div>
              <Link
                to="/foods"
                className="text-sm font-semibold uppercase tracking-[0.4em] text-red-600 transition hover:text-red-500"
              >
                View full experience →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {culinaryHighlights.map((item) => (
                <div key={item.name} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{item.name}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Chef</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.details}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl space-y-6 px-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Process</p>
              <h2 className="text-3xl font-bold text-slate-900">Three steps to a flawless event</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {processSteps.map((step, index) => (
                <div key={step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Step {index + 1}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Achievements</p>
                <h2 className="text-3xl font-bold text-slate-900">Performance that feels effortless.</h2>
              </div>
              <Link
                to="/reports"
                className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-600 transition hover:text-slate-900"
              >
                See the reports →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {highlightCards.map((card) => (
                <HighlightCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Rental & extras</p>
                <p className="mt-3 text-sm text-slate-600">
                  Vehicles, décor, AV, and lounges are arranged through our operations desk.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Beverages</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  {beverageList.slice(0, 4).map((drink) => (
                    <li key={drink.name} className="flex items-center justify-between">
                      <span>{drink.name}</span>
                      <span className="text-slate-900">{formatTZS(drink.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">VAT 18% included.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Commitments</p>
                <p className="mt-3 text-sm text-slate-600">{muhimuNotes[0]}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-200">Need help?</p>
              <h2 className="text-3xl font-bold">Call +255 717 000 000 or email bookings@kuringehalls.co.tz</h2>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-200 md:flex-row md:items-center">
              <span>Payments via cash, transfer, or mobile money</span>
              <span className="hidden md:inline">•</span>
              <span>Two-cashier model & audit ready</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
