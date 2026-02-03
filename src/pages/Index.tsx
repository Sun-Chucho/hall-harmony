import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Calendar, Star, Phone, Mail, Clock, ChevronRight } from 'lucide-react';
import { hallCatalog } from '@/lib/landingData';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

const hallImages: Record<string, string> = {
  witness: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  kilimanjaro: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  'hall-d': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const Index = () => {
  const { t } = useLanguage();

  const stats = [
    { value: '450+', label: t('stats.eventsHosted') },
    { value: '98%', label: t('stats.clientSatisfaction') },
    { value: '3', label: t('stats.premiumVenues') },
    { value: '10+', label: t('stats.yearsExperience') },
  ];

  const services = [
    { icon: Users, title: t('services.weddings'), description: t('services.weddingsDesc') },
    { icon: Calendar, title: t('services.conferences'), description: t('services.conferencesDesc') },
    { icon: Star, title: t('services.galas'), description: t('services.galasDesc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                Kuringe<span className="text-primary">Halls</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/venues" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.venues')}
              </Link>
              <Link to="/packages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.packages')}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link to="/taratibu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.taratibu')}
              </Link>
              <Link to="/muhimu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.muhimu')}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link to="/bookings">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  {t('nav.bookNow')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80"
            alt="Elegant venue"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/90">{t('hero.location')}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('hero.title1')}
              <span className="block text-primary">{t('hero.title2')}</span>
            </h1>
            
            <p className="text-lg text-white/80 mb-8 max-w-xl">
              {t('hero.description')}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/venues">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  {t('hero.exploreVenues')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  {t('hero.viewPricing')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('services.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('services.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venues Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('venues.title')}</h2>
              <p className="text-muted-foreground max-w-xl">
                {t('venues.description')}
              </p>
            </div>
            <Link to="/venues">
              <Button variant="outline" className="gap-2">
                {t('venues.viewAll')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {hallCatalog.map((hall) => (
              <div
                key={hall.id}
                className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={hallImages[hall.id]}
                    alt={hall.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                      {hall.capacity}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{hall.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{hall.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">{t('venues.startingFrom')}</span>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(Math.min(...hall.rates.map((r) => r.price)))}
                      </div>
                    </div>
                    <Link to={`/venues`}>
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                        {t('venues.details')}
                        <ArrowRight className="w-4 h-4" />
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
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            {t('cta.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/bookings">
              <Button size="lg" variant="secondary" className="gap-2">
                <Calendar className="w-4 h-4" />
                {t('cta.bookTour')}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
              <Phone className="w-4 h-4" />
              +255 717 000 000
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link to="/" className="inline-block mb-4">
                <span className="text-2xl font-bold">
                  Kuringe<span className="text-primary">Halls</span>
                </span>
              </Link>
              <p className="text-background/70 mb-6 max-w-md">
                {t('footer.description')}
              </p>
              <div className="flex flex-col gap-2 text-sm text-background/70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t('hero.location')}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  +255 717 000 000
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  bookings@kuringehalls.co.tz
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Mon - Sat: 8:00 AM - 6:00 PM
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">{t('footer.quickLinks')}</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/venues" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('nav.venues')}
                </Link>
                <Link to="/packages" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('nav.packages')}
                </Link>
                <Link to="/pricing" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('nav.pricing')}
                </Link>
                <Link to="/taratibu" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('nav.taratibu')}
                </Link>
                <Link to="/muhimu" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('nav.muhimu')}
                </Link>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-background mb-4">{t('footer.services')}</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/bookings" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('footer.bookings')}
                </Link>
                <Link to="/foods" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('footer.catering')}
                </Link>
                <Link to="/login" className="text-sm text-background/70 hover:text-primary transition-colors">
                  {t('footer.staffPortal')}
                </Link>
              </nav>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-background/10">
            <p className="text-center text-sm text-background/50">
              © {new Date().getFullYear()} Kuringe Halls. {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
