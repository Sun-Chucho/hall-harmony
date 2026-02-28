import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface Translations {
  [key: string]: {
    en: string;
    sw: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.venues': { en: 'Venues', sw: 'Kumbi' },
  'nav.packages': { en: 'Packages', sw: 'Vifurushi' },
  'nav.pricing': { en: 'Pricing', sw: 'Bei' },
  'nav.catering': { en: 'Catering', sw: 'Upishi' },
  'nav.drinks': { en: 'Drinks', sw: 'Vinywaji' },
  'nav.policies': { en: 'Policies', sw: 'Sera' },
  'nav.taratibu': { en: 'Taratibu', sw: 'Taratibu' },
  'nav.muhimu': { en: 'Muhimu', sw: 'Muhimu' },
  'nav.signIn': { en: 'Sign In', sw: 'Ingia' },
  'nav.staffLogin': { en: 'Staff Login', sw: 'Ingia Wafanyakazi' },
  'nav.bookNow': { en: 'Book Now', sw: 'Hifadhi Sasa' },
  'nav.book': { en: 'Book', sw: 'Hifadhi' },
  'lang.en': { en: 'EN', sw: 'EN' },
  'lang.sw': { en: 'SW', sw: 'SW' },
  
  // Hero Section
  'hero.location': { en: 'Dar es Salaam, Tanzania', sw: 'Dar es Salaam, Tanzania' },
  'hero.title1': { en: 'Where Extraordinary', sw: 'Mahali Ambapo Matukio' },
  'hero.title2': { en: 'Events Come to Life', sw: 'Ya Kipekee Yanafanyika' },
  'hero.description': { 
    en: 'Experience world-class venues designed for weddings, conferences, and celebrations. Premium hospitality meets exceptional service at Kuringe Halls.',
    sw: 'Pata uzoefu wa kumbi za kimataifa zilizobuniwa kwa harusi, mikutano, na sherehe. Ukarimu wa hali ya juu unakutana na huduma bora katika Kuringe Halls.'
  },
  'hero.exploreVenues': { en: 'Explore Venues', sw: 'Tazama Kumbi' },
  'hero.viewPricing': { en: 'View Pricing', sw: 'Tazama Bei' },
  
  // Stats
  'stats.eventsHosted': { en: 'Events Hosted', sw: 'Matukio Yaliyofanyika' },
  'stats.clientSatisfaction': { en: 'Client Satisfaction', sw: 'Kuridhika kwa Wateja' },
  'stats.premiumVenues': { en: 'Premium Venues', sw: 'Kumbi za Hali ya Juu' },
  'stats.yearsExperience': { en: 'Years Experience', sw: 'Miaka ya Uzoefu' },
  
  // Services
  'services.title': { en: 'Our Services', sw: 'Huduma Zetu' },
  'services.description': { 
    en: 'From intimate gatherings to grand celebrations, we provide exceptional spaces and services for every occasion.',
    sw: 'Kutoka mikutano midogo hadi sherehe kubwa, tunatoa nafasi na huduma bora kwa kila tukio.'
  },
  'services.weddings': { en: 'Weddings', sw: 'Harusi' },
  'services.weddingsDesc': { en: 'Elegant ceremonies and receptions', sw: 'Sherehe na mapokezi ya kifahari' },
  'services.conferences': { en: 'Conferences', sw: 'Mikutano' },
  'services.conferencesDesc': { en: 'Professional meeting spaces', sw: 'Nafasi za mikutano ya kitaaluma' },
  'services.galas': { en: 'Galas', sw: 'Sherehe' },
  'services.galasDesc': { en: 'Memorable celebrations', sw: 'Sherehe za kukumbukwa' },
  
  // Venues
  'venues.title': { en: 'Our Premium Venues', sw: 'Kumbi Zetu za Hali ya Juu' },
  'venues.description': { 
    en: 'Discover our collection of elegant spaces, each designed to create unforgettable moments.',
    sw: 'Gundua mkusanyiko wetu wa nafasi nzuri, kila moja imebuniwa kuunda wakati usioweza kusahaulika.'
  },
  'venues.viewAll': { en: 'View All Venues', sw: 'Tazama Kumbi Zote' },
  'venues.startingFrom': { en: 'Starting from', sw: 'Kuanzia' },
  'venues.details': { en: 'Details', sw: 'Maelezo' },
  
  // CTA
  'cta.title': { en: 'Ready to Create Unforgettable Memories?', sw: 'Uko Tayari Kuunda Kumbukumbu Zisizosahaulika?' },
  'cta.description': { 
    en: 'Contact us today to schedule a venue tour or discuss your event requirements.',
    sw: 'Wasiliana nasi leo kupanga ziara ya ukumbi au kujadili mahitaji ya tukio lako.'
  },
  'cta.bookTour': { en: 'Book a Tour', sw: 'Hifadhi Ziara' },
  
  // Footer
  'footer.description': { 
    en: 'Premium event venues in Dar es Salaam. World-class facilities, exceptional service, and unforgettable experiences.',
    sw: 'Kumbi za matukio za hali ya juu Dar es Salaam. Vifaa vya kimataifa, huduma bora, na uzoefu usioweza kusahaulika.'
  },
  'footer.quickLinks': { en: 'Quick Links', sw: 'Viungo vya Haraka' },
  'footer.services': { en: 'Services', sw: 'Huduma' },
  'footer.bookings': { en: 'Bookings', sw: 'Uhifadhi' },
  'footer.catering': { en: 'Catering', sw: 'Upishi' },
  'footer.staffPortal': { en: 'Staff Portal', sw: 'Mlango wa Wafanyakazi' },
  'footer.rights': { en: 'All rights reserved.', sw: 'Haki zote zimehifadhiwa.' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kuringe_language_v1');
    return saved === 'sw' ? 'sw' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('kuringe_language_v1', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
