import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-50/50 to-transparent rounded-full" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/5 border border-blue-900/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-blue-900">
                {isSw ? 'Kumbi Bora za Matukio Moshi' : 'Premium Event Venues in Moshi'}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-blue-950 leading-[1.1]">
              {isSw ? 'Mahali Ndoto' : 'Where Dreams'}
              <span className="block bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent">
                {isSw ? 'Huwa Uhalisia' : 'Become Reality'}
              </span>
            </h1>

            <p className="text-xl text-blue-900/70 max-w-xl leading-relaxed">
              {isSw
                ? 'Gundua Kuringe Halls, kituo bora Moshi kwa harusi, mikutano na sherehe. Kumbi za kiwango cha kimataifa kwa kumbukumbu zisizosahaulika.'
                : 'Discover Kuringe Halls, Moshi\'s premier destination for weddings, conferences, and celebrations.'}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/booking">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  {isSw ? 'Hifadhi Tukio Lako' : 'Book Your Event'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#venues">
                <Button variant="outline" size="lg" className="border-2 border-blue-900/20 text-blue-900 px-8 py-6 text-lg rounded-xl hover:bg-blue-50 hover:border-blue-900/30">
                  {isSw ? 'Tazama Kumbi' : 'Explore Venues'}
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-8 pt-8 border-t border-blue-900/10">
              <div>
                <p className="text-3xl font-bold text-blue-950">3</p>
                <p className="text-sm text-blue-900/60">{isSw ? 'Kumbi Bora' : 'Premium Halls'}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-950">700+</p>
                <p className="text-sm text-blue-900/60">{isSw ? 'Uwezo wa Wageni' : 'Guest Capacity'}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-950">500+</p>
                <p className="text-sm text-blue-900/60">{isSw ? 'Matukio Yaliyofanyika' : 'Events Hosted'}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-950 rounded-3xl transform rotate-3 opacity-10" />
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-blue-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-red-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-950">{isSw ? 'Uhifadhi wa Haraka' : 'Quick Booking'}</h3>
                  <p className="text-sm text-blue-900/60">{isSw ? 'Kagua upatikanaji mara moja' : 'Check availability instantly'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/50">{isSw ? 'Aina ya Tukio' : 'Event Type'}</label>
                  <select className="w-full mt-2 bg-transparent text-blue-950 font-medium outline-none cursor-pointer">
                    <option>{isSw ? 'Harusi' : 'Wedding Reception'}</option>
                    <option>{isSw ? 'Mkutano' : 'Conference'}</option>
                    <option>{isSw ? 'Siku ya Kuzaliwa' : 'Birthday Party'}</option>
                    <option>{isSw ? 'Tukio la Kampuni' : 'Corporate Event'}</option>
                    <option>{isSw ? 'Chakula cha Faragha' : 'Private Dinner'}</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/50">{isSw ? 'Ukumbi Unaopendelea' : 'Preferred Venue'}</label>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <select className="w-full bg-transparent text-blue-950 font-medium outline-none cursor-pointer">
                      <option>{isSw ? 'Witness Hall (wageni 500-700)' : 'Witness Hall (500-700 guests)'}</option>
                      <option>{isSw ? 'Kilimanjaro Hall & Garden (200-400)' : 'Kilimanjaro Hall & Gardens (200-400)'}</option>
                      <option>{isSw ? 'Hall D (30-60)' : 'Hall D (30-60 guests)'}</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/50">{isSw ? 'Idadi ya Wageni' : 'Expected Guests'}</label>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-primary" />
                    <input
                      type="number"
                      placeholder={isSw ? 'Weka idadi ya wageni' : 'Enter number of guests'}
                      className="w-full bg-transparent text-blue-950 font-medium outline-none placeholder:text-blue-900/40"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-blue-900/50">{isSw ? 'Tarehe Unayopendelea' : 'Preferred Date'}</label>
                  <input type="date" className="w-full mt-2 bg-transparent text-blue-950 font-medium outline-none" />
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white py-6 text-lg rounded-2xl shadow-lg">
                  {isSw ? 'Kagua Upatikanaji' : 'Check Availability'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
