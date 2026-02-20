import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Star, Crown, Diamond, Sparkles, Gift } from 'lucide-react';
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
  const icons = [Star, Star, Crown, Diamond, Crown, Sparkles];
  const Icon = icons[index] || Star;
  return Icon;
};

const getPackageColor = (index: number) => {
  const colors = [
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-red-500',
    'from-cyan-400 to-blue-500',
  ];
  return colors[index % colors.length];
};

const Packages = () => {
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
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Decoration Packages
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Transform Your Venue
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our curated decoration packages to create the perfect ambiance 
            for your special day. From Standard to Royal.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {decorationPackages.map((pkg, index) => {
              const Icon = getPackageIcon(index);
              const isFeatured = index === 2 || index === 3;
              
              return (
                <div 
                  key={pkg.title}
                  className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                    isFeatured 
                      ? 'bg-foreground text-background shadow-2xl ring-2 ring-primary' 
                      : 'bg-white border border-border shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Gradient Header */}
                  <div className={`h-32 bg-gradient-to-br ${getPackageColor(index)} flex items-center justify-center relative`}>
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {isFeatured && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white text-foreground text-xs font-semibold">
                        Popular
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-1 ${isFeatured ? 'text-background' : 'text-foreground'}`}>
                      {pkg.title.split(' - ')[0].trim()}
                    </h3>
                    <p className={`text-sm mb-4 ${isFeatured ? 'text-background/60' : 'text-muted-foreground'}`}>
                      {pkg.title.includes(' - ') ? pkg.title.split(' - ')[1].trim() : 'Complete Setup'}
                    </p>
                    
                    <p className={`text-3xl font-bold mb-6 ${isFeatured ? 'text-background' : 'text-foreground'}`}>
                      {formatTZS(pkg.price)}
                    </p>

                    <ul className="space-y-3 mb-6">
                      {pkg.highlights.map((highlight) => (
                        <li 
                          key={highlight} 
                          className={`flex items-start gap-3 text-sm ${isFeatured ? 'text-background/80' : 'text-muted-foreground'}`}
                        >
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/#book-now">
                      <Button className={`w-full py-6 text-lg ${
                        isFeatured 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-foreground text-background hover:bg-foreground/90'
                      }`}>
                        Select Package
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
              What's Always Included
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every package comes with these standard features to ensure your event runs smoothly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Setup & Teardown', desc: 'Complete installation and removal' },
              { title: 'Dedicated Coordinator', desc: 'Personal event manager' },
              { title: 'Quality Materials', desc: 'Premium decorations and fabrics' },
              { title: 'Flexible Timing', desc: 'Work around your schedule' },
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
            Need Something Special?
          </h2>
          <p className="text-lg text-background/70 mb-8">
            We can create custom decoration packages tailored to your unique vision and budget. 
            Contact us to discuss your requirements.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 px-8 py-6 text-lg">
                View All Pricing
              </Button>
            </Link>
            <Link to="/#book-now">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
                Request Custom Quote
              </Button>
            </Link>
          </div>
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

export default Packages;

