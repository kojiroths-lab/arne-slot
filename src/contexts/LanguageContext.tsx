import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'bn';

const banglaDigitsMap: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export const convertToBanglaDigits = (value: number | string): string => {
  const str = String(value);
  return str
    .split('')
    .map((ch) => (banglaDigitsMap[ch] !== undefined ? banglaDigitsMap[ch] : ch))
    .join('');
};

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { en: 'Home', bn: 'হোম' },
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  scan: { en: 'Scan', bn: 'স্ক্যান' },
  profile: { en: 'Profile', bn: 'প্রোফাইল' },
  store: { en: 'Store', bn: 'দোকান' },
  map: { en: 'Map', bn: 'মানচিত্র' },
  
  // Auth
  login: { en: 'Login', bn: 'লগইন' },
  logout: { en: 'Logout', bn: 'লগআউট' },
  phoneNumber: { en: 'Phone Number', bn: 'ফোন নম্বর' },
  password: { en: 'Password', bn: 'পাসওয়ার্ড' },
  demoLogin: { en: 'Demo Login', bn: 'ডেমো লগইন' },
  selectRole: { en: 'Select Your Role', bn: 'আপনার ভূমিকা নির্বাচন করুন' },
  farmer: { en: 'Farmer', bn: 'কৃষক' },
  salonPartner: { en: 'Salon Partner', bn: 'সেলুন পার্টনার' },
  collector: { en: 'Collector', bn: 'সংগ্রাহক' },
  admin: { en: 'Admin', bn: 'অ্যাডমিন' },
  
  // Dashboard
  welcome: { en: 'Welcome', bn: 'স্বাগতম' },
  totalEarnings: { en: 'Total Earnings', bn: 'মোট আয়' },
  earnings: { en: 'Earnings', bn: 'আয়' },
  thisWeek: { en: 'This Week', bn: 'এই সপ্তাহে' },
  thisMonth: { en: 'This Month', bn: 'এই মাসে' },
  logWaste: { en: 'Log Waste', bn: 'বর্জ্য যোগ করুন' },
  weight: { en: 'Weight (Kg)', bn: 'ওজন (কেজি)' },
  date: { en: 'Date', bn: 'তারিখ' },
  uploadPhoto: { en: 'Upload Photo', bn: 'ছবি আপলোড করুন' },
  submit: { en: 'Submit', bn: 'জমা দিন' },
  
  // Store
  fertilizerStore: { en: 'Fertilizer Store', bn: 'সার দোকান' },
  addToCart: { en: 'Add to Cart', bn: 'কার্টে যোগ করুন' },
  cart: { en: 'Cart', bn: 'কার্ট' },
  checkout: { en: 'Checkout', bn: 'চেকআউট' },
  total: { en: 'Total', bn: 'মোট' },
  benefits: { en: 'Benefits', bn: 'সুবিধা' },
  howToUse: { en: 'How to Use', bn: 'ব্যবহার পদ্ধতি' },
  
  // Collector
  pendingPickups: { en: 'Pending Pickups', bn: 'বকেয়া পিকআপ' },
  confirmPickup: { en: 'Confirm Pickup', bn: 'পিকআপ নিশ্চিত করুন' },
  actualWeight: { en: 'Actual Weight Collected', bn: 'সংগৃহীত প্রকৃত ওজন' },
  completed: { en: 'Completed', bn: 'সম্পন্ন' },
  route: { en: 'Route', bn: 'রুট' },
  
  // Analytics
  weeklySupply: { en: 'Weekly Supply', bn: 'সাপ্তাহিক সরবরাহ' },
  incomeGrowth: { en: 'Income Growth', bn: 'আয় বৃদ্ধি' },
  history: { en: 'History', bn: 'ইতিহাস' },
  downloadInvoice: { en: 'Download Invoice', bn: 'চালান ডাউনলোড করুন' },
  
  // Status
  pending: { en: 'Pending', bn: 'বকেয়া' },
  collected: { en: 'Collected', bn: 'সংগৃহীত' },
  success: { en: 'Success', bn: 'সফল' },
  
  // General
  bdt: { en: 'BDT', bn: '৳' },
  kg: { en: 'Kg', bn: 'কেজি' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  save: { en: 'Save', bn: 'সংরক্ষণ করুন' },
  call: { en: 'Call', bn: 'কল করুন' },
  viewAll: { en: 'View All', bn: 'সব দেখুন' },
  
  // App
  appName: { en: 'AMOR', bn: 'আমোর' },
  tagline: { en: 'Circular Economy for a Greener Future', bn: 'সবুজ ভবিষ্যতের জন্য চক্রাকার অর্থনীতি' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
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

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
