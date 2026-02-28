import PublicNavbar from '@/components/landing/PublicNavbar';
import { beverageList, beverageNotes } from '@/lib/landingData';
import { useLanguage } from '@/contexts/LanguageContext';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const categoryImages: Record<string, string> = {
  beer: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80',
  soft: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1600&q=80',
  juice: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=1600&q=80',
  water: 'https://images.unsplash.com/photo-1560847468-5eef330f455a?auto=format&fit=crop&w=1600&q=80',
  premium: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1600&q=80',
};

const categorized = [
  {
    key: 'beer',
    title: 'Beers and Ciders',
    items: beverageList.filter((x) => /(Beer|Flying Fish|Kilimanjaro Lite|Savanna|Bavaria|Baltika|Malta)/i.test(x.name)),
  },
  {
    key: 'soft',
    title: 'Soft Drinks',
    items: beverageList.filter((x) => /(Soda)/i.test(x.name)),
  },
  {
    key: 'juice',
    title: 'Juices',
    items: beverageList.filter((x) => /(Juice|Azam|Ceres)/i.test(x.name)),
  },
  {
    key: 'water',
    title: 'Water',
    items: beverageList.filter((x) => /(Maji|Water)/i.test(x.name)),
  },
  {
    key: 'premium',
    title: 'Premium and Bottle Service',
    items: beverageList.filter((x) => /(Konyagi|Wine)/i.test(x.name)),
  },
];

export default function Drinks() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">{isSw ? 'Vinywaji' : 'Drinks'}</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Menyu ya Vinywaji ya Kiwango cha Kimataifa' : 'World-Class Beverage Program'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            {isSw
              ? 'Vinywaji vyote ulivyotoa vimepangwa kwa makundi ili timu ya mauzo na wateja waone chaguo kwa urahisi.'
              : 'All beverages you provided are structured into premium categories for clearer selection, pricing control, and event flow planning.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 space-y-12">
        {categorized.map((category) => (
          <section key={category.key} className="grid gap-6 lg:grid-cols-[1fr_1.2fr] items-stretch">
            <article className="relative overflow-hidden border border-black/10 min-h-[260px]">
              <img src={categoryImages[category.key]} alt={category.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/80">{isSw ? 'Kundi la Vinywaji' : 'Drink Category'}</p>
                <h2 className="mt-2 text-2xl font-semibold">{category.title}</h2>
              </div>
            </article>
            <article className="border border-black/10 bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((drink) => (
                  <div key={drink.name} className="flex items-center justify-between border border-black/10 bg-[#faf9f6] px-4 py-3 text-sm">
                    <span>{drink.name}</span>
                    <span className="font-semibold">{formatTZS(drink.price)}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ))}

        <section className="border border-black/10 bg-[#faf9f6] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isSw ? 'Maelekezo Muhimu' : 'Important Beverage Notes'}</p>
          <ul className="mt-4 space-y-2 text-sm leading-7">
            {beverageNotes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
