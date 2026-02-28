import { Link } from 'react-router-dom';
import { Check, Cuboid, Crown, Diamond, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages } from '@/lib/landingData';
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
  return Icon;
};

const Packages = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Cuboid className="w-10 h-10 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Vifurushi vya Mapambo' : 'Decoration Packages'}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {isSw ? 'Badilisha Muonekano wa Ukumbi Wako' : 'Transform Your Venue'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {isSw
              ? 'Chagua kifurushi sahihi cha mapambo ili kuunda mandhari bora kwa siku yako maalum. Kuanzia Standard hadi Royal.'
              : 'Choose from our curated decoration packages to create the perfect ambiance for your special day. From Standard to Royal.'}
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {decorationPackages.map((pkg, index) => {
              const Icon = getPackageIcon(index);
              const style = getDecorationPackageVisual(index);
              const isFeatured = style.featured;
              
              return (
                <div 
                  key={pkg.title}
                  className={`relative rounded-3xl overflow-hidden border transition-all duration-300 ${
                    isFeatured 
                      ? `${style.cardClass} xl:-translate-y-3 scale-[1.02]`
                      : `${style.cardClass} hover:-translate-y-2 hover:shadow-xl`
                  }`}
                >
                  {/* Gradient Header */}
                  <div className={`h-32 flex items-center justify-center relative ${style.badgeClass}`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${style.iconWrapClass}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    {isFeatured && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-yellow-500 text-amber-950 text-xs font-semibold">
                        {style.featuredLabel}
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${style.badgeClass} inline-flex rounded-full px-2.5 py-1`}>
                      {style.tier}
                    </p>
                    <h3 className="text-xl font-bold mb-1">
                      {getDecorationPackageName(pkg.title)}
                    </h3>
                    <p className="text-sm mb-4 opacity-75">
                      {pkg.title.includes(' - ') ? pkg.title.split(' - ')[1].trim() : 'Complete Setup'}
                    </p>
                    
                    <p className="text-3xl font-bold mb-6">
                      {formatTZS(pkg.price)}
                    </p>

                    <ul className="space-y-3 mb-6">
                      {pkg.highlights.map((highlight) => (
                        <li 
                          key={highlight} 
                          className="flex items-start gap-3 text-sm opacity-85"
                        >
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.checkClass}`} />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to={`/booking?package=${encodeURIComponent(getDecorationPackageName(pkg.title))}`}>
                      <Button className={`w-full py-6 text-lg ${style.buttonClass}`}>
                        {isSw ? 'Chagua Kifurushi' : 'Select Package'}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isSw ? 'Yaliyomo Kila Kifurushi' : "What's Always Included"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isSw
                ? 'Kila kifurushi kinajumuisha vipengele hivi vya msingi kuhakikisha tukio lako linaenda vizuri.'
                : 'Every package comes with these standard features to ensure your event runs smoothly.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: isSw ? 'Ufungaji na Uondoaji' : 'Setup & Teardown',
                desc: isSw ? 'Ufungaji na uondoaji kamili' : 'Complete installation and removal',
              },
              {
                title: isSw ? 'Mratibu Maalum' : 'Dedicated Coordinator',
                desc: isSw ? 'Msimamizi binafsi wa tukio' : 'Personal event manager',
              },
              {
                title: isSw ? 'Vifaa Bora' : 'Quality Materials',
                desc: isSw ? 'Mapambo na vitambaa vya ubora wa juu' : 'Premium decorations and fabrics',
              },
              {
                title: isSw ? 'Muda Unaobadilika' : 'Flexible Timing',
                desc: isSw ? 'Ratiba inayolingana na muda wako' : 'Work around your schedule',
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 rounded-2xl bg-white border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Package CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isSw ? 'Unahitaji Kifurushi Maalum?' : 'Need Something Special?'}
          </h2>
          <p className="text-lg text-background/70 mb-8">
            {isSw
              ? 'Tunaweza kutengeneza kifurushi maalum cha mapambo kulingana na maono na bajeti yako. Wasiliana nasi kujadili mahitaji yako.'
              : 'We can create custom decoration packages tailored to your unique vision and budget. Contact us to discuss your requirements.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-background/30 text-black hover:bg-background/10 px-8 py-6 text-lg">
                {isSw ? 'Tazama Bei Zote' : 'View All Pricing'}
              </Button>
            </Link>
            <Link to="/booking">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
                {isSw ? 'Omba Bei Maalum' : 'Request Custom Quote'}
              </Button>
            </Link>
          </div>
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

export default Packages;

