import { Check, Star, Crown, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages } from '@/lib/landingData';

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

const getPackageStyle = (index: number) => {
  if (index === 2) {
    // Executive - Featured
    return {
      card: 'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white border-blue-800 scale-105 shadow-2xl shadow-blue-900/40',
      badge: 'bg-gradient-to-r from-primary to-red-500',
      button: 'bg-white text-blue-900 hover:bg-white/90',
    };
  }
  return {
    card: 'bg-white border-blue-100',
    badge: 'bg-blue-900',
    button: 'bg-blue-900 text-white hover:bg-blue-800',
  };
};

const PackagesSection = () => {
  const displayPackages = decorationPackages.slice(0, 4); // Show first 4

  return (
    <section id="packages" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Decoration Packages
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            Transform Your Venue
          </h2>
          <p className="text-lg text-blue-900/60">
            Choose from our curated decoration packages to create the perfect ambiance 
            for your special day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {displayPackages.map((pkg, index) => {
            const style = getPackageStyle(index);
            const isFeatured = index === 2;

            return (
              <div 
                key={pkg.title}
                className={`relative rounded-3xl border p-6 transition-all duration-300 ${style.card} ${
                  !isFeatured ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10' : ''
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-red-500 text-white text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${style.badge}`}>
                  {getPackageIcon(index)}
                </div>

                <h3 className={`text-lg font-bold mb-2 ${isFeatured ? 'text-white' : 'text-blue-950'}`}>
                  {pkg.title.split('–')[0].trim()}
                </h3>
                
                <p className={`text-3xl font-bold mb-4 ${isFeatured ? 'text-white' : 'text-blue-950'}`}>
                  {formatTZS(pkg.price)}
                </p>

                <ul className="space-y-3 mb-6">
                  {pkg.highlights.slice(0, 4).map((highlight) => (
                    <li 
                      key={highlight} 
                      className={`flex items-start gap-2 text-sm ${isFeatured ? 'text-white/80' : 'text-blue-900/70'}`}
                    >
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isFeatured ? 'text-primary' : 'text-green-600'}`} />
                      <span className="line-clamp-2">{highlight}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full rounded-xl py-5 font-semibold ${style.button}`}>
                  Select Package
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-blue-900/60">
            Need something more exclusive? Check out our{' '}
            <button className="text-primary font-semibold hover:underline">
              VVIP & Royal packages
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
