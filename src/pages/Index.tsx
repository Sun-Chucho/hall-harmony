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

const HighlightCard = ({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) => (
  <div className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
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
        <section className="relative isolate">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="h-full w-full bg-gradient-to-b from-slate-900/90 to-slate-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.5em] text-primary">KURINGE HALLS</p>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
                  World-class spaces for weddings, conferences, and celebrations across Dar es Salaam.
                </h1>
                <p className="text-lg text-white/70">
                  Witness Hall, Kilimanjaro Hall &amp; Gardens, and Hall D are curated for unforgettable moments.
                  Book online, lock your schedule, and let the operations team handle the rest.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:-translate-y-0.5"
                  >
                    Start booking
                  </Link>
                  <a
                    href="#venues"
                    className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
                  >
                    Explore venues
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-white/30 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.4em] text-primary">Check availability</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <label className="text-xs uppercase tracking-[0.4em] text-white/70">Event type</label>
                    <select className="mt-2 w-full bg-transparent text-white outline-none">
                      <option>Wedding</option>
                      <option>Conference</option>
                      <option>Birthday</option>
                      <option>Meeting</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <label className="text-xs uppercase tracking-[0.4em] text-white/70">Location</label>
                    <select className="mt-2 w-full bg-transparent text-white outline-none">
                      <option>Kuringe Halls</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <label className="text-xs uppercase tracking-[0.4em] text-white/70">Select date</label>
                    <input
                      type="date"
                      className="mt-2 w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </div>
                <button className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                  Search availability
                </button>
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
              <div key={hall.id} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
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
              </div>
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
            <p className="font-semibold">Mimi ……………………….. Nimesoma na kukubaliana na miongozo yote hapo juu na nitafuata yote.</p>
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
