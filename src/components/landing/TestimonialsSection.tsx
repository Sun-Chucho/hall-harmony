import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const testimonials = [
  {
    name: 'Fatima Mwinyi',
    roleEn: 'Wedding Client',
    roleSw: 'Mteja wa Harusi',
    contentEn: 'Witness Hall exceeded all our expectations. The team was incredibly professional, and our 600 guests were amazed by the beautiful setup. Truly unforgettable!',
    contentSw: 'Ukumbi wa Witness ulizidi matarajio yetu yote. Timu ilikuwa ya kitaalamu sana, na wageni wetu 600 walivutiwa na mpangilio mzuri. Ilikuwa ya kukumbukwa sana!',
    rating: 5,
  },
  {
    name: 'James Mollel',
    roleEn: 'Corporate Event Manager',
    roleSw: 'Msimamizi wa Matukio ya Kampuni',
    contentEn: 'We hosted our annual conference at Kilimanjaro Hall. The AV equipment, catering, and coordination were world-class. Will definitely return.',
    contentSw: 'Tulifanya mkutano wetu wa mwaka katika Ukumbi wa Kilimanjaro. Vifaa vya sauti/onekana, upishi, na uratibu vilikuwa vya kiwango cha juu. Tutarudi tena.',
    rating: 5,
  },
  {
    name: 'Grace Kimaro',
    roleEn: 'Birthday Celebration',
    roleSw: 'Sherehe ya Siku ya Kuzaliwa',
    contentEn: 'Hall D was perfect for my intimate 50th birthday dinner. The ambiance, service, and attention to detail made it a night to remember.',
    contentSw: 'Ukumbi D ulikuwa sahihi kwa chakula cha jioni cha kumbukumbu ya miaka 50. Mandhari, huduma, na umakini kwa maelezo vilifanya usiku uwe wa kipekee.',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            {isSw ? 'Ushuhuda' : 'Testimonials'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            {isSw ? 'Wateja Wanasemaje' : 'What Our Clients Say'}
          </h2>
          <p className="text-lg text-blue-900/60">
            {isSw
              ? 'Jiunge na mamia ya wateja walioridhika waliofanya matukio yao maalum Kuringe Halls.'
              : 'Join hundreds of satisfied clients who have celebrated their special moments at Kuringe Halls.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="relative p-8 rounded-3xl bg-white border border-blue-100 shadow-lg shadow-blue-900/5"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-blue-100" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-blue-900/70 leading-relaxed mb-6">
                "{isSw ? testimonial.contentSw : testimonial.contentEn}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-blue-950">{testimonial.name}</p>
                  <p className="text-sm text-blue-900/50">{isSw ? testimonial.roleSw : testimonial.roleEn}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
