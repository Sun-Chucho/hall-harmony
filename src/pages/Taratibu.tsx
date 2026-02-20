import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { taratibuChecklist } from '@/lib/landingData';

const Taratibu = () => {
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
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Taratibu za Ukumbi
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Rules & Procedures
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We operate with discipline and transparency. Follow these rules to secure your booking 
            and enjoy seamless service from the Kuringe team.
          </p>
        </div>
      </section>

      {/* Rules Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {taratibuChecklist.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Rule {index + 1}</p>
                  <p className="text-foreground leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-4xl px-6">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-border">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Important Notice</h3>
                <p className="text-muted-foreground">
                  All clients must read and agree to these terms before booking any venue. 
                  Failure to comply may result in cancellation without refund.
                </p>
              </div>
            </div>

            <div className="bg-accent/50 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground mb-2">
                    Mimi ........................ Nimesoma na kukubaliana na miongozo yote hapo juu na nitafuata yote.
                  </p>
                  <div className="flex flex-wrap gap-8 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Saini:</span>
                      <span className="border-b border-border w-32 inline-block">&nbsp;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tarehe:</span>
                      <span className="border-b border-border w-32 inline-block">&nbsp;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-8 rounded-3xl bg-white border border-border">
              <p className="text-4xl font-bold text-primary mb-2">{taratibuChecklist.length}</p>
              <p className="text-muted-foreground">Essential Rules</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-border">
              <p className="text-4xl font-bold text-foreground mb-2">100%</p>
              <p className="text-muted-foreground">Compliance Required</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-border">
              <p className="text-4xl font-bold text-foreground mb-2">24/7</p>
              <p className="text-muted-foreground">Security Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Proceed?
          </h2>
          <p className="text-lg text-background/70 mb-8">
            Once you've reviewed all the rules, you can proceed to book your preferred venue.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/venues">
              <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 px-8 py-6 text-lg">
                View Venues
              </Button>
            </Link>
            <Link to="/#book-now">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg">
                Start Booking
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

export default Taratibu;
