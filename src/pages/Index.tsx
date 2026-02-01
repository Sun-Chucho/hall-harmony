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

const managementTiles = [
  {
    title: 'Bookings',
    description: 'Check availability, approve requests, and keep venues in sync.',
    path: '/bookings',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Customers',
    description: 'View profiles, correspondence, and feedback loops.',
    path: '/customers',
    image: 'https://images.unsplash.com/photo-1459664018906-0856f44c1e08?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Payments',
    description: 'Record receipts, print approvals, and stay audit ready.',
    path: '/payments',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Cash Movement',
    description: 'Track deposits, vault counts, and mover approvals.',
    path: '/cash-movement',
    image: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=900&q=80',
  },
];

const processSteps = [
  'Choose a hall or combination that matches your guest count.',
  'Select services, rentals, and decor packages to match the moment.',
  'Lock payments, finalize documents, and notify your team through the portal.',
];

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1503399535900-0cbbd3c6b1c4?auto=format&fit=crop&w=900&q=80',
};

const HighlightCard = ({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) => (
  <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-3xl transition hover:border-white/40">
    <p className="text-xs uppercase tracking-[0.3em] text-primary">{title}</p>
    <p className="mt-3 text-2xl font-semibold">{value}</p>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold tracking-wide text-white">
            Kuringe Halls
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <a href="#venues" className="hover:text-white">
              Venues
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#taratibu" className="hover:text-white">
              Taratibu
            </a>
            <a href="#muhimu" className="hover:text-white">
              Muhimu
            </a>
            <a href="#packages" className="hover:text-white">
              Packages
            </a>
          </div>
          <Link
            to="/login"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section
          className="relative isolate overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(110deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.85)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/30 to-slate-950/90" />
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-black/70 backdrop-blur-3xl">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6 text-white">
                  <p className="text-sm uppercase tracking-[0.5em] text-primary">KURINGE HALLS</p>
                  <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                    World-class spaces for weddings, conferences, and celebrations across Dar es Salaam.
                  </h1>
                  <p className="text-lg text-white/80">
                    Witness Hall, Kilimanjaro Hall &amp; Gardens, and Hall D are curated for unforgettable moments.
                    Book online, lock your schedule, and let the operations team handle the rest with
                    concierge-grade oversight.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/bookings"
                      className="rounded-full bg-primary/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:-translate-y-0.5"
                    >
                      Start booking
                    </Link>
                    <Link
                      to="/services"
                      className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
                    >
                      Explore services
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/20 bg-slate-950/40 p-6 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.4em] text-primary">Check availability</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.4em] text-white/70">
                        Event type
                      </label>
                      <select className="mt-2 w-full bg-transparent text-white outline-none">
                        <option>Wedding</option>
                        <option>Conference</option>
                        <option>Birthday</option>
                        <option>Meeting</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.4em] text-white/70">
                        Location
                      </label>
                      <select className="mt-2 w-full bg-transparent text-white outline-none">
                        <option>Kuringe Halls</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.4em] text-white/70">
                        Select date
                      </label>
                      <input
                        type="date"
                        className="mt-2 w-full bg-transparent text-white outline-none"
                      />
                    </div>
                  </div>
                  <Link
                    to="/bookings"
                    className="mt-6 block w-full rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary/80"
                  >
                    View booking process
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-900/60 p-6 text-white backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary">Refined view</p>
                <h2 className="text-2xl font-bold">Select, confirm, activate</h2>
              </div>
              <div className="space-y-1 text-sm text-white/80">
                {processSteps.map((step) => (
                  <p key={step} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{step}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="venues" className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Signature venues</p>
            <h2 className="text-3xl font-bold text-white">Discover the perfect hall for every occasion</h2>
            <p className="text-white/70">
              Each hall includes dedicated parking, standby generator coverage, and a waiting room for the bridal party.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {hallCatalog.map((hall) => (
              <Link
                to="/bookings"
                key={hall.id}
                className="group space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div
                  className="h-44 rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${hallImages[hall.id]})` }}
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary">{hall.alias}</p>
                  <h3 className="text-2xl font-semibold text-white">{hall.name}</h3>
                  <p className="text-sm text-white/80">{hall.description}</p>
                  <p className="text-sm text-white/60">Capacity: {hall.capacity}</p>
                </div>
                <div className="space-y-3">
                  {hall.rates.map((rate) => (
                    <div key={rate.label} className="flex items-center justify-between text-sm text-white/80">
                      <span>{rate.label}</span>
                      <span className="font-semibold text-white">{formatTZS(rate.price)}</span>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <HighlightCard
              title="Availability"
              description="Calendar locks after manager approval."
              value="No double bookings"
            />
            <HighlightCard
              title="Payments"
              description="Cashier 1 records receipts, Cashier 2 controls cash movements."
              value="Complete audit trail"
            />
            <HighlightCard
              title="Services"
              description="Food, drinks, decoration and rentals are configured per event."
              value="Custom packages"
            />
          </div>
        </section>

        <section id="taratibu" className="mx-auto max-w-6xl space-y-8 px-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Taratibu za ukumbi</p>
            <h2 className="text-3xl font-bold text-white">We operate with discipline and transparency</h2>
            <p className="text-white/70">
              Follow these rules to secure your booking and enjoy seamless service from the Kuringe team.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {taratibuChecklist.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="muhimu" className="mx-auto max-w-6xl space-y-6 px-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Muhimu</p>
            <h2 className="text-3xl font-bold text-white">Important commitments</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {muhimuNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                <p className="text-white/90">{note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-primary/60 bg-primary/10 p-6 text-sm text-white/90">
            <p className="font-semibold">Mimi ........................ Nimesoma na kukubaliana na miongozo yote hapo juu na nitafuata yote.</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.4em] text-white/60">
              <span>Saini</span>
              <span>Tarehe</span>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Services & Pricing</p>
            <h2 className="text-3xl font-bold text-white">Solutions for every event need</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {decorationPackages.map((pkg) => (
              <div key={pkg.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/90">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">{pkg.title}</h3>
                  <span className="text-xs uppercase tracking-[0.4em] text-white/60">Decor</span>
                </div>
                <p className="mt-2 text-white/70">Highlights</p>
                <ul className="mt-3 space-y-2 text-white/80">
                  {pkg.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs uppercase tracking-[0.4em] text-white/60">{formatTZS(pkg.price)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-6 px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.4em] text-primary">Beverage list</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {beverageList.map((drink) => (
                  <li key={drink.name} className="flex items-center justify-between">
                    <span>{drink.name}</span>
                    <span className="font-semibold text-white">{formatTZS(drink.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/70">
                Kila bei inalipa VAT 18%. Cocktails zinahitaji gharama ya kuingia TZS 150,000.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.4em] text-primary">Rental & Extra</p>
              <p className="mt-3 text-sm text-white/80">
                Kukodisha magari, decorations, event rental services, out-catering, beverage service na maeneo ya mikutano.
              </p>
              <p className="mt-3 text-sm text-white/80">Kufanya utoaji wa huduma hizi kunawekwa na meneja.</p>
            </div>
          </div>
          <section aria-label="Management quick links" className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.4em] text-primary">Management system</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {managementTiles.map((tile) => (
                <Link
                  key={tile.title}
                  to={tile.path}
                  className="group relative rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div
                    className="absolute inset-0 rounded-3xl bg-cover bg-center opacity-30 transition duration-300 group-hover:opacity-60"
                    style={{ backgroundImage: `url(${tile.image})` }}
                  />
                  <div className="relative space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">Refined view</p>
                    <p className="text-lg font-semibold text-white">{tile.title}</p>
                    <p className="text-xs text-white/80">{tile.description}</p>
                    <span className="text-xs font-semibold tracking-[0.2em] text-primary">
                      View refined experience →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section id="packages" className="mx-auto max-w-6xl space-y-6 px-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Conference packages</p>
            <h2 className="text-3xl font-bold text-white">Setup, meals, and tech support</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {conferencePackages.map((pkg) => (
              <div key={pkg.attendees} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                <h3 className="text-xl font-semibold text-white">{pkg.attendees}</h3>
                <p className="text-white/60">{pkg.pricePoint}</p>
                <ul className="mt-4 space-y-2">
                  {pkg.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-4 px-6">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-primary">Need help?</p>
            <h2 className="text-3xl font-bold text-white">Call +255 717 000 000 or email bookings@kuringehalls.co.tz</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            <p>Payments accepted via cash, cheque, bank transfer, or mobile money.</p>
            <p>Two-cashier model, approval guardrails, and audit-ready receipts keep you compliant.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
