import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { LanguageStorage } from './secure-store';

export type SupportedLanguage = 'en' | 'bn' | 'hi';

export interface LocaleInfo {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Common
    'common.home': 'Home',
    'common.login': 'Login',
    'common.register': 'Sign Up',
    'common.logout': 'Logout',
    'common.live': 'Live',
    'common.search': 'Search',
    'common.searchPlaceholder': 'Doctor, clinic, specialty...',
    'common.allLocations': 'All Cities',
    'common.viewAll': 'View All →',
    'common.view': 'View',
    'common.book': 'Book',
    'common.call': 'Call',
    'common.callClinic': 'Call Clinic',
    'common.callLab': 'Call Lab',
    'common.bookTest': 'Book Test',
    'common.comingSoon': 'Coming Soon',
    'common.verified': 'Verified',
    'common.rating': 'Rating',
    'common.reviews': 'Reviews',
    'common.doctors': 'Doctors',
    'common.clinics': 'Clinics',
    'common.labs': 'Labs',
    'common.hospitals': 'Hospitals',
    'common.language': 'Language',
    'common.selectLanguage': 'Select Language',
    'common.developedBy': 'Developed by',
    'common.clearSearch': 'Clear Search',
    'common.resetFilters': 'Reset Filters',
    'common.retry': 'Retry',

    // Role / Navbar Badges
    'nav.patient': 'Patient',
    'nav.doctor': 'Doctor',
    'nav.clinic': 'Clinic',
    'nav.receptionist': 'Receptionist',
    'nav.diagnostic': 'Diagnostic',
    'nav.staff': 'Staff',
    'nav.admin': 'Admin',
    'nav.superAdmin': 'Super Admin',
    'nav.portal': 'Portal',

    // Quick Cards
    'quick.findDoctors': 'Find Doctors',
    'quick.findDoctorsDesc': 'Consult verified specialists',
    'quick.nearbyClinics': 'Nearby Clinics',
    'quick.nearbyClinicsDesc': 'Modern facilities & tokens',
    'quick.diagnosticLabs': 'Diagnostic Labs',
    'quick.diagnosticLabsDesc': 'Pathology tests & scans',
    'quick.multiHospitals': 'Multi Hospitals',
    'quick.multiHospitalsDesc': 'Multi-specialty care',

    // Section Titles
    'section.featuredDoctors': 'Featured Doctors',
    'section.featuredDoctorsSub': 'Top rated & verified specialists',
    'section.allDoctors': 'All Doctors',
    'section.allDoctorsSub': 'Browse doctors across specialties',
    'section.treatments': 'Treatments & Systems',
    'section.treatmentsSub': 'Holistic & specialized healthcare',
    'section.featuredClinics': 'Featured Clinics',
    'section.featuredClinicsSub': 'Modern facilities & live token queues',
    'section.allClinics': 'All Clinics',
    'section.allClinicsSub': 'Complete chamber directory near you',
    'section.labsAndAmbulance': 'Labs & Ambulance',
    'section.ambulance247': '24×7 Ambulance',
    'section.ambulanceSub': 'Rapid emergency response with medical support',
    'section.callAmbulance': 'Call Ambulance',

    // Tabs
    'tab.overview': 'Overview',
    'tab.dashboard': 'Dashboard',
    'tab.appointments': 'Appointments',
    'tab.queue': 'Live Queue',
    'tab.prescriptions': 'Prescriptions',
    'tab.earnings': 'Earnings',
    'tab.reports': 'Reports',
    'tab.settings': 'Settings',
    'tab.profile': 'Profile',
    'tab.users': 'Users',
    'tab.announcements': 'Announcements',
  },

  bn: {
    // Common
    'common.home': 'হোম',
    'common.login': 'লগইন',
    'common.register': 'সাইন আপ',
    'common.logout': 'লগআউট',
    'common.live': 'লাইভ',
    'common.search': 'অনুসন্ধান',
    'common.searchPlaceholder': 'ডাক্তার, ক্লিনিক, বিশেষজ্ঞ...',
    'common.allLocations': 'সব শহর',
    'common.viewAll': 'সব দেখুন →',
    'common.view': 'দেখুন',
    'common.book': 'বুক করুন',
    'common.call': 'কল করুন',
    'common.callClinic': 'ক্লিনিকে কল করুন',
    'common.callLab': 'ল্যাবে কল করুন',
    'common.bookTest': 'টেস্ট বুক করুন',
    'common.comingSoon': 'শীঘ্রই আসছে',
    'common.verified': 'ভেরিফায়েড',
    'common.rating': 'রেটিং',
    'common.reviews': 'রিভিউ',
    'common.doctors': 'ডাক্তার',
    'common.clinics': 'ক্লিনিক',
    'common.labs': 'ল্যাব',
    'common.hospitals': 'হাসপাতাল',
    'common.language': 'ভাষা',
    'common.selectLanguage': 'ভাষা নির্বাচন করুন',
    'common.developedBy': 'ডেভেলপমেন্টে',
    'common.clearSearch': 'ক্লিয়ার করুন',
    'common.resetFilters': 'ফিল্টার রিসেট',
    'common.retry': 'পুনরায় চেষ্টা করুন',

    // Role / Navbar Badges
    'nav.patient': 'পেশেন্ট',
    'nav.doctor': 'ডাক্তার',
    'nav.clinic': 'ক্লিনিক',
    'nav.receptionist': 'রিসিপশনিস্ট',
    'nav.diagnostic': 'ডায়াগনস্টিক',
    'nav.staff': 'ল্যাব স্টাফ',
    'nav.admin': 'অ্যাডমিন',
    'nav.superAdmin': 'সুপার অ্যাডমিন',
    'nav.portal': 'পোর্টাল',

    // Quick Cards
    'quick.findDoctors': 'ডাক্তার খুঁজুন',
    'quick.findDoctorsDesc': 'যাচাইকৃত বিশেষজ্ঞদের পরামর্শ নিন',
    'quick.nearbyClinics': 'কাছের ক্লিনিক',
    'quick.nearbyClinicsDesc': 'আধুনিক চিকিৎসা ও টোকেন',
    'quick.diagnosticLabs': 'ডায়াগনস্টিক ল্যাব',
    'quick.diagnosticLabsDesc': 'প্যাথলজি টেস্ট ও রক্ত পরীক্ষা',
    'quick.multiHospitals': 'মাল্টি হাসপাতাল',
    'quick.multiHospitalsDesc': 'জরুরি ও বিশেষায়িত সেবা',

    // Section Titles
    'section.featuredDoctors': 'সেরা ডাক্তার',
    'section.featuredDoctorsSub': 'সেরা রেটিং ও যাচাইকৃত বিশেষজ্ঞ',
    'section.allDoctors': 'সকল ডাক্তার',
    'section.allDoctorsSub': 'বিশেষজ্ঞতা অনুযায়ী ডাক্তার খুঁজুন',
    'section.treatments': 'চিকিৎসা পদ্ধতি',
    'section.treatmentsSub': 'সামগ্রিক ও বিশেষায়িত স্বাস্থ্যসেবা',
    'section.featuredClinics': 'সেরা ক্লিনিক',
    'section.featuredClinicsSub': 'আধুনিক সুবিধা ও লাইভ টোকেন কিউ',
    'section.allClinics': 'সকল ক্লিনিক',
    'section.allClinicsSub': 'আপনার কাছাকাছি সব চেম্বার ডিরেক্টরি',
    'section.labsAndAmbulance': 'ল্যাব ও অ্যাম্বুলেন্স',
    'section.ambulance247': '২৪×৭ অ্যাম্বুলেন্স',
    'section.ambulanceSub': 'জরুরি অ্যাম্বুলেন্স সেবা ও তাৎক্ষণিক সহায়তা',
    'section.callAmbulance': 'অ্যাম্বুলেন্স কল করুন',

    // Tabs
    'tab.overview': 'ওভারভিউ',
    'tab.dashboard': 'ড্যাশবোর্ড',
    'tab.appointments': 'অ্যাপয়েন্টমেন্ট',
    'tab.queue': 'লাইভ কিউ',
    'tab.prescriptions': 'প্রেসক্রিপশন',
    'tab.earnings': 'উপার্জন',
    'tab.reports': 'রিপোর্ট',
    'tab.settings': 'সেটিংস',
    'tab.profile': 'প্রোফাইল',
    'tab.users': 'ব্যবহারকারী',
    'tab.announcements': 'ঘোষণা',
  },

  hi: {
    // Common
    'common.home': 'होम',
    'common.login': 'लॉगिन',
    'common.register': 'साइन अप',
    'common.logout': 'लॉगआउट',
    'common.live': 'लाइव',
    'common.search': 'खोजें',
    'common.searchPlaceholder': 'डॉक्टर, क्लिनिक, विशेषज्ञता...',
    'common.allLocations': 'सभी शहर',
    'common.viewAll': 'सभी देखें →',
    'common.view': 'देखें',
    'common.book': 'बुक करें',
    'common.call': 'कॉल करें',
    'common.callClinic': 'क्लिनिक को कॉल करें',
    'common.callLab': 'लैब को कॉल करें',
    'common.bookTest': 'टेस्ट बुक करें',
    'common.comingSoon': 'जल्द आ रहा है',
    'common.verified': 'सत्यापित',
    'common.rating': 'रेटिंग',
    'common.reviews': 'समीक्षाएं',
    'common.doctors': 'डॉक्टर',
    'common.clinics': 'क्लिनिक',
    'common.labs': 'लैब्स',
    'common.hospitals': 'अस्पताल',
    'common.language': 'भाषा',
    'common.selectLanguage': 'भाषा चुनें',
    'common.developedBy': 'द्वारा विकसित',
    'common.clearSearch': 'सर्च हटाएं',
    'common.resetFilters': 'फ़िल्टर रीसेट',
    'common.retry': 'पुनः प्रयास करें',

    // Role / Navbar Badges
    'nav.patient': 'मरीज़',
    'nav.doctor': 'डॉक्टर',
    'nav.clinic': 'क्लिनिक',
    'nav.receptionist': 'रिसेप्शनिस्ट',
    'nav.diagnostic': 'डायग्नोस्टिक',
    'nav.staff': 'लैब स्टाफ',
    'nav.admin': 'एडमिन',
    'nav.superAdmin': 'सुपर एडमिन',
    'nav.portal': 'पोर्टल',

    // Quick Cards
    'quick.findDoctors': 'डॉक्टर खोजें',
    'quick.findDoctorsDesc': 'सत्यापित विशेषज्ञों से परामर्श लें',
    'quick.nearbyClinics': 'नज़दीकी क्लिनिक',
    'quick.nearbyClinicsDesc': 'आधुनिक सुविधाएं और टोकन',
    'quick.diagnosticLabs': 'डायग्नोस्टिक लैब्स',
    'quick.diagnosticLabsDesc': 'पैथोलॉजी टेस्ट और स्वास्थ्य जांच',
    'quick.multiHospitals': 'मल्टी अस्पताल',
    'quick.multiHospitalsDesc': 'विशेषज्ञ आपातकालीन देखभाल',

    // Section Titles
    'section.featuredDoctors': 'प्रमुख डॉक्टर',
    'section.featuredDoctorsSub': 'शीर्ष रेटेड एवं सत्यापित डॉक्टर',
    'section.allDoctors': 'सभी डॉक्टर',
    'section.allDoctorsSub': 'विशेषज्ञता अनुसार डॉक्टर खोजें',
    'section.treatments': 'उपचार और प्रणालियाँ',
    'section.treatmentsSub': 'समग्र एवं विशिष्ट स्वास्थ्य सेवा',
    'section.featuredClinics': 'प्रमुख क्लिनिक',
    'section.featuredClinicsSub': 'आधुनिक सुविधाएं और लाइव कतार',
    'section.allClinics': 'सभी क्लिनिक',
    'section.allClinicsSub': 'आपके निकटतम सभी क्लिनिक',
    'section.labsAndAmbulance': 'लैब और एम्बुलेंस',
    'section.ambulance247': '२४×७ एम्बुलेंस',
    'section.ambulanceSub': 'आपातकालीन प्रतिक्रिया और चिकित्सा सहायता',
    'section.callAmbulance': 'एम्बुलेंस को कॉल करें',

    // Tabs
    'tab.overview': 'विवरण',
    'tab.dashboard': 'डैशबोर्ड',
    'tab.appointments': 'अपॉइंटमेंट्स',
    'tab.queue': 'लाइव कतार',
    'tab.prescriptions': 'प्रिस्क्रिप्शन',
    'tab.earnings': 'कमाई',
    'tab.reports': 'रिपोर्ट्स',
    'tab.settings': 'सेटिंग्स',
    'tab.profile': 'प्रोफ़ाइल',
    'tab.users': 'उपयोगकर्ता',
    'tab.announcements': 'सूचनाएं',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  locales: LocaleInfo[];
  currentLocale: LocaleInfo;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await LanguageStorage.getLanguage();
        if (saved && (saved === 'en' || saved === 'bn' || saved === 'hi')) {
          setLanguageState(saved as SupportedLanguage);
        }
      } catch (err) {
        console.warn('Failed to load saved language:', err);
      } finally {
        setIsReady(true);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      await LanguageStorage.setLanguage(newLang);
    } catch (err) {
      console.warn('Failed to persist language choice:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (dict[key]) {
        return dict[key];
      }
      // Fallback to English
      if (TRANSLATIONS.en[key]) {
        return TRANSLATIONS.en[key];
      }
      return fallback || key;
    },
    [language]
  );

  const currentLocale = useMemo(() => {
    return (
      SUPPORTED_LOCALES.find((l) => l.code === language) || SUPPORTED_LOCALES[0]
    );
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      locales: SUPPORTED_LOCALES,
      currentLocale,
      isReady,
    }),
    [language, setLanguage, t, currentLocale, isReady]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a graceful fallback if called outside provider
    return {
      language: 'en',
      setLanguage: async () => {},
      t: (key: string, fallback?: string) => fallback || key,
      locales: SUPPORTED_LOCALES,
      currentLocale: SUPPORTED_LOCALES[0],
      isReady: true,
    };
  }
  return context;
}
