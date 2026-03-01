import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <footer className="bg-slate-950 text-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold">
              Kuringe<span className="text-primary">Halls</span>
            </Link>
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              {isSw
                ? 'Kumbi bora za matukio Dar es Salaam kwa harusi, mikutano na sherehe.'
                : 'Premium event venues in Dar es Salaam for weddings, conferences, and celebrations.'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isSw ? 'Viungo vya Haraka' : 'Quick Links'}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#venues" className="hover:text-white transition-colors">{isSw ? 'Kumbi Zetu' : 'Our Venues'}</a></li>
              <li><a href="#calendar" className="hover:text-white transition-colors">{isSw ? 'Upatikanaji' : 'Availability'}</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">{isSw ? 'Huduma' : 'Services'}</a></li>
              <li><a href="#packages" className="hover:text-white transition-colors">{isSw ? 'Vifurushi' : 'Packages'}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isSw ? 'Huduma' : 'Services'}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Harusi' : 'Weddings'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Mikutano' : 'Conferences'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Matukio ya Kampuni' : 'Corporate Events'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Sherehe Binafsi' : 'Private Parties'}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isSw ? 'Mawasiliano' : 'Contact'}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>+255 717 000 000</li>
              <li>kuringenexus.moshi@gmail.com</li>
              <li>Kuringe Complex, Dar es Salaam</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            {isSw
              ? `© ${new Date().getFullYear()} Kuringe Halls. Haki zote zimehifadhiwa.`
              : `© ${new Date().getFullYear()} Kuringe Halls. All rights reserved.`}
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Sera ya Faragha' : 'Privacy Policy'}</span>
            <span className="hover:text-white transition-colors cursor-pointer">{isSw ? 'Masharti ya Huduma' : 'Terms of Service'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
