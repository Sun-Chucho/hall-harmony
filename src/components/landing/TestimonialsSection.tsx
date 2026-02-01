import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Fatima Mwinyi',
    role: 'Wedding Client',
    content: 'Witness Hall exceeded all our expectations. The team was incredibly professional, and our 600 guests were amazed by the beautiful setup. Truly unforgettable!',
    rating: 5,
  },
  {
    name: 'James Mollel',
    role: 'Corporate Event Manager',
    content: 'We hosted our annual conference at Kilimanjaro Hall. The AV equipment, catering, and coordination were world-class. Will definitely return.',
    rating: 5,
  },
  {
    name: 'Grace Kimaro',
    role: 'Birthday Celebration',
    content: 'Hall D was perfect for my intimate 50th birthday dinner. The ambiance, service, and attention to detail made it a night to remember.',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Testimonials
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-blue-900/60">
            Join hundreds of satisfied clients who have celebrated their special 
            moments at Kuringe Halls.
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
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-blue-950">{testimonial.name}</p>
                  <p className="text-sm text-blue-900/50">{testimonial.role}</p>
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
