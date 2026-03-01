import { Utensils, Palette, Music, Camera, Car, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ServicesSection = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  const services = [
    {
      icon: Palette,
      title: isSw ? 'Vifurushi vya Mapambo' : 'Decoration Packages',
      description: isSw
        ? 'Kutoka Standard hadi Royal: stage setup, chandeliers, LED screens, na themes.'
        : 'From Standard to Royal: stage setup, chandeliers, LED screens, and themed installations.',
      price: isSw ? 'Kuanzia TZS 2M' : 'From TZS 2M',
    },
    {
      icon: Utensils,
      title: isSw ? 'Huduma ya Chakula' : 'Catering Services',
      description: isSw
        ? 'Huduma kamili ya chakula na menyu zinazobadilika kulingana na tukio.'
        : 'Full-service catering with customizable menus. Breakfast, lunch, dinner, and refreshments.',
      price: isSw ? 'Kwa Mtu' : 'Per Guest',
    },
    {
      icon: Music,
      title: isSw ? 'Sauti na Mwanga' : 'Sound & Lighting',
      description: isSw
        ? 'P.A ya kitaalamu, moving heads, fog machine na lazer effects.'
        : 'Professional PA systems, moving head lights, fog machines, and laser effects.',
      price: isSw ? 'Imejumuishwa' : 'Included',
    },
    {
      icon: Camera,
      title: isSw ? 'Picha na Video' : 'Photo & Video',
      description: isSw
        ? 'Tunashirikiana na wapiga picha/video bora kunasa kila tukio.'
        : 'Capture every moment with our partner photographers and videographers.',
      price: isSw ? 'Kwa Ombi' : 'On Request',
    },
    {
      icon: Car,
      title: isSw ? 'Parking na Ulinzi' : 'Parking & Security',
      description: isSw
        ? 'Maegesho ya kutosha na ulinzi wa uhakika kwa wageni wote.'
        : 'Ample parking space with 24/7 security for all guests and vehicles.',
      price: isSw ? 'Imejumuishwa' : 'Included',
    },
    {
      icon: Sparkles,
      title: isSw ? 'Uratibu wa Tukio' : 'Event Coordination',
      description: isSw
        ? 'Waratibu wetu wa tukio husaidia kila hatua ifanyike kwa usahihi.'
        : 'Dedicated event coordinators to ensure your celebration runs flawlessly.',
      price: isSw ? 'Kwa Ombi' : 'On Request',
    },
  ];

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Suluhisho Kamili' : 'Complete Solutions'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            {isSw ? 'Kila Unachohitaji kwa Tukio Lako' : 'Everything You Need for Your Event'}
          </h2>
          <p className="text-lg text-blue-900/60">
            {isSw
              ? 'Mbali na ukumbi mzuri, tunatoa huduma kamili za kufanya tukio lako liwe la kipekee.'
              : 'Beyond stunning venues, we offer comprehensive services to make your event truly exceptional.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative p-6 rounded-3xl bg-white border border-blue-100 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                index % 2 === 0
                  ? 'bg-gradient-to-br from-blue-900 to-blue-950'
                  : 'bg-gradient-to-br from-primary to-red-500'
              }`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-blue-950 mb-2">{service.title}</h3>
              <p className="text-blue-900/60 mb-4 leading-relaxed">{service.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                <span className="text-sm font-semibold text-primary">{service.price}</span>
                <span className="text-sm text-blue-900/40 group-hover:text-blue-900/60 transition-colors">
                  {isSw ? 'Jifunze zaidi ->' : 'Learn more ->'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
