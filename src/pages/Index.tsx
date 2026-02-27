import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hallCatalog } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2200&q=80',
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
  story: 'https://images.unsplash.com/photo-1519164781019-7f687b7c6f8d?auto=format&fit=crop&w=2200&q=80',
  suite: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2200&q=80',
};

const STORY_CARDS = [
  {
    title: 'Nymphenburg Porcelain Style Setup',
    note: 'Elegant table styling and layered textures for premium receptions.',
    tag: 'Feature Story',
  },
  {
    title: 'Hall A Signature Wedding',
    note: 'A 600-guest celebration built around custom lighting and stage reveals.',
    tag: 'Event Journal',
  },
  {
    title: 'Boardroom to Banquet in Hall D',
    note: 'Flexible transitions for intimate meetings and evening dinners.',
    tag: 'Planning Guide',
  },
];

const PACKAGES = [
  { name: 'Standard', price: 2000000, summary: 'Elegant essentials for intimate events.' },
  { name: 'VIP', price: 5000000, summary: 'Premium decor and upgraded visual moments.' },
  { name: 'Executive', price: 8000000, summary: 'High-impact production for flagship weddings.' },
];

const BENEFITS = ['Instant Booking', 'Discovery Tours', 'Live Local Support'];

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function Index() {
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

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#161616]">
      <PublicNavbar ctaLabel="Book Your Date" />

      <section className="relative isolate h-[82vh] min-h-[560px] overflow-hidden px-4">
        <img src={IMAGES.hero} alt="Kuringe wedding arrival" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto flex h-full max-w-7xl items-center justify-center text-center">
          <div className="max-w-3xl text-white reveal-on-scroll">
            <p className="text-xs uppercase tracking-[0.42em] text-white/75">Kuringe Halls, Moshi</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">Crafted Spaces for Weddings, Conferences, and Milestone Events</h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm text-white/85 md:text-base">
              Keep your event elegant from first arrival to final toast with coordinated halls, decor, and service planning.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/booking">
                <Button className="rounded-full bg-[#C6A75E] px-7 text-[#121212] hover:bg-[#d4b56b]">Reserve A Date</Button>
              </Link>
              <a href="#destinations">
                <Button variant="outline" className="rounded-full border-white/45 bg-white/10 px-7 text-white hover:bg-white/20">
                  Explore Destinations
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20">
        <section id="destinations" className="reveal-on-scroll py-20">
          <div className="text-center">
            <h2 className="text-4xl font-semibold md:text-5xl">Destinations</h2>
            <p className="mt-3 text-sm text-[#6f6f6f]">Select the right atmosphere for your guest count and event mood.</p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {hallCatalog.map((hall) => (
              <article key={hall.id} className="group relative h-[380px] overflow-hidden border border-black/10 bg-black">
                <img
                  src={IMAGES[hall.id as keyof typeof IMAGES]}
                  alt={hall.name}
                  className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">{hall.capacity}</p>
                  <h3 className="mt-2 text-2xl">{hall.name}</h3>
                  <p className="mt-2 text-sm text-white/80">{hall.description}</p>
                </div>
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
            <img src={IMAGES.story} alt="Spotlight wedding setup" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative flex min-h-[420px] items-center p-8 md:p-14">
              <div className="max-w-xl text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">Featured Experience</p>
                <h3 className="mt-4 text-3xl leading-tight md:text-4xl">A Palace Feeling for Your Guests</h3>
                <p className="mt-4 text-sm text-white/85 md:text-base">
                  Combine premium decor tiers, staging, and tailored flow plans to deliver a seamless event story from welcome to finale.
                </p>
                <Link to="/packages" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#E6CB8E]">
                  Discover Setup <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className="reveal-on-scroll py-8">
          <h2 className="text-4xl font-semibold">Our Stories</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-12">
            {STORY_CARDS.map((card, index) => (
              <article
                key={card.title}
                className={`border border-black/10 p-5 ${index === 0 ? 'md:col-span-5 md:min-h-[280px]' : 'md:col-span-3'} ${index === 1 ? 'md:translate-y-6' : ''}`}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a8a8a]">{card.tag}</p>
                <h3 className="mt-4 text-xl leading-snug">{card.title}</h3>
                <p className="mt-3 text-sm text-[#5a5a5a]">{card.note}</p>
              </article>
            ))}
            <Link to="/packages" className="md:col-span-12 mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
              See more stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="reveal-on-scroll py-14">
          <article className="relative overflow-hidden bg-[#A7A7A7] px-6 py-20 text-center text-white md:px-12">
            <img src={IMAGES.suite} alt="Premium suite styling" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-4xl font-semibold md:text-5xl">Sensational Suites</h2>
              <p className="mt-4 text-sm text-white/85 md:text-base">Choose package levels based on event scale, production needs, and guest impact.</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/packages">
                  <Button className="rounded-full bg-white px-6 text-[#111111] hover:bg-white/90">View Packages</Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/15">
                    Compare Pricing
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
          <article className="bg-[#949494] px-6 py-14 text-center text-white md:px-12">
            <div className="grid gap-5 md:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="border border-white/25 px-4 py-8 text-xl">
                  {benefit}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="reveal-on-scroll py-14">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <article>
              <h3 className="text-3xl font-semibold">Plan With Kuringe</h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#545454]">
                Work with our team to align hall choice, decor package, food flow, and guest movement in one clear booking path.
                Whether you host 50 or 700 guests, we keep setup quality consistent.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/booking">
                  <Button className="rounded-full bg-[#121212] px-7 text-white hover:bg-[#272727]">Start Booking</Button>
                </Link>
                <Link to="/taratibu">
                  <Button variant="outline" className="rounded-full border-black/20 px-7">Read Policies</Button>
                </Link>
              </div>
            </article>

            <article className="border border-black/10 bg-white p-6">
              <h4 className="text-lg font-semibold">Top Decoration Packages</h4>
              <ul className="mt-5 space-y-4">
                {PACKAGES.map((pkg) => (
                  <li key={pkg.name} className="border-b border-black/10 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-sm uppercase tracking-[0.16em] text-[#787878]">{pkg.name}</p>
                    <p className="mt-1 text-xl font-semibold">{formatTZS(pkg.price)}</p>
                    <p className="mt-2 text-sm text-[#5d5d5d]">{pkg.summary}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="reveal-on-scroll py-8">
          <div className="border-t border-black/15 pt-8">
            <p className="text-center text-2xl">kuringe halls</p>
            <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-[#7a7a7a]">A venue for your defining celebrations</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#070d22] px-4 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold">Kuringe Halls</p>
            <p className="mt-2 text-sm text-white/70">Luxury Wedding and Event Venue</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/90">
              <Phone className="h-4 w-4 text-[#C6A75E]" /> +255 717 000 000
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Explore</p>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li><Link to="/packages">Packages</Link></li>
              <li><Link to="/pricing">Catering and Drinks</Link></li>
              <li><Link to="/taratibu">Policies</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Guest Favorite</p>
            <div className="mt-4 rounded border border-white/20 p-4">
              <p className="text-sm font-medium">Witness Hall Premium</p>
              <div className="mt-2 flex items-center gap-1 text-[#C6A75E]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-xs text-white/70">Large scale setup with chandelier finish and full stage flexibility.</p>
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Quick Contact</p>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> bookings@kuringehalls.co.tz
              </li>
              <li className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#C6A75E]" /> Kuringe Complex, Moshi
              </li>
              <li>
                <Link to="/booking" className="inline-flex items-center gap-2 font-medium text-[#E6CB8E]">
                  Reserve now <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
