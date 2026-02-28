import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { foodMenus } from '@/lib/destinationProfiles';

export default function Foods() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">{isSw ? 'Upishi' : 'Catering'}</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Culinary Direction ya Kiwango cha Juu' : 'World-Class Culinary Direction'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            {isSw
              ? 'Menyu zimepangwa ili ziwe rahisi kwa harusi, gala dinner, conference, na matukio ya taasisi. Kila menu inaweza kubadilishwa kulingana na idadi ya wageni na mtiririko wa tukio.'
              : 'Menus are structured for weddings, gala dinners, conferences, and institutional events. Every menu can be tuned to guest volume and service pacing.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 space-y-10">
        <section className="grid gap-8 lg:grid-cols-2">
          <article className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isSw ? 'Msimamo wa Jikoni' : 'Kitchen Standard'}</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {isSw ? 'Ladha, Mwonekano, na Muda wa Huduma' : 'Flavor, Presentation, and Service Timing'}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {isSw
                ? 'Timu ya jikoni inaendesha mfumo wa prep-to-service unaolenga ubora wa ladha, usafi wa uwasilishaji, na utoaji wa chakula kwa muda stahiki.'
                : 'Our kitchen runs a prep-to-service system focused on flavor quality, clean presentation, and precise plate timing across all event formats.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/booking">
                <Button className="rounded-none bg-black text-white hover:bg-black/90">
                  {isSw ? 'Panga Tasting' : 'Schedule Tasting'}
                </Button>
              </Link>
              <Link to="/drinks">
                <Button variant="outline" className="rounded-none border-black/20">
                  {isSw ? 'Linganishа na Vinywaji' : 'Pair with Drinks'}
                </Button>
              </Link>
            </div>
          </article>
          <article className="relative overflow-hidden border border-black/10 min-h-[320px]">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80"
              alt="Catering service"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-white/80">{isSw ? 'Catering Program' : 'Catering Program'}</p>
              <p className="mt-2 text-2xl font-semibold">{isSw ? 'Kutoka Starter hadi Buffet, yote yameratibiwa' : 'From Starter to Buffet, fully coordinated'}</p>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {foodMenus.map((menu) => (
            <article key={menu.title} className="border border-black/10 bg-white p-6">
              <h3 className="text-2xl font-semibold">{menu.title}</h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Starter</p>
                  <ul className="mt-2 space-y-1 text-sm leading-7">
                    {menu.starter.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Buffet</p>
                  <ul className="mt-2 space-y-1 text-sm leading-7">
                    {menu.buffet.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
