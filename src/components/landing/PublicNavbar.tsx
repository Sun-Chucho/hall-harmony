import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const links = [
  { label: 'Packages', to: '/packages' },
  { label: 'Catering', to: '/pricing' },
  { label: 'Drinks', to: '/pricing' },
  { label: 'Policies', to: '/taratibu' },
];

type PublicNavbarProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

const PublicNavbar = ({ ctaLabel = 'Book Now', ctaTo = '/booking' }: PublicNavbarProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e4dc] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-black">
          Kuringe <span className="text-[#C6A75E]">Halls</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((item) => (
            <Link key={item.label} to={item.to} className="text-sm font-medium text-[#444444] transition hover:text-[#111111]">
              {item.label}
            </Link>
          ))}
          <Link to={ctaTo}>
            <Button size="sm" className="rounded-full bg-[#1F1F1F] px-5 text-white hover:bg-[#313131]">{ctaLabel}</Button>
          </Link>
        </nav>

        <Link to={ctaTo} className="md:hidden">
          <Button size="sm" className="rounded-full bg-[#1F1F1F] px-5 text-white hover:bg-[#313131]">Book</Button>
        </Link>
      </div>
    </header>
  );
};

export default PublicNavbar;
