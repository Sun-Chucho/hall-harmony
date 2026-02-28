import { Link } from 'react-router-dom';
import { Check, Sparkles, Crown, Diamond, Cuboid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages, beverageList, conferencePackages } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';
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
  const icons = [Cuboid, Cuboid, Crown, Diamond, Crown, Sparkles];
  const Icon = icons[index] || Cuboid;
  return <Icon className="w-6 h-6" />;
};

const Pricing = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Bei Wazi' : 'Transparent Pricing'}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Huduma na Bei' : 'Services & Pricing'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {isSw
              ? 'Orodha kamili ya bei za huduma zetu. Chagua vifurushi vya mapambo, vinywaji, vifurushi vya mikutano, na zaidi.'
              : 'Comprehensive pricing for all our services. Choose from decoration packages, beverages, conference setups, and more.'}
          </p>
        </div>
      </section>

      {/* Decoration Packages */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              {isSw ? 'Badilisha Muonekano wa Ukumbi' : 'Transform Your Venue'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isSw ? 'Vifurushi vya Mapambo' : 'Decoration Packages'}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {decorationPackages.map((pkg, index) => {
              const style = getDecorationPackageVisual(index);
              const isFeatured = style.featured;
              
              return (
                <div 
                  key={pkg.title}
                  className={`relative rounded-3xl border p-6 transition-all duration-300 ${
                    isFeatured 
                      ? `${style.cardClass} xl:-translate-y-3 scale-[1.02]`
                      : `${style.cardClass} hover:-translate-y-1 hover:shadow-xl`
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-yellow-500 text-amber-950 text-xs font-semibold">
                      {style.featuredLabel}
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${style.iconWrapClass}`}>
                    <div>
                      {getPackageIcon(index)}
                    </div>
                  </div>

                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${style.badgeClass} inline-flex rounded-full px-2.5 py-1`}>
                    {style.tier}
                  </p>

                  <h3 className="text-xl font-bold mb-2">
                    {getDecorationPackageName(pkg.title)}
                  </h3>
                  
                  <p className="text-3xl font-bold mb-4">
                    {formatTZS(pkg.price)}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {pkg.highlights.map((highlight) => (
                      <li 
                        key={highlight} 
                        className="flex items-start gap-2 text-sm opacity-85"
                      >
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.checkClass}`} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={`/booking?package=${encodeURIComponent(getDecorationPackageName(pkg.title))}`}>
                    <Button className={`w-full py-5 ${style.buttonClass}`}>
                      {isSw ? 'Chagua Kifurushi' : 'Select Package'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Beverage List */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              {isSw ? 'Viburudisho' : 'Refreshments'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isSw ? 'Menyu ya Vinywaji' : 'Beverage Menu'}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-lg">
            <div className="space-y-4">
              {beverageList.map((drink) => (
                <div 
                  key={drink.name}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <span className="text-foreground font-medium">{drink.name}</span>
                  <span className="text-xl font-bold text-foreground">{formatTZS(drink.price)}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground text-center">
              {isSw
                ? 'Bei zote zinajumuisha VAT ya 18%. Huduma ya cocktail ina gharama ya ziada ya maandalizi ya TZS 150,000.'
                : 'All prices include 18% VAT. Cocktail service requires an additional setup fee of TZS 150,000.'}
            </p>
          </div>
        </div>
      </section>

      {/* Conference Packages */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              {isSw ? 'Matukio ya Kampuni' : 'Corporate Events'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isSw ? 'Vifurushi vya Mikutano' : 'Conference Packages'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conferencePackages.map((pkg, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl border border-border p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <h3 className="text-xl font-bold text-foreground mb-2">{pkg.attendees}</h3>
                <p className="text-lg font-semibold text-primary mb-4">{pkg.pricePoint}</p>
                <ul className="space-y-2">
                  {pkg.amenities.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isSw ? 'Unahitaji Kifurushi Maalum?' : 'Need a Custom Package?'}
          </h2>
          <p className="text-lg text-background/70 mb-8">
            {isSw
              ? 'Wasiliana nasi kwa suluhisho maalum yanayolingana na mahitaji na bajeti yako.'
              : 'Contact us for tailored solutions that match your specific requirements and budget.'}
          </p>
          <Link to="/booking">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
              {isSw ? 'Pata Bei Maalum' : 'Get Custom Quote'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 text-center text-muted-foreground">
          <p>{isSw ? '\u00A9 2024 Kuringe Halls. Haki zote zimehifadhiwa.' : '\u00A9 2024 Kuringe Halls. All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

