import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X } from 'lucide-react';

const links = [
  { labelKey: 'nav.venues', to: '/?section=destinations' },
  { labelKey: 'nav.packages', to: '/?section=packages' },
  { labelKey: 'nav.policies', to: '/?section=policies' },
];

type PublicNavbarProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

const PublicNavbar = ({ ctaLabel = 'Book Now', ctaTo = '/booking' }: PublicNavbarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const ctaText = ctaLabel === 'Book Now' ? t('nav.bookNow') : ctaLabel;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className={scrolled ? 'text-[#0A0A0A]' : 'text-white'}>Kuringe</span>{' '}
            <span className="text-[#7A151B]">Halls</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((item) => (
              <Link
                key={item.labelKey}
                to={item.to}
                className={`text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 ${
                  scrolled
                    ? 'text-[#0A0A0A]/70 hover:text-[#7A151B]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className="inline-flex overflow-hidden rounded-full border border-current/10">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                  language === 'en'
                    ? 'bg-[#7A151B] text-white'
                    : scrolled
                    ? 'bg-transparent text-[#0A0A0A]/60 hover:text-[#0A0A0A]'
                    : 'bg-transparent text-white/60 hover:text-white'
                }`}
              >
                {t('lang.en')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sw')}
                className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                  language === 'sw'
                    ? 'bg-[#7A151B] text-white'
                    : scrolled
                    ? 'bg-transparent text-[#0A0A0A]/60 hover:text-[#0A0A0A]'
                    : 'bg-transparent text-white/60 hover:text-white'
                }`}
              >
                {t('lang.sw')}
              </button>
            </div>

            <Link to={ctaTo}>
              <Button
                size="sm"
                className="rounded-full bg-[#7A151B] px-6 text-white hover:bg-[#5C0A0F] transition-colors duration-300"
              >
                {ctaText}
              </Button>
            </Link>
          </nav>

          {/* Mobile nav trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                scrolled
                  ? 'border-[#0A0A0A]/15 text-[#0A0A0A]/70'
                  : 'border-white/30 text-white/80'
              }`}
            >
              {language === 'en' ? t('lang.sw') : t('lang.en')}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={`p-1 transition-colors ${scrolled ? 'text-[#0A0A0A]' : 'text-white'}`}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-xl font-bold tracking-tight">
              <span className="text-[#0A0A0A]">Kuringe</span>{' '}
              <span className="text-[#7A151B]">Halls</span>
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-[#0A0A0A]" aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 px-6 pt-8">
            {links.map((item) => (
              <Link
                key={item.labelKey}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-[#0A0A0A] transition-colors hover:text-[#7A151B]"
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <Link to={ctaTo} onClick={() => setMobileOpen(false)}>
              <Button className="mt-4 w-full rounded-full bg-[#7A151B] py-6 text-base text-white hover:bg-[#5C0A0F]">
                {ctaText}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
};

export default PublicNavbar;
