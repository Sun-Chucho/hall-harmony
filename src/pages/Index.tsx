import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Sparkles, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hallCatalog } from '@/lib/landingData';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
};

const navLinks = [
  { href: '/venues', label: 'Venues' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/taratibu', label: 'Taratibu' },
  { href: '/muhimu', label: 'Muhimu' },
  { href: '/packages', label: 'Packages' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="text-2xl font-bold text-foreground">
              Kuringe<span className="text-primary">Halls</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Login
                </Button>
              </Link>
              <Link to="/login" className="hidden sm:block">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Premium Event Venues in Dar es Salaam</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1]">
                  Where Dreams
                  <span className="block text-primary">
                    Become Reality
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Discover Kuringe Halls — Dar es Salaam's premier destination for weddings, 
                  conferences, and celebrations. World-class venues designed for unforgettable moments.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link to="/login">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25">
                      Book Your Event
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/venues">
                    <Button variant="outline" size="lg" className="border-2 border-border text-foreground px-8 py-6 text-lg rounded-xl hover:bg-secondary">
                      Explore Venues
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
                  <div>
                    <p className="text-3xl font-bold text-foreground">3</p>
                    <p className="text-sm text-muted-foreground">Premium Halls</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">700+</p>
                    <p className="text-sm text-muted-foreground">Guest Capacity</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">500+</p>
                    <p className="text-sm text-muted-foreground">Events Hosted</p>
                  </div>
                </div>
              </div>

              {/* Right - Hero Image */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-3xl transform rotate-3" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"
                    alt="Kuringe Halls Wedding Venue"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Star className="w-6 h-6 text-primary fill-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Witness Hall</p>
                        <p className="text-sm text-muted-foreground">Our flagship venue for 500-700 guests</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="py-16 bg-secondary">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="group flex items-center justify-between p-6 rounded-2xl bg-white border border-border hover:border-primary hover:shadow-lg transition-all"
                >
                  <span className="font-semibold text-foreground">{link.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Venues Preview */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                Our Venues
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Premium Event Spaces
              </h2>
              <p className="text-lg text-muted-foreground">
                Three exceptional venues designed to bring your vision to life.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hallCatalog.map((hall, index) => (
                <Link
                  key={hall.id}
                  to="/venues"
                  className="group rounded-3xl overflow-hidden bg-white border border-border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={hallImages[hall.id]}
                      alt={hall.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {index === 0 && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{hall.capacity}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                      {hall.alias}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-2">{hall.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{hall.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting from</p>
                        <p className="text-lg font-bold text-foreground">
                          {formatTZS(Math.min(...hall.rates.map(r => r.price)))}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/venues">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8">
                  View All Venues
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-foreground text-background">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Book Your Event?
            </h2>
            <p className="text-lg text-background/70 mb-8">
              Contact us today to discuss your requirements and secure your preferred date.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 px-8 py-6 text-lg">
                  View Pricing
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
                  Start Booking
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="text-xl font-bold text-foreground">
              Kuringe<span className="text-primary">Halls</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Kuringe Halls. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
