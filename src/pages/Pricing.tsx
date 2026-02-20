import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Crown, Diamond, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decorationPackages, beverageList, conferencePackages } from '@/lib/landingData';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getPackageIcon = (index: number) => {
  const icons = [Star, Star, Crown, Diamond, Crown, Sparkles];
  const Icon = icons[index] || Star;
  return <Icon className="w-6 h-6" />;
};

const Pricing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <Link to="/" className="text-2xl font-bold text-foreground">
            Kuringe<span className="text-primary">Halls</span>
          </Link>
          <Link to="/#book-now">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Book Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Transparent Pricing
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Services & Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive pricing for all our services. Choose from decoration packages, 
            beverages, conference setups, and more.
          </p>
        </div>
      </section>

      {/* Decoration Packages */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              Transform Your Venue
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Decoration Packages
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decorationPackages.map((pkg, index) => {
              const isFeatured = index === 2;
              
              return (
                <div 
                  key={pkg.title}
                  className={`relative rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                    isFeatured 
                      ? 'bg-foreground text-background shadow-2xl scale-105' 
                      : 'bg-white border border-border shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    isFeatured ? 'bg-primary' : 'bg-foreground'
                  }`}>
                    <div className="text-background">
                      {getPackageIcon(index)}
                    </div>
                  </div>

                  <h3 className={`text-xl font-bold mb-2 ${isFeatured ? 'text-background' : 'text-foreground'}`}>
                    {pkg.title.split(' - ')[0].trim()}
                  </h3>
                  
                  <p className={`text-3xl font-bold mb-4 ${isFeatured ? 'text-background' : 'text-foreground'}`}>
                    {formatTZS(pkg.price)}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {pkg.highlights.map((highlight) => (
                      <li 
                        key={highlight} 
                        className={`flex items-start gap-2 text-sm ${isFeatured ? 'text-background/80' : 'text-muted-foreground'}`}
                      >
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isFeatured ? 'text-primary' : 'text-primary'}`} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/#book-now">
                    <Button className={`w-full py-5 ${
                      isFeatured 
                        ? 'bg-background text-foreground hover:bg-background/90' 
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}>
                      Select Package
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
              Refreshments
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Beverage Menu
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
              All prices include 18% VAT. Cocktail service requires an additional setup fee of TZS 150,000.
            </p>
          </div>
        </div>
      </section>

      {/* Conference Packages */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              Corporate Events
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Conference Packages
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
            Need a Custom Package?
          </h2>
          <p className="text-lg text-background/70 mb-8">
            Contact us for tailored solutions that match your specific requirements and budget.
          </p>
          <Link to="/#book-now">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
              Get Custom Quote
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 text-center text-muted-foreground">
          <p>&copy; 2024 Kuringe Halls. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

