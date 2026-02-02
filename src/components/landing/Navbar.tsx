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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-950">
            Kuringe<span className="text-primary">Halls</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <Link to="/foods" className="text-sm font-medium transition hover:text-slate-900">
              Food menu
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-50">
                Login
              </Button>
            </Link>
            <Link to="/foods">
              <Button className="bg-red-600 text-white hover:bg-red-500">
                View menu
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
          <div className="md:hidden py-6 border-t border-slate-200">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-slate-600 transition hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/foods"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-slate-600 transition hover:text-slate-900"
              >
                Food menu
              </Link>
              <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-slate-200">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full border-slate-300 text-slate-900">
                    Login
                  </Button>
                </Link>
                <Link to="/foods" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-red-600 text-white hover:bg-red-500">
                    View menu
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
