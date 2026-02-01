import { Utensils, Palette, Music, Camera, Car, Sparkles } from 'lucide-react';

const services = [
  {
    icon: Palette,
    title: 'Decoration Packages',
    description: 'From Standard to Royal — stage setup, chandeliers, LED screens, and themed installations.',
    price: 'From TZS 2M',
  },
  {
    icon: Utensils,
    title: 'Catering Services',
    description: 'Full-service catering with customizable menus. Breakfast, lunch, dinner, and refreshments.',
    price: 'Per Guest',
  },
  {
    icon: Music,
    title: 'Sound & Lighting',
    description: 'Professional PA systems, moving head lights, fog machines, and laser effects.',
    price: 'Included',
  },
  {
    icon: Camera,
    title: 'Photo & Video',
    description: 'Capture every moment with our partner photographers and videographers.',
    price: 'On Request',
  },
  {
    icon: Car,
    title: 'Parking & Security',
    description: 'Ample parking space with 24/7 security for all guests and vehicles.',
    price: 'Included',
  },
  {
    icon: Sparkles,
    title: 'Event Coordination',
    description: 'Dedicated event coordinators to ensure your celebration runs flawlessly.',
    price: 'On Request',
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Complete Solutions
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            Everything You Need for Your Event
          </h2>
          <p className="text-lg text-blue-900/60">
            Beyond stunning venues, we offer comprehensive services to make your 
            event truly exceptional.
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
                  Learn more →
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
