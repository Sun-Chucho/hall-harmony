import { Link, useNavigate, useParams } from 'react-router-dom';
import { HallCatalogEntry, hallCatalog } from '@/lib/landingData';

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
};

const AmenityBadge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
    {label}
  </span>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const Hall = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const hall = hallCatalog.find((entry) => entry.id === hallId);

  if (!hall) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Hall not found</p>
          <h1 className="mt-4 text-3xl font-bold">We could not locate this hall.</h1>
          <p className="mt-3 text-white/70">Please return to the venues gallery to continue exploring.</p>
          <button
            onClick={() => navigate('/venues')}
            className="mt-8 rounded-full border border-white/30 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white"
          >
            Back to venues
          </button>
        </div>
      </div>
    );
  }

  const amenities = [
    'Dedicated Parking',
    'Standby Generator',
    'Premium Sound System',
    'Air Conditioning',
    'Bridal Waiting Room',
    'Professional Lighting',
  ];

  const heroImage = hallImages[hall.id];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate">
        <div
          className="h-72 w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.2), rgba(2, 6, 23, 0.9)), url('${heroImage}')`,
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col gap-3 text-white">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
                <button
                  onClick={() => navigate('/venues')}
                  className="rounded-full border border-white/30 px-3 py-1 text-white/70 transition hover:border-white hover:text-white"
                >
                  ← Venues
                </button>
                <span>{hall.alias}</span>
              </div>
              <h1 className="text-4xl font-bold">{hall.name}</h1>
              <p className="text-sm text-white/70 max-w-3xl">{hall.description}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="space-y-12 px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-wrap gap-3">
            {amenities.map((label) => (
              <AmenityBadge key={label} label={label} />
            ))}
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Capacity</p>
              <p className="mt-2 text-2xl font-semibold">{hall.capacity}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Starting rate</p>
              <p className="mt-2 text-2xl font-semibold text-red-400">
                {formatCurrency(Math.min(...hall.rates.map((rate) => rate.price)))}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Services</p>
              <p className="mt-2 text-lg font-semibold">Bespoke staffing & décor</p>
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">{hall.alias}</p>
            <h2 className="text-3xl font-bold">{hall.name} highlights</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {hall.rates.map((rate) => (
              <div key={rate.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{rate.label}</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(rate.price)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <p className="text-sm">
              Partner with our planners to configure the décor, lighting, and culinary menu tailored for {hall.name}.
              The glassy studio previews will mirror every detail before the event day.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/bookings"
              className="rounded-full bg-red-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:bg-red-400"
            >
              Book {hall.alias}
            </Link>
            <Link
              to="/foods"
              className="rounded-full border border-white/30 px-6 py-3 text-xs uppercase tracking-[0.4em] text-white/80 transition hover:border-white"
            >
              View culinary menu
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Hall;
