import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Info, CheckCircle, Heart, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { muhimuNotes } from '@/lib/landingData';

const importantCategories = [
  {
    icon: Clock,
    title: 'Timing & Schedule',
    description: 'All events must follow the agreed timeline. Late arrivals may affect your event flow.',
  },
  {
    icon: Heart,
    title: 'Care & Responsibility',
    description: 'Treat our venues with care. Any damages will be charged to your account.',
  },
  {
    icon: Phone,
    title: '24/7 Support',
    description: 'Our team is always available to assist you before, during, and after your event.',
  },
];

const Muhimu = () => {
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
          <Link to="/login">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Book Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-secondary to-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Muhimu
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Important Information
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Key commitments and important notices that every client should know 
            before booking with Kuringe Halls.
          </p>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {importantCategories.map((category) => (
              <div
                key={category.title}
                className="p-6 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <category.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{category.title}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              Essential Notices
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Important Commitments
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {muhimuNotes.map((note, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-foreground rounded-3xl p-8 md:p-12 text-background text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Our Commitment to You
            </h3>
            <p className="text-lg text-background/80 mb-8 max-w-2xl mx-auto">
              We are dedicated to making your event a success. From the moment you book 
              with us until the last guest leaves, our team ensures everything runs smoothly.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-background/10 rounded-2xl p-6">
                <p className="text-3xl font-bold text-primary mb-2">500+</p>
                <p className="text-background/70">Events Successfully Hosted</p>
              </div>
              <div className="bg-background/10 rounded-2xl p-6">
                <p className="text-3xl font-bold text-primary mb-2">98%</p>
                <p className="text-background/70">Client Satisfaction Rate</p>
              </div>
              <div className="bg-background/10 rounded-2xl p-6">
                <p className="text-3xl font-bold text-primary mb-2">10+</p>
                <p className="text-background/70">Years of Experience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Have Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our team is here to help. Reach out to us for any clarifications.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/taratibu">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                View Rules
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
                Contact Us
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

export default Muhimu;
