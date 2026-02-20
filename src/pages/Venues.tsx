import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Star, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hallCatalog, HallCatalogEntry } from '@/lib/landingData';
import VenueDetailModal from '@/components/landing/VenueDetailModal';

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

const Venues = () => {
  const [selectedHall, setSelectedHall] = useState<HallCatalogEntry | null>(null);

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
            Our Venues
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Discover Premium Event Spaces
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Three exceptional venues designed to bring your vision to life. 
            Each space offers unique character and amenities for unforgettable events.
          </p>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-16">
            {hallCatalog.map((hall, index) => (
              <div 
                key={hall.id}
                className={`grid lg:grid-cols-2 gap-10 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                {/* Image */}
                <div 
                  className={`relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden group cursor-pointer ${
                    index % 2 === 1 ? 'lg:col-start-2' : ''
                  }`}
                  onClick={() => setSelectedHall(hall)}
                >
                  <img 
                    src={hallImages[hall.id]}
                    alt={hall.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Featured Badge */}
                  {index === 0 && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      <Star className="w-4 h-4 fill-current" />
                      Featured Venue
                    </div>
                  )}

                  {/* Capacity Badge */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{hall.capacity}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                      {hall.alias}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {hall.name}
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {hall.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-3">
                    {['Sound System', 'Generator Backup', 'Parking', 'Security'].slice(0, 4).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary text-foreground text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="bg-secondary rounded-2xl p-6 space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pricing Options
                    </p>
                    <div className="space-y-3">
                      {hall.rates.map((rate) => (
                        <div key={rate.label} className="flex items-center justify-between">
                          <span className="text-foreground">{rate.label}</span>
                          <span className="text-xl font-bold text-foreground">{formatTZS(rate.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => setSelectedHall(hall)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    >
                      View Details
                    </Button>
                    <Link to="/#book-now">
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book This Venue
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
          <Link to="/#book-now">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
              Start Booking Process
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

      <VenueDetailModal 
        hall={selectedHall} 
        onClose={() => setSelectedHall(null)} 
      />
    </div>
  );
};

export default Venues;
