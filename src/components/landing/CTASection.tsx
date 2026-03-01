import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const CTASection = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <section className="py-24 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isSw ? 'Uko Tayari Kuandaa Tukio Lako?' : 'Ready to Create Your Perfect Event?'}
          </h2>
          <p className="text-xl text-white/70 mb-8">
            {isSw
              ? 'Wasiliana na timu yetu leo kujadili mahitaji yako na kuhifadhi tarehe unayoitaka.'
              : 'Contact our team today to discuss your vision and secure your preferred date.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/booking">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-lg">
                {isSw ? 'Anza Booking' : 'Start Booking'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
              {isSw ? 'Panga Ziara' : 'Schedule a Tour'}
            </Button>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{isSw ? 'Piga Simu' : 'Call Us'}</h3>
            <p className="text-white/70">+255 717 000 000</p>
            <p className="text-white/50 text-sm">{isSw ? 'Jtatu-Jmosi, 2:00-12:00' : 'Mon-Sat, 8am-6pm'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{isSw ? 'Tutumie Barua Pepe' : 'Email Us'}</h3>
            <p className="text-white/70">kuringenexus.moshi@gmail.com</p>
            <p className="text-white/50 text-sm">{isSw ? 'Majibu ndani ya saa 24' : 'Response within 24hrs'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{isSw ? 'Tutembelee' : 'Visit Us'}</h3>
            <p className="text-white/70">Kuringe Complex</p>
            <p className="text-white/50 text-sm">Dar es Salaam, Tanzania</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

