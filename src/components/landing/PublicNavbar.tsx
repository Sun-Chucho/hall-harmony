import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, ChevronDown, Users } from 'lucide-react';
import { destinationProfiles } from '@/lib/destinationProfiles';
import { VENUE_IMAGE_BY_ID } from '@/lib/siteImages';

const links = [
  { labelKey: 'nav.packages', to: '/?section=packages' },
  { labelKey: 'nav.policies', to: '/?section=policies' },
];

type PublicNavbarProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

const PublicNavbar = ({ ctaLabel = 'Book Now', ctaTo = '/booking' }: PublicNavbarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const isSw = language === 'sw';
  const ctaText = ctaLabel === 'Book Now' ? t('nav.bookNow') : ctaLabel;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);
  const [mobileVenuesOpen, setMobileVenuesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openDropdown = () => {
    clearTimeout(timeoutRef.current);
    setVenueDropdownOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setVenueDropdownOpen(false), 200);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
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
            {/* Venues dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                className={`flex items-center gap-1 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 ${
                  scrolled
                    ? 'text-[#0A0A0A]/70 hover:text-[#7A151B]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {isSw ? 'Kumbi' : 'Venues'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${venueDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {venueDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                  <div className="w-[420px] rounded-xl border border-black/10 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {isSw ? 'Chagua Ukumbi' : 'Choose a Venue'}
                      </p>
                    </div>
                    {destinationProfiles.map((dest) => (
                      <Link
                        key={dest.id}
                        to={`/halls/${dest.id}`}
                        onClick={() => setVenueDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent group"
                      >
                        <img
                          src={VENUE_IMAGE_BY_ID[dest.id]}
                          alt={dest.name}
                          className="h-12 w-16 rounded-md object-cover border border-black/5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-[#7A151B] transition-colors">
                            {dest.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">{dest.alias}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {dest.capacity}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t border-black/5 mt-1 pt-1 px-3 py-2">
                      <Link
                        to="/?section=destinations"
                        onClick={() => setVenueDropdownOpen(false)}
                        className="text-xs font-medium text-[#7A151B] hover:underline"
                      >
                        {isSw ? 'Angalia kumbi zote →' : 'View all venues →'}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-xl font-bold tracking-tight">
              <span className="text-[#0A0A0A]">Kuringe</span>{' '}
              <span className="text-[#7A151B]">Halls</span>
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-[#0A0A0A]" aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-2 px-6 pt-8">
            {/* Venues accordion */}
            <button
              type="button"
              onClick={() => setMobileVenuesOpen(!mobileVenuesOpen)}
              className="flex items-center justify-between text-2xl font-semibold text-[#0A0A0A] transition-colors hover:text-[#7A151B] py-2"
            >
              {isSw ? 'Kumbi' : 'Venues'}
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${mobileVenuesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileVenuesOpen && (
              <div className="flex flex-col gap-1 pl-2 pb-4">
                {destinationProfiles.map((dest) => (
                  <Link
                    key={dest.id}
                    to={`/halls/${dest.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <img
                      src={VENUE_IMAGE_BY_ID[dest.id]}
                      alt={dest.name}
                      className="h-10 w-14 rounded-md object-cover border border-black/5"
                    />
                    <div>
                      <p className="text-base font-semibold text-foreground">{dest.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {dest.capacity}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/?section=destinations"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-[#7A151B] px-3 py-1"
                >
                  {isSw ? 'Angalia zote →' : 'View all →'}
                </Link>
              </div>
            )}

            {links.map((item) => (
              <Link
                key={item.labelKey}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-[#0A0A0A] transition-colors hover:text-[#7A151B] py-2"
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