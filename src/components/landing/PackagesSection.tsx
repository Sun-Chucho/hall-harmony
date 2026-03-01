import { Check, Star, Crown, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages } from '@/lib/landingData';
import { getDecorationPackageName, getDecorationPackageVisual } from '@/lib/packageStyles';
import { useLanguage } from '@/contexts/LanguageContext';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getPackageIcon = (index: number) => {
  const icons = [Star, Star, Crown, Diamond, Crown];
  const Icon = icons[index] || Star;
  return <Icon className="w-5 h-5" />;
};

const toSwTier = (tier: string) => {
  if (tier === 'Bronze Plan') return 'Mpango wa Bronze';
  if (tier === 'Silver Plan') return 'Mpango wa Silver';
  if (tier === 'Gold Plan') return 'Mpango wa Gold';
  if (tier === 'Platinum Plan') return 'Mpango wa Platinum';
  if (tier === 'Royal Plan') return 'Mpango wa Royal';
  return tier;
};

const toSwHighlight = (highlight: string) => {
  const map: Record<string, string> = {
    'Stage decoration': 'Mapambo ya stage',
    'Photobooth banner 3 metre': 'Banner ya photobooth mita 3',
    'Welcome note board': 'Bodi ya ujumbe wa ukaribisho',
    'Fire walks 2': 'Fire walks 2',
    'Entrance decor': 'Mapambo ya kuingilia',
    'Flowers (artificial and natural)': 'Maua (ya asili na ya kutengeneza)',
    'Dancing floor sticker + printed names': 'Sticker ya dancing floor na majina yaliyochapishwa',
    'Light (fairy lights)': 'Taa (fairy lights)',
    'Table cover': 'Vitambaa vya meza',
    'Charger plate @table': 'Charger plate kwa meza',
    'Napkin 10 @table': 'Napkin 10 kwa meza',
    'Charger plate 10 @table': 'Charger plate 10 kwa meza',
    'LED on stage': 'LED kwenye stage',
    'Laser machine on first dance': 'Laser machine wakati wa first dance',
    'A lot of flowers': 'Maua mengi',
    'Themes setup whole hall': 'Themes setup ukumbi mzima',
    'Laser machine': 'Laser machine',
  };
  return map[highlight] ?? highlight;
};

const PackagesSection = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <section id="packages" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Vifurushi vya Mapambo' : 'Decoration Packages'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            {isSw ? 'Badili Muonekano wa Ukumbi Wako' : 'Transform Your Venue'}
          </h2>
          <p className="text-lg text-blue-900/60">
            {isSw
              ? 'Chagua kifurushi cha mapambo kinachokufaa ili kupata mwonekano bora wa tukio lako.'
              : 'Choose from our curated decoration packages to create the perfect ambiance for your special day.'}
          </p>
        </div>

        <div className="grid gap-6 items-start md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {decorationPackages.map((pkg, index) => {
            const style = getDecorationPackageVisual(index);
            const isFeatured = style.featured;

            return (
              <div
                key={pkg.title}
                className={`relative rounded-3xl border p-6 transition-all duration-300 ${style.cardClass} ${
                  isFeatured
                    ? 'xl:-translate-y-3 scale-[1.02]'
                    : 'hover:-translate-y-1 hover:shadow-xl'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-yellow-500 text-amber-950 text-xs font-semibold">
                    {isSw ? 'Gold Pendwa' : style.featuredLabel}
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${style.iconWrapClass}`}>
                  {getPackageIcon(index)}
                </div>

                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${style.badgeClass} inline-flex rounded-full px-2.5 py-1`}>
                  {isSw ? toSwTier(style.tier) : style.tier}
                </p>

                <h3 className="text-lg font-bold mb-2">
                  {getDecorationPackageName(pkg.title)}
                </h3>

                <p className="text-3xl font-bold mb-4">
                  {formatTZS(pkg.price)}
                </p>

                <ul className="space-y-3 mb-6">
                  {pkg.highlights.slice(0, 4).map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm opacity-85"
                    >
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.checkClass}`} />
                      <span className="line-clamp-2">{isSw ? toSwHighlight(highlight) : highlight}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full rounded-xl py-5 font-semibold ${style.buttonClass}`}>
                  {isSw ? 'Chagua Kifurushi' : 'Select Package'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-blue-900/60">
            {isSw ? 'Unahitaji kitu cha kipekee zaidi? Tazama ' : 'Need something more exclusive? Check out our '}
            <button className="text-primary font-semibold hover:underline">
              {isSw ? 'vifurushi vya VVIP & Royal' : 'VVIP & Royal packages'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
