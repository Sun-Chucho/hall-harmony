import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold">
              Kuringe<span className="text-primary">Halls</span>
            </Link>
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Premium event venues in Dar es Salaam for weddings, conferences, and celebrations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#venues" className="hover:text-white transition-colors">Our Venues</a></li>
              <li><a href="#calendar" className="hover:text-white transition-colors">Availability</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#packages" className="hover:text-white transition-colors">Packages</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><span className="hover:text-white transition-colors cursor-pointer">Weddings</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Conferences</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Corporate Events</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Private Parties</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>+255 717 000 000</li>
              <li>bookings@kuringehalls.co.tz</li>
              <li>Kuringe Complex, Dar es Salaam</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Kuringe Halls. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
