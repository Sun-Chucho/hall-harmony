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

const categorized = [
  {
    key: 'beer',
    titleEn: 'Beers and Ciders',
    titleSw: 'Bia na Cider',
    items: beverageList.filter((x) => /(Beer|Flying Fish|Kilimanjaro Lite|Savanna|Bavaria|Baltika|Malta)/i.test(x.name)),
  },
  {
    key: 'soft',
    titleEn: 'Soft Drinks',
    titleSw: 'Vinywaji Baridi',
    items: beverageList.filter((x) => /(Soda)/i.test(x.name)),
  },
  {
    key: 'juice',
    titleEn: 'Juices',
    titleSw: 'Juisi',
    items: beverageList.filter((x) => /(Juice|Azam|Ceres)/i.test(x.name)),
  },
  {
    key: 'water',
    titleEn: 'Water',
    titleSw: 'Maji',
    items: beverageList.filter((x) => /(Maji|Water)/i.test(x.name)),
  },
  {
    key: 'premium',
    titleEn: 'Premium and Bottle Service',
    titleSw: 'Huduma ya Premium na Chupa',
    items: beverageList.filter((x) => /(Konyagi|Wine)/i.test(x.name)),
  },
];

const localizeDrinkName = (name: string, isSw: boolean) => {
  if (!isSw) return name;

  const map: Record<string, string> = {
    'Local Beer': 'Bia za Ndani',
    'Imported Beer': 'Bia za Nje',
    Soda: 'Soda',
    'Azam Juice': 'Juisi ya Azam',
    'Ceres Juice': 'Juisi ya Ceres',
    'Maji Kili 1/2 LT (0.5 LT)': 'Maji Kili 1/2 LT (0.5 LT)',
    'Wine (5 LTRS)': 'Wine (Lita 5)',
    'Konyagi & K Vant': 'Konyagi na K Vant',
  };
  return map[name] ?? name;
};

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
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0d1321_0%,#1d3557_48%,#9f7a36_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_26%),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:auto,28px_28px,28px_28px]" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/80">{isSw ? 'Kundi la Vinywaji' : 'Drink Category'}</p>
                <h2 className="mt-2 text-2xl font-semibold">{isSw ? category.titleSw : category.titleEn}</h2>
              </div>
            </article>
            <article className="border border-black/10 bg-white p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((drink) => (
                  <div
                    key={drink.name}
                    className="flex h-14 items-center justify-between border border-black/10 bg-[#faf9f6] px-4 text-sm"
                  >
                    <span>{localizeDrinkName(drink.name, isSw)}</span>
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
