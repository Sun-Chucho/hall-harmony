import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const links = [
  { labelKey: 'nav.packages', to: '/packages' },
  { labelKey: 'nav.catering', to: '/catering' },
  { labelKey: 'nav.drinks', to: '/drinks' },
  { labelKey: 'nav.policies', to: '/taratibu' },
];

type PublicNavbarProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

const PublicNavbar = ({ ctaLabel = 'Book Now', ctaTo = '/booking' }: PublicNavbarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const ctaText = ctaLabel === 'Book Now' ? t('nav.bookNow') : ctaLabel;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e4dc] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-black">
          Kuringe <span className="text-[#C6A75E]">Halls</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((item) => (
            <Link key={item.labelKey} to={item.to} className="text-sm font-medium text-[#444444] transition hover:text-[#111111]">
              {t(item.labelKey)}
            </Link>
          ))}
          <div className="inline-flex overflow-hidden rounded-full border border-[#d8d3ca]">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-semibold ${language === 'en' ? 'bg-[#1f1f1f] text-white' : 'bg-white text-[#444444]'}`}
            >
              {t('lang.en')}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`px-3 py-1 text-xs font-semibold ${language === 'sw' ? 'bg-[#1f1f1f] text-white' : 'bg-white text-[#444444]'}`}
            >
              {t('lang.sw')}
            </button>
          </div>
          <Link to={ctaTo}>
            <Button size="sm" className="rounded-full bg-[#1F1F1F] px-5 text-white hover:bg-[#313131]">{ctaText}</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="rounded-full border border-[#d8d3ca] px-3 py-1 text-xs font-semibold text-[#444444]"
          >
            {language === 'en' ? t('lang.sw') : t('lang.en')}
          </button>
          <Link to={ctaTo}>
            <Button size="sm" className="rounded-full bg-[#1F1F1F] px-5 text-white hover:bg-[#313131]">{t('nav.book')}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
