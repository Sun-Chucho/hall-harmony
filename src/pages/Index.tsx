import { Link } from 'react-router-dom';
import {
  beverageList,
  conferencePackages,
  decorationPackages,
  hallCatalog,
  muhimuNotes,
  taratibuChecklist,
} from '@/lib/landingData';

const heroStats = [
  { label: 'Signature halls', value: '3 adventurous spaces' },
  { label: 'Design toolkit', value: 'Dedicated planning suite' },
  { label: 'Guest care', value: 'Concierge & ops crew' },
];

const designPillars = [
  {
    title: 'Digital preview studio',
    description: 'Render floor plans, lighting cues, and décor palettes before any in-person walkthrough.',
  },
  {
    title: 'Story-driven narratives',
    description: 'Share bespoke hall stories, mood boards, and live bookmarks with planners or clients.',
  },
  {
    title: 'Real-time collaboration',
    description: 'Invite stakeholders to comment, lock services, and approve cut sheets together.',
  },
];

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
};

const processSteps = [
  'Pick the hall and preview the layout with digital renderings.',
  'Design the experience by pairing décor, lighting, and culinary packages.',
  'Lock the date, assign the operations crew, and share access to your team.',
];

const highlightCards = [
  { title: 'Events hosted', value: '450+', description: 'Weddings, conferences & galas.' },
  { title: 'Avg. guests served', value: '320', description: 'Across every hall monthly.' },
  { title: 'Client happiness', value: '98%', description: 'Repeat bookings & referrals.' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const HighlightCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{title}</p>
    <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-semibold tracking-wide text-slate-900">
            Kuringe<span className="text-red-600">Halls</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#halls" className="hover:text-slate-900 transition">
              Halls
            </a>
            <a href="#design" className="hover:text-slate-900 transition">
              Studio
            </a>
            <a href="#culinary" className="hover:text-slate-900 transition">
              Culinary
            </a>
            <a href="#process" className="hover:text-slate-900 transition">
              Process
            </a>
          </nav>
          <div className="hidden items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-600 md:flex">
            <Link
              to="/bookings"
              className="rounded-full border border-slate-200 px-5 py-2 tracking-[0.4em] text-slate-900 transition hover:border-slate-400"
            >
              Bookings
            </Link>
            <Link
              to="/foods"
              className="rounded-full border border-red-500 px-5 py-2 text-red-600 transition hover:bg-red-500 hover:text-white"
            >
              Culinary menu
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-20 pb-24">
        <section className="relative px-6 pt-20">
          <div className="mx-auto grid max-w-6xl gap-12 rounded-3xl border border-slate-200 bg-white p-10 shadow-lg lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-slate-500">Kuringe Halls</p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
                World-class venues, digital design tools, and flawless hospitality in Dar es Salaam.
              </h1>
              <p className="text-lg text-slate-600">
                Every hall is designed for purpose, supported by concierge teams, and guided by a planning studio that lets
                you explore lighting, menus, and décor ahead of time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/venues"
                  className="rounded-full border border-slate-900/20 bg-slate-900/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:border-slate-700"
                >
                  Explore halls
                </Link>
                <Link
                  to="/foods"
                  className="rounded-full border border-red-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-600 transition hover:bg-red-50"
                >
                  View culinary menu
                </Link>
              </div>
              <div className="grid gap-4 pt-8 md:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="space-y-4 rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-900">Experience studio</h2>
                <p className="text-sm text-slate-600">
                  Sample lighting cues, taste menus, and collaborate with your planner before the event day.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {designPillars.map((pillar) => (
                    <div key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{pillar.title}</p>
                      <p className="mt-2 text-slate-800">{pillar.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg">
                <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Signature service</p>
                <p className="text-2xl font-bold text-slate-900">Concierge crews + ops directors</p>
                <p className="text-sm text-slate-600">
                  Operations and guest care experts are on-site to ensure everything happens exactly as planned.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {['Design', 'Guests', 'Tech'].map((label) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs uppercase tracking-[0.3em] text-slate-600"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="halls" className="px-6">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Our halls</p>
                <h2 className="text-3xl font-bold text-slate-900">Every space has its own story.</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Explore climate-controlled ballrooms, garden views, and intimate salons with bespoke services.
                </p>
              </div>
              <Link
                to="/venues"
                className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                View all venues →
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {hallCatalog.map((hall) => (
                <div
                  key={hall.id}
                  className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden">
                    <img
                      src={hallImages[hall.id]}
                      alt={hall.name}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-xs uppercase tracking-[0.4em] text-white/80">
                      {hall.alias}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">{hall.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{hall.description}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{hall.capacity}</p>
                    <Link
                      to={`/halls/${hall.id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-500 transition hover:text-red-600"
                    >
                      View hall page →
                    </Link>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Starting rate</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(Math.min(...hall.rates.map((rate) => rate.price)))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Achievements</p>
              <h2 className="text-3xl font-bold text-slate-900">Performance that feels effortless.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {highlightCards.map((card) => (
                <HighlightCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section id="design" className="px-6">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Design studio</p>
              <h2 className="text-3xl font-bold text-slate-900">Build your page-perfect event concept.</h2>
              <p className="text-sm text-slate-600">
                Combine furniture, lighting, and themed décor within our studio then share polished visuals with clients or teams.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {decorationPackages.slice(0, 3).map((pkg) => (
                <div
                  key={pkg.title}
                  className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-slate-900">{pkg.title}</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {pkg.highlights.length} curated elements
                  </p>
                  <ul className="space-y-1 text-slate-600">
                    {pkg.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Conference programs</p>
              <h2 className="text-3xl font-bold text-slate-900">Tailored agendas for every gathering.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {conferencePackages.map((pkg) => (
                <div key={pkg.attendees} className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{pkg.attendees}</p>
                  <h3 className="text-xl font-semibold text-slate-900">{pkg.pricePoint}</h3>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    {pkg.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2">
                        <span className="text-red-400">•</span>
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="culinary" className="px-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Culinary artistry</p>
                <h2 className="text-3xl font-bold text-slate-900">Menus shaped by Tanzania & the coast.</h2>
              </div>
              <Link
                to="/foods"
                className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Explore menus →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {beverageList.slice(0, 3).map((item) => (
                <div
                  key={item.name}
                  className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm"
                >
                  <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Starting at {formatCurrency(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Process</p>
              <h2 className="text-3xl font-bold text-slate-900">Designed to keep every detail under control.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {processSteps.map((step, index) => (
                <div key={step} className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Step {index + 1}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Guidelines</p>
                <p className="mt-3 text-slate-600">{taratibuChecklist[0]}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Commitments</p>
                <p className="mt-3 text-slate-600">{muhimuNotes[0]}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-red-100 via-white to-purple-100 p-8 text-slate-900 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Need support?</p>
              <h2 className="text-3xl font-bold">Call +255 717 000 000 or email bookings@kuringehalls.co.tz</h2>
              <p className="mt-3 text-sm text-slate-600">
                Payments via cash, transfer, or mobile money. Two-cashier model & audit-ready receipts keep you compliant.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
