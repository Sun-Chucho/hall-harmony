import { Users, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HallCatalogEntry } from '@/lib/landingData';
import { useLanguage } from '@/contexts/LanguageContext';

interface VenueCardProps {
  hall: HallCatalogEntry;
  onSelect: (hall: HallCatalogEntry) => void;
  featured?: boolean;
}

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const localizeHall = (hall: HallCatalogEntry, isSw: boolean) => {
  if (!isSw) return hall;

  if (hall.id === 'witness') {
    return {
      ...hall,
      name: 'Ukumbi wa Witness',
      alias: 'Ukumbi A',
      description: 'Ukumbi mkubwa kwa wageni 500-700 wenye foyer nzuri, chandeliers, na mfumo bora wa sauti.',
      capacity: 'Wageni 500 - 700',
    };
  }

  if (hall.id === 'kilimanjaro') {
    return {
      ...hall,
      name: 'Ukumbi wa Kilimanjaro na Garden',
      alias: 'Ukumbi B + Garden',
      description: 'Ukumbi kwa wageni 200-300 pamoja na garden ya watu 300-400 kwa sherehe na mapokezi.',
      capacity: 'Ukumbi 200 - 300 | Garden 300 - 400',
    };
  }

  return {
    ...hall,
    name: 'Ukumbi D',
    alias: 'Ukumbi D',
    description: 'Ukumbi wa karibu kwa wageni 30-60 unaofaa mikutano au chakula cha jioni cha binafsi.',
    capacity: 'Wageni 30 - 60',
  };
};

const VenueCard = ({ hall, onSelect, featured = false }: VenueCardProps) => {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  const localizedHall = localizeHall(hall, isSw);

  return (
    <div 
      className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
        featured 
          ? 'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white shadow-2xl shadow-blue-900/30' 
          : 'bg-white border border-blue-100 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10'
      }`}
      onClick={() => onSelect(hall)}
    >
      {/* Image Placeholder */}
      <div className={`relative h-56 overflow-hidden ${featured ? 'bg-blue-800/30' : 'bg-gradient-to-br from-blue-100 to-blue-50'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${featured ? 'text-white/30' : 'text-blue-900/20'}`}>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-current/10 flex items-center justify-center mb-3">
              <Users className="w-10 h-10" />
            </div>
            <p className="text-sm font-medium">{isSw ? 'Picha ya Ukumbi' : 'Venue Image'}</p>
          </div>
        </div>
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-red-500 text-white text-xs font-semibold">
            <Star className="w-3 h-3 fill-current" />
            {isSw ? 'Ukumbi Pendwa' : 'Featured Venue'}
          </div>
        )}

        {/* Capacity Badge */}
        <div className={`absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full ${
          featured ? 'bg-white/10 backdrop-blur-sm text-white' : 'bg-blue-900 text-white'
        }`}>
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">{localizedHall.capacity}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${featured ? 'text-primary' : 'text-primary'}`}>
            {localizedHall.alias}
          </p>
          <h3 className={`text-2xl font-bold mt-1 ${featured ? 'text-white' : 'text-blue-950'}`}>
            {localizedHall.name}
          </h3>
          <p className={`mt-2 text-sm leading-relaxed ${featured ? 'text-white/70' : 'text-blue-900/60'}`}>
            {localizedHall.description}
          </p>
        </div>

        {/* Pricing */}
        <div className={`space-y-2 pt-4 border-t ${featured ? 'border-white/10' : 'border-blue-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${featured ? 'text-white/50' : 'text-blue-900/50'}`}>
            {isSw ? 'Kuanzia' : 'Starting from'}
          </p>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-bold ${featured ? 'text-white' : 'text-blue-950'}`}>
              {formatTZS(Math.min(...localizedHall.rates.map(r => r.price)))}
            </span>
            <span className={`text-sm pb-1 ${featured ? 'text-white/50' : 'text-blue-900/50'}`}>
              {isSw ? '/ siku' : '/ day'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button 
          className={`w-full rounded-xl py-5 font-semibold transition-all ${
            featured 
              ? 'bg-white text-blue-900 hover:bg-white/90' 
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
        >
          {isSw ? 'Tazama Maelezo' : 'View Details'}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default VenueCard;
