import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '#venues', label: 'Venues' },
    { href: '#calendar', label: 'Availability' },
    { href: '#services', label: 'Services' },
    { href: '#packages', label: 'Packages' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-blue-100">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-950">
            Kuringe<span className="text-primary">Halls</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-blue-900/70 hover:text-blue-950 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" className="border-blue-900/20 text-blue-900 hover:bg-blue-50">
                Login
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-blue-950"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-blue-100">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-blue-900/70 hover:text-blue-950 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-blue-100">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full border-blue-900/20 text-blue-900">
                    Login
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Book Now
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
