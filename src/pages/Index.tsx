import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import VenuesSection from '@/components/landing/VenuesSection';
import CalendarSection from '@/components/landing/CalendarSection';
import ServicesSection from '@/components/landing/ServicesSection';
import PackagesSection from '@/components/landing/PackagesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <VenuesSection />
        <CalendarSection />
        <ServicesSection />
        <PackagesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
