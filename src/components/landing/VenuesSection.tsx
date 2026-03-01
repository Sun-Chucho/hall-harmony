import { useState } from 'react';
import { hallCatalog, HallCatalogEntry } from '@/lib/landingData';
import VenueCard from './VenueCard';
import VenueDetailModal from './VenueDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';

const VenuesSection = () => {
  const [selectedHall, setSelectedHall] = useState<HallCatalogEntry | null>(null);
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <>
      <section id="venues" className="py-24 bg-gradient-to-b from-white to-blue-50/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              {isSw ? 'Kumbi Zetu' : 'Our Venues'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-950 mb-4">
              {isSw ? 'Gundua Nafasi Bora za Matukio' : 'Discover Premium Event Spaces'}
            </h2>
            <p className="text-lg text-blue-900/60">
              {isSw
                ? 'Kumbi tatu za kipekee zilizobuniwa kuifanya ndoto ya tukio lako iwe halisi. Kila ukumbi una tabia na huduma zake kwa kumbukumbu zisizosahaulika.'
                : 'Three exceptional venues designed to bring your vision to life. Each space offers unique character and amenities for unforgettable events.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hallCatalog.map((hall, index) => (
              <VenueCard 
                key={hall.id} 
                hall={hall} 
                onSelect={setSelectedHall}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <VenueDetailModal 
        hall={selectedHall} 
        onClose={() => setSelectedHall(null)} 
      />
    </>
  );
};

export default VenuesSection;
