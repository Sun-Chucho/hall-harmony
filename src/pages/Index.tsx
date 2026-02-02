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
  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-lg">
    <p className="text-xs uppercase tracking-[0.4em] text-white/70">{title}</p>
    <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    <p className="mt-2 text-sm text-white/60">{description}</p>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-semibold tracking-wide">
            Kuringe<span className="text-red-500">Halls</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <a href="#halls" className="hover:text-white transition">
              Halls
            </a>
            <a href="#design" className="hover:text-white transition">
              Studio
            </a>
            <a href="#culinary" className="hover:text-white transition">
              Culinary
            </a>
            <a href="#process" className="hover:text-white transition">
              Process
            </a>
          </nav>
          <div className="hidden items-center gap-4 text-xs uppercase tracking-[0.3em] md:flex">
            <Link
              to="/bookings"
              className="rounded-full border border-white/20 px-5 py-2 tracking-[0.4em] text-white transition hover:border-white"
            >
              Bookings
            </Link>
            <Link
              to="/foods"
              className="rounded-full border border-red-500 px-5 py-2 text-red-300 transition hover:bg-red-500 hover:text-white"
            >
              Culinary menu
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_45%)]" />
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-white/60">Kuringe Halls</p>
              <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                World-class venues, digital design tools, and flawless hospitality in Dar es Salaam.
              </h1>
              <p className="text-lg text-white/70">
                Every hall is crafted with purpose, concierge teams, and a planning studio that lets you preview
                lighting, menus, and décor before the event day.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/venues"
                  className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/40"
                >
                  Explore halls
                </Link>
                <Link
                  to="/foods"
                  className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
                >
                  View culinary menu
                </Link>
              </div>
              <div className="grid gap-4 pt-8 md:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
                <h2 className="text-xl font-semibold text-white">Glassy experience studio</h2>
                <p className="mt-3 text-sm text-white/60">
                  Design lines, sample menus, and collaborate with your planner inside a shared dashboard that mirrors
                  the actual venue mood before any decision is locked.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {designPillars.map((pillar) => (
                    <div key={pillar.title} className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{pillar.title}</p>
                      <p className="mt-2">{pillar.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-red-500/30 via-black to-black p-8 text-white shadow-2xl">
                <p className="text-sm uppercase tracking-[0.4em] text-white/70">Signature service</p>
                <p className="mt-4 text-2xl font-bold">Concierge crews + ops directors</p>
                <p className="mt-3 text-sm text-white/70">
                  Operations & guest care teams are on-site to ensure every page-perfect plan plays out precisely.
                </p>
                <div className="mt-6 grid gap-3 text-white/80 sm:grid-cols-3">
                  {['Design', 'Guests', 'Tech'].map((label) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 p-3 text-center text-xs uppercase tracking-[0.3em]"
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
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Our halls</p>
                <h2 className="text-3xl font-bold text-white">Every space has its own story.</h2>
                <p className="mt-2 text-sm text-white/50">
                  Explore climate-controlled ballrooms, garden views, and intimate salons with bespoke services.
                </p>
              </div>
              <Link
                to="/venues"
                className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white"
              >
                View all venues →
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {hallCatalog.map((hall) => (
                <div
                  key={hall.id}
                  className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden">
                    <img
                      src={hallImages[hall.id]}
                      alt={hall.name}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-xs uppercase tracking-[0.4em] text-white/80">
                      {hall.alias}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{hall.name}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{hall.description}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{hall.capacity}</p>
                    <Link
                      to={`/halls/${hall.id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400 transition hover:text-red-300"
                    >
                      View hall page →
                    </Link>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Starting rate</p>
                    <p className="text-lg font-semibold text-white">
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
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Achievements</p>
              <h2 className="text-3xl font-bold text-white">Performance that feels effortless.</h2>
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
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Design studio</p>
              <h2 className="text-3xl font-bold text-white">Build your page-perfect event concept.</h2>
              <p className="text-sm text-white/60">
                Combine furniture, lighting, and themed décor within our studio then share polished visuals with clients or teams.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {decorationPackages.slice(0, 3).map((pkg) => (
                <div
                  key={pkg.title}
                  className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70"
                >
                  <h3 className="text-xl font-semibold text-white">{pkg.title}</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {pkg.highlights.length} curated elements
                  </p>
                  <ul className="space-y-1 text-white/70">
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
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Conference programs</p>
              <h2 className="text-3xl font-bold text-white">Tailored agendas for every gathering.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {conferencePackages.map((pkg) => (
                <div key={pkg.attendees} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">{pkg.attendees}</p>
                  <h3 className="text-xl font-semibold text-white">{pkg.pricePoint}</h3>
                  <ul className="mt-3 space-y-2">
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
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Culinary artistry</p>
                <h2 className="text-3xl font-bold text-white">Menus shaped by Tanzania & the coast.</h2>
              </div>
              <Link
                to="/foods"
                className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white"
              >
                Explore menus →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {beverageList.slice(0, 3).map((item) => (
                <div
                  key={item.name}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70"
                >
                  <p className="text-lg font-semibold text-white">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Starting at {formatCurrency(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Process</p>
              <h2 className="text-3xl font-bold text-white">Designed to keep every detail under control.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {processSteps.map((step, index) => (
                <div key={step} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Step {index + 1}</p>
                  <p className="mt-3 text-lg font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Guidelines</p>
                <p className="mt-3">{taratibuChecklist[0]}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Commitments</p>
                <p className="mt-3">{muhimuNotes[0]}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-red-600 to-purple-600 p-8 text-white shadow-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Need support?</p>
              <h2 className="text-3xl font-bold">Call +255 717 000 000 or email bookings@kuringehalls.co.tz</h2>
              <p className="mt-3 text-sm text-white/80">
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
