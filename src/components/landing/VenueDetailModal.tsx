import { X, Users, Calendar, Check, MapPin, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HallCatalogEntry } from '@/lib/landingData';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface VenueDetailModalProps {
  hall: HallCatalogEntry | null;
  onClose: () => void;
}

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const VenueDetailModal = ({ hall, onClose }: VenueDetailModalProps) => {
  const { language } = useLanguage();
  const isSw = language === 'sw';
  if (!hall) return null;

  const amenities = [
    'Dedicated Parking',
    'Standby Generator',
    'Premium Sound System',
    'Air Conditioning',
    'Bridal Waiting Room',
    'Professional Lighting',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-950 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            <Users className="w-32 h-32" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">
              {hall.alias}
            </p>
            <h2 className="text-3xl font-bold text-white">{hall.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Description & Quick Info */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-950 mb-3">{isSw ? 'Kuhusu Ukumbi Huu' : 'About This Venue'}</h3>
              <p className="text-blue-900/70 leading-relaxed">{hall.description}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
                <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-900/50 uppercase tracking-wide">{isSw ? 'Uwezo' : 'Capacity'}</p>
                  <p className="font-semibold text-blue-950">{hall.capacity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
                <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-900/50 uppercase tracking-wide">{isSw ? 'Eneo' : 'Location'}</p>
                  <p className="font-semibold text-blue-950">Kuringe Halls, Dar es Salaam</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
                <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-900/50 uppercase tracking-wide">{isSw ? 'Mwisho wa Tukio' : 'Event End Time'}</p>
                  <p className="font-semibold text-blue-950">{isSw ? 'Saa sita usiku (00:00)' : 'Midnight (00:00)'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-blue-950 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {isSw ? 'Bei kwa Siku' : 'Pricing by Day'}
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hall.rates.map((rate) => (
                <div key={rate.label} className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                  <p className="text-sm text-blue-900/60 mb-1">{rate.label}</p>
                  <p className="text-xl font-bold text-blue-950">{formatTZS(rate.price)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-blue-900/50 mt-3">{isSw ? '* Bei zote zinajumuisha VAT 18%' : '* All prices include VAT 18%'}</p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-blue-950 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isSw ? 'Huduma Zinazojumuishwa' : 'Included Amenities'}
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-blue-900/70">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-blue-100">
            <Link to="/booking" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-500/90 text-white py-6 text-lg rounded-xl shadow-lg">
                {isSw ? 'Hifadhi Ukumbi Huu' : 'Book This Venue'}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-2 border-blue-900/20 text-blue-900 py-6 text-lg rounded-xl hover:bg-blue-50"
            >
              {isSw ? 'Endelea Kutazama' : 'Continue Browsing'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailModal;
