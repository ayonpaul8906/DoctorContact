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
    'common.signIn': 'Sign In',
    'common.logout': 'Logout',
    'common.dashboard': 'Dashboard',
    'auth.dashboard': 'Dashboard',
    'auth.logout': 'Logout',
    'auth.logoutConfirmTitle': 'Sign Out',
    'auth.logoutConfirmMsg': 'Are you sure you want to sign out?',
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
    'common.close': 'Close',
    'common.change': 'Change',
    'common.changeNumber': 'Change Number',
    'common.all': 'All',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.find': 'Find',
    'common.selectLocation': 'Select City / Location',

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

    // Auth
    'auth.patientLogin': 'Patient',
    'auth.staffLogin': 'Clinic / Staff',
    'auth.patientPortal': 'Patient Portal',
    'auth.staffPortal': 'Staff Portal',
    'auth.signInAccount': 'Sign In to Account',
    'auth.selectUserType': 'Select your user type to access your personalized portal.',
    'auth.mobileNumber': 'Mobile Number',
    'auth.enterMobile': '10-digit mobile number',
    'auth.getOtp': 'Get Secure OTP',
    'auth.sendingOtp': 'Sending OTP...',
    'auth.otpSentSecurelyTo': 'OTP sent securely to',
    'auth.enter6DigitOtp': 'Enter 6-digit verification code',
    'auth.verifyLogin': 'Verify & Login',
    'auth.verifying': 'Verifying...',
    'auth.resendOtp': 'Resend OTP',
    'auth.resendOtpIn': 'Resend OTP in',
    'auth.validPhoneRequired': 'Please enter a valid 10-digit mobile number',
    'auth.enterCompleteOtp': 'Please enter complete 6-digit OTP',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.createFreeAccount': 'Create Free Account',
    'auth.createAccount': 'Create Account',
    'auth.newAccountSetup': 'New Account Setup',
    'auth.patientRegistration': 'Patient Account Registration',
    'auth.fullName': 'Full Name',
    'auth.enterFullName': 'e.g. Soumya Chatterjee',
    'auth.verifyAndCreate': 'Verify & Create Account',
    'auth.creatingAccount': 'Creating Account...',
    'auth.emailOrPhone': 'Email or Phone Number',
    'auth.password': 'Password',
    'auth.enterPassword': 'Enter your account password',
    'auth.signInAsStaff': 'Sign In to Staff Portal',
    'auth.backToHome': 'Home',
    'auth.livePortal': 'Live Portal',
    'auth.joinFree': 'Join Free',
    'auth.heroHeadingAuth': 'Fast, reliable care without waiting room stress.',
    'auth.heroDescAuth': 'Book verified specialists, track live token queues in real-time, and manage clinic operations effortlessly.',
    'auth.instantSlotBooking': 'Instant Slot Booking',
    'auth.instantSlotDesc': 'Pick dates & slots online in seconds',
    'auth.liveTokenUpdates': 'Live Token Updates',
    'auth.liveTokenDesc': 'Real-time queue tracking on your phone',

    // Hero Section
    'hero.eyebrow': 'Find the right health services, connect with care',
    'hero.title1': 'Your Health',
    'hero.title2': 'Our Priority',
    'hero.subtitle': 'Find trusted doctors, nearby clinics, book appointments and track live queue tokens — all in one unified ecosystem.',
    'hero.searchPlaceholder': 'Doctor, clinic, specialty...',
    'hero.popularSearches': 'Popular searches',

    // Quick Cards
    'quick.findDoctors': 'Find Doctors',
    'quick.findDoctorsDesc': 'Consult verified specialists',
    'quick.nearbyClinics': 'Nearby Clinics',
    'quick.nearbyClinicsDesc': 'Modern facilities & tokens',
    'quick.diagnosticLabs': 'Diagnostic Labs',
    'quick.diagnosticLabsDesc': 'Pathology tests & scans',
    'quick.multiHospitals': 'Multi Hospitals',
    'quick.multiHospitalsDesc': 'Multi-specialty care',
    'quick.soon': 'SOON',
    'quick.hospitalSoonMsg': 'Multi-Specialty Hospital module is currently in development and launching soon!',

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
    'section.ambulance247': '24×7 Ambulance',
    'section.ambulanceSub': 'Rapid emergency response with medical support',
    'section.callAmbulance': 'Call Ambulance',

    // Treatments
    'treatment.homeopathy': 'Homeopathy',
    'treatment.homeopathyDesc': 'Natural & gentle holistic remedies',
    'treatment.allopathy': 'Allopathy',
    'treatment.allopathyDesc': 'Modern medicine & specialist care',
    'treatment.ayurvedic': 'Ayurvedic',
    'treatment.ayurvedicDesc': 'Ancient herbal & natural healing',
    'treatment.physiotherapy': 'Physiotherapy',
    'treatment.physiotherapyDesc': 'Rehab & muscle recovery therapy',
    'treatment.dentalCare': 'Dental Care',
    'treatment.dentalCareDesc': 'Advanced dentistry & oral health',
    'treatment.eyeCare': 'Eye Care',
    'treatment.eyeCareDesc': 'Vision testing & ophthalmology',
    'treatment.diagnostics': 'Diagnostics',
    'treatment.diagnosticsDesc': 'Pathology blood tests & digital imaging',
    'treatment.mentalWellness': 'Mental Wellness',
    'treatment.mentalWellnessDesc': 'Counseling & psychiatric guidance',
    'treatment.pediatricCare': 'Pediatric Care',
    'treatment.pediatricCareDesc': 'Child healthcare & vaccinations',

    // Doctor & Clinic Directory
    'doctor.yrsExp': 'Yrs Exp',
    'doctor.consultationFee': 'Consultation',
    'doctor.bookAppointment': 'Book Appointment',
    'doctor.fee': 'Fee',
    'doctor.perVisit': '/ visit',
    'doctor.available': 'Available',
    'doctor.liveNow': 'Live Now',
    'doctor.today': 'Today',
    'doctor.allSpecialties': 'All Specialties',
    'doctor.findDoctor': 'Find a Doctor',
    'doctor.findDoctorSub': 'Book an in-clinic consultation with top specialists',
    'doctor.searchPrompt': 'Search doctor name, specialty, clinic...',

    'clinic.chambers': 'Chambers',
    'clinic.doctorsCount': 'Doctors',
    'clinic.viewDoctors': 'View Doctors',
    'clinic.callClinic': 'Call Clinic',
    'clinic.allClinicsHeader': 'All Clinics & Chambers',
    'clinic.allClinicsSub': 'Browse verified chambers and clinics near you',
    'clinic.featuredClinicsSub': 'Top verified clinics and modern healthcare centers',
    'clinic.searchPrompt': 'Search clinic name, city, specialty...',

    'lab.diagnosticLabs': 'Diagnostic Labs & Scans',
    'lab.diagnosticLabsDesc': 'Verified pathology centers, blood tests & diagnostic imaging',
    'lab.homeCollection': 'Home Sample Collection',
    'lab.popularTests': 'Popular Tests & Scans',
    'lab.callLab': 'Call Lab',
    'lab.bookTest': 'Book Test',
    'lab.searchPrompt': 'Search lab name, blood test, city...',

    // Voice Search
    'voice.voiceSearch': 'Voice Search',
    'voice.listening': 'Listening... Speak now',
    'voice.speakPrompt': 'Speak doctor name, specialty, or clinic',
    'voice.trySaying': 'Try saying',
    'voice.tapToSpeak': 'Tap microphone to speak',
    'voice.quickTerms': 'Quick search terms:',

    // Footer
    'footer.developedBySoumyaAyon': 'Developed by Soumya Chatterjee & Ayon Paul',
    'footer.developedBy': 'Developed by',
    'footer.tagline': 'Smart Healthcare & Queue Ecosystem',
    'footer.initiativeBy': 'AN INITIATIVE BY',
    'footer.poweredPlatform': 'POWERED PLATFORM',
    'footer.healthcare': 'Healthcare',
    'footer.taglineDesc': 'Unifying clinics, specialists, diagnostic centers, and real-time patient queues across Bengal.',
    'footer.forPatients': 'For Patients',
    'footer.exploreClinics': 'Explore Clinics',
    'footer.liveQueueTokens': 'Live Queue Tokens',
    'footer.diagnosticTests': 'Diagnostic Tests',
    'footer.forProviders': 'For Providers',
    'footer.doctorPortal': 'Doctor Portal',
    'footer.clinicChamber': 'Clinic Chamber',
    'footer.diagnosticCenter': 'Diagnostic Center',
    'footer.helpdesk': '24/7 Patient Helpdesk',
    'footer.rightsReserved': 'All rights reserved.',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsConditions': 'Terms & Conditions',

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
    'tab.followups': 'Follow-ups',
    'tab.tests': 'My Tests',
    'tab.schedule': 'Schedule',
    'tab.patients': 'Patients',
  },

  bn: {
    // Common
    'common.home': 'হোম',
    'common.login': 'লগইন',
    'common.register': 'সাইন আপ',
    'common.signIn': 'সাইন ইন',
    'common.logout': 'লগআউট',
    'common.dashboard': 'ড্যাশবোর্ড',
    'auth.dashboard': 'ড্যাশবোর্ড',
    'auth.logout': 'লগআউট',
    'auth.logoutConfirmTitle': 'লগআউট করুন',
    'auth.logoutConfirmMsg': 'আপনি কি আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?',
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
    'common.developedBy': 'ডেভেলপ করেছেন',
    'common.clearSearch': 'মুছে ফেলুন',
    'common.resetFilters': 'ফিল্টার রিসেট',
    'common.retry': 'পুনরায় চেষ্টা',
    'common.close': 'বন্ধ করুন',
    'common.change': 'পরিবর্তন',
    'common.changeNumber': 'নম্বর পরিবর্তন',
    'common.all': 'সব',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.back': 'ফিরে যান',
    'common.loading': 'লোড হচ্ছে...',
    'common.find': 'খুঁজুন',
    'common.selectLocation': 'শহর / অবস্থান নির্বাচন করুন',

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

    // Auth
    'auth.patientLogin': 'পেশেন্ট',
    'auth.staffLogin': 'ক্লিনিক / স্টাফ',
    'auth.patientPortal': 'পেশেন্ট পোর্টাল',
    'auth.staffPortal': 'স্টাফ পোর্টাল',
    'auth.signInAccount': 'অ্যাকাউন্টে সাইন ইন করুন',
    'auth.selectUserType': 'আপনার ব্যক্তিগত পোর্টালে প্রবেশ করতে ধরন নির্বাচন করুন।',
    'auth.mobileNumber': 'মোবাইল নম্বর',
    'auth.enterMobile': '১০ সংখ্যার মোবাইল নম্বর',
    'auth.getOtp': 'সুরক্ষিত ওটিপি পান',
    'auth.sendingOtp': 'ওটিপি পাঠানো হচ্ছে...',
    'auth.otpSentSecurelyTo': 'ওটিপি সুরক্ষিতভাবে পাঠানো হয়েছে',
    'auth.enter6DigitOtp': '৬ সংখ্যার ওটিপি কোড লিখুন',
    'auth.verifyLogin': 'যাচাই করে লগইন করুন',
    'auth.verifying': 'যাচাই করা হচ্ছে...',
    'auth.resendOtp': 'পুনরায় ওটিপি পাঠান',
    'auth.resendOtpIn': 'ওটিপি পুনরায় পাঠানো যাবে',
    'auth.validPhoneRequired': 'অনুগ্রহ করে সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন',
    'auth.enterCompleteOtp': 'অনুগ্রহ করে সম্পূর্ণ ৬ সংখ্যার ওটিপি দিন',
    'auth.noAccount': 'অ্যাকাউন্ট নেই?',
    'auth.haveAccount': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'auth.createFreeAccount': 'ফ্রি অ্যাকাউন্ট তৈরি করুন',
    'auth.createAccount': 'অ্যাকাউন্ট তৈরি করুন',
    'auth.newAccountSetup': 'নতুন অ্যাকাউন্ট তৈরি',
    'auth.patientRegistration': 'পেশেন্ট অ্যাকাউন্ট রেজিস্ট্রেশন',
    'auth.fullName': 'পুরো নাম',
    'auth.enterFullName': 'যেমন: সৌম্য চ্যাটার্জি',
    'auth.verifyAndCreate': 'যাচাই করে অ্যাকাউন্ট তৈরি করুন',
    'auth.creatingAccount': 'অ্যাকাউন্ট তৈরি হচ্ছে...',
    'auth.emailOrPhone': 'ইমেল বা ফোন নম্বর',
    'auth.password': 'পাসওয়ার্ড',
    'auth.enterPassword': 'আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন',
    'auth.signInAsStaff': 'স্টাফ পোর্টালে সাইন ইন করুন',
    'auth.backToHome': 'হোম',
    'auth.livePortal': 'লাইভ পোর্টাল',
    'auth.joinFree': 'যোগ দিন',
    'auth.heroHeadingAuth': 'অপেক্ষা করার ঝামেলা ছাড়া দ্রুত ও বিশ্বস্ত স্বাস্থ্যসেবা।',
    'auth.heroDescAuth': 'যাচাইকৃত ডাক্তার বুক করুন, রিয়েল টাইমে লাইভ টোকেন ট্র্যাক করুন এবং সহজেই চিকিৎসা নিন।',
    'auth.instantSlotBooking': 'সহজেই অনলাইন স্লট বুকিং',
    'auth.instantSlotDesc': 'কয়েক সেকেন্ডে ডাক্তারের স্লট বুক করুন',
    'auth.liveTokenUpdates': 'লাইভ টোকেন আপডেট',
    'auth.liveTokenDesc': 'মোবাইলেই রিয়েল-টাইম কিউ ট্র্যাকিং',

    // Hero Section
    'hero.eyebrow': 'সঠিক স্বাস্থ্যসেবা খুঁজুন, যত্ন সহকারে যুক্ত হোন',
    'hero.title1': 'আপনার স্বাস্থ্য',
    'hero.title2': 'আমাদের অগ্রাধিকার',
    'hero.subtitle': 'ভরোসাযোগ্য ডাক্তার ও নিকটস্থ ক্লিনিক খুঁজুন, অ্যাপয়েন্টমেন্ট বুক করুন এবং লাইভ টোকেন কিউ ট্র্যাক করুন - সব এক সাথে।',
    'hero.searchPlaceholder': 'ডাক্তার, ক্লিনিক, বিশেষজ্ঞ...',
    'hero.popularSearches': 'জনপ্রিয় অনুসন্ধান',

    // Quick Cards
    'quick.findDoctors': 'ডাক্তার খুঁজুন',
    'quick.findDoctorsDesc': 'যাচাইকৃত বিশেষজ্ঞদের পরামর্শ নিন',
    'quick.nearbyClinics': 'কাছের ক্লিনিক',
    'quick.nearbyClinicsDesc': 'আধুনিক ক্লিনিক ও লাইভ টোকেন',
    'quick.diagnosticLabs': 'ডায়াগনস্টিক ল্যাব',
    'quick.diagnosticLabsDesc': 'প্যাথলজি টেস্ট ও রক্ত পরীক্ষা',
    'quick.multiHospitals': 'মাল্টি হসপিটাল',
    'quick.multiHospitalsDesc': 'মাল্টি-স্পেশালিটি স্বাস্থ্যসেবা',
    'quick.soon': 'শীঘ্রই',
    'quick.hospitalSoonMsg': 'মাল্টি-স্পেশালিটি হাসপাতাল মডিউলটি প্রক্রিয়াধীন এবং খুব শীঘ্রই চালু হচ্ছে!',

    // Section Titles
    'section.featuredDoctors': 'বিশেষজ্ঞ ডাক্তার',
    'section.featuredDoctorsSub': 'শীর্ষস্থানীয় ও যাচাইকৃত বিশেষজ্ঞ ডাক্তার',
    'section.allDoctors': 'সকল ডাক্তার',
    'section.allDoctorsSub': 'বিভিন্ন বিভাগের ডাক্তারদের তালিকা দেখুন',
    'section.treatments': 'চিকিৎসা ও পদ্ধতি',
    'section.treatmentsSub': 'সামগ্রিক ও বিশেষায়িত স্বাস্থ্যসেবা',
    'section.featuredClinics': 'বিশেষায়িত ক্লিনিক',
    'section.featuredClinicsSub': 'আধুনিক ব্যবস্থা ও লাইভ টোকেন কিউ',
    'section.allClinics': 'সকল ক্লিনিক',
    'section.allClinicsSub': 'আপনার এলাকার সম্পূর্ণ চেম্বার ডিরেক্টরি',
    'section.ambulance247': '২৪×৭ অ্যাম্বুলেন্স',
    'section.ambulanceSub': 'দ্রুত জরুরি অ্যাম্বুলেন্স পরিষেবা ও প্রাথমিক চিকিৎসা',
    'section.callAmbulance': 'অ্যাম্বুলেন্স ডাকুন',

    // Treatments
    'treatment.homeopathy': 'হোমিওপ্যাথি',
    'treatment.homeopathyDesc': 'প্রাকৃতিক ও নিরাপদ পার্শ্বপ্রতিক্রিয়াহীন চিকিৎসা',
    'treatment.allopathy': 'অ্যালোপ্যাথি',
    'treatment.allopathyDesc': 'আধুনিক চিকিৎসা ও বিশেষজ্ঞ যত্ন',
    'treatment.ayurvedic': 'আয়ুর্বেদিক',
    'treatment.ayurvedicDesc': 'প্রাচীন ভেষজ ও প্রাকৃতিক নিরাময় পদ্ধতি',
    'treatment.physiotherapy': 'ফিজিওথেরাপি',
    'treatment.physiotherapyDesc': 'পেশি পুনরুদ্ধার ও শারীরিক পুনর্বাসন চিকিৎসা',
    'treatment.dentalCare': 'দাঁতের চিকিৎসা',
    'treatment.dentalCareDesc': 'উন্নত ডেন্টাল ও মুখের স্বাস্থ্যসেবা',
    'treatment.eyeCare': 'চোখের যত্ন',
    'treatment.eyeCareDesc': 'দৃষ্টি পরীক্ষা ও আধুনিক চক্ষু চিকিৎসা',
    'treatment.diagnostics': 'ডায়াগনস্টিকস',
    'treatment.diagnosticsDesc': 'রক্ত পরীক্ষা ও ডিজিটাল ইমেজিং',
    'treatment.mentalWellness': 'মানসিক স্বাস্থ্য',
    'treatment.mentalWellnessDesc': 'কাউন্সেলিং ও মনস্তাত্ত্বিক পরামর্শ',
    'treatment.pediatricCare': 'শিশু চিকিৎসা',
    'treatment.pediatricCareDesc': 'শিশুর স্বাস্থ্যসেবা ও সঠিক টিকাদান',

    // Doctor & Clinic Directory
    'doctor.yrsExp': 'বছরের অভিজ্ঞতা',
    'doctor.consultationFee': 'পরামর্শ ফি',
    'doctor.bookAppointment': 'বুক করুন',
    'doctor.fee': 'ফি',
    'doctor.perVisit': '/ ভিজিট',
    'doctor.available': 'উপলব্ধ',
    'doctor.liveNow': 'এখন লাইভ',
    'doctor.today': 'আজ',
    'doctor.allSpecialties': 'সকল বিভাগ',
    'doctor.findDoctor': 'ডাক্তার খুঁজুন',
    'doctor.findDoctorSub': 'শীর্ষ বিশেষজ্ঞদের সাথে ক্লিনিক অ্যাপয়েন্টমেন্ট বুক করুন',
    'doctor.searchPrompt': 'ডাক্তারের নাম, বিভাগ বা ক্লিনিক দিয়ে খুঁজুন...',

    'clinic.chambers': 'চেম্বার',
    'clinic.doctorsCount': 'জন ডাক্তার',
    'clinic.viewDoctors': 'ডাক্তারদের দেখুন',
    'clinic.callClinic': 'ক্লিনিকে কল করুন',
    'clinic.allClinicsHeader': 'সকল ক্লিনিক ও চেম্বার',
    'clinic.allClinicsSub': 'আপনার এলাকার সকল যাচাইকৃত ক্লিনিক দেখুন',
    'clinic.featuredClinicsSub': 'আধুনিক সুযোগ-সুবিধা ও উন্নত স্বাস্থ্যকেন্দ্র',
    'clinic.searchPrompt': 'ক্লিনিকের নাম, শহর, বিভাগ অনুসন্ধান করুন...',

    'lab.diagnosticLabs': 'ডায়াগনস্টিক ল্যাব ও টেস্ট',
    'lab.diagnosticLabsDesc': 'যাচাইকৃত প্যাথলজি কেন্দ্র, রক্ত পরীক্ষা ও স্ক্যান',
    'lab.homeCollection': 'বাড়ি থেকে স্যাম্পল সংগ্রহ',
    'lab.popularTests': 'জনপ্রিয় টেস্ট ও স্ক্যান',
    'lab.callLab': 'ল্যাবে কল করুন',
    'lab.bookTest': 'টেস্ট বুক করুন',
    'lab.searchPrompt': 'ল্যাবের নাম, রক্তের পরীক্ষা, শহর অনুসন্ধান করুন...',

    // Voice Search
    'voice.voiceSearch': 'ভয়েস সার্চ',
    'voice.listening': 'শুনছি... কথা বলুন',
    'voice.speakPrompt': 'ডাক্তারের নাম, বিভাগ বা ক্লিনিক বলুন',
    'voice.trySaying': 'যেমন বলতে পারেন',
    'voice.tapToSpeak': 'কথা বলতে মাইকে চাপ দিন',
    'voice.quickTerms': 'দ্রুত অনুসন্ধানের পদ:',

    // Footer
    'footer.developedBySoumyaAyon': 'সৌজন্যে: সৌম্য চ্যাটার্জি এবং অয়ন পাল',
    'footer.developedBy': 'উন্নয়নে',
    'footer.tagline': 'স্মার্ট স্বাস্থ্যসেবা ও আধুনিক কিউ ইকোসিস্টেম',
    'footer.initiativeBy': 'একটি উদ্যোগ',
    'footer.poweredPlatform': 'চালিত প্ল্যাটফর্ম',
    'footer.healthcare': 'স্বাস্থ্যসেবা',
    'footer.taglineDesc': 'সমগ্র বাংলা জুড়ে ক্লিনিক, বিশেষজ্ঞ, ডায়াগনস্টিক সেন্টার এবং রিয়েল-টাইম লাইভ টোকেন কিউ একত্রীকরণ।',
    'footer.forPatients': 'রোগীদের জন্য',
    'footer.exploreClinics': 'ক্লিনিক খুঁজুন',
    'footer.liveQueueTokens': 'লাইভ কিউ টোকেন',
    'footer.diagnosticTests': 'ডায়াগনস্টিক টেস্ট',
    'footer.forProviders': 'স্বাস্থ্যসেবা প্রদানকারীদের জন্য',
    'footer.doctorPortal': 'ডাক্তার পোর্টাল',
    'footer.clinicChamber': 'ক্লিনিক চেম্বার',
    'footer.diagnosticCenter': 'ডায়াগনস্টিক সেন্টার',
    'footer.helpdesk': '২৪/৭ রোগী সহায়তা কেন্দ্র',
    'footer.rightsReserved': 'সর্বস্বত্ব সংরক্ষিত।',
    'footer.privacyPolicy': 'গোপনীয়তা নীতি',
    'footer.termsConditions': 'শর্তাবলী ও নিয়মাবলী',

    // Tabs
    'tab.overview': 'সংক্ষেপ',
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
    'tab.followups': 'ফলো-আপ',
    'tab.tests': 'আমার টেস্ট',
    'tab.schedule': 'সময়সূচী',
    'tab.patients': 'রোগীবৃন্দ',
  },

  hi: {
    // Common
    'common.home': 'होम',
    'common.login': 'लॉगिन',
    'common.register': 'साइन अप',
    'common.signIn': 'साइन इन',
    'common.logout': 'लॉगआउट',
    'common.dashboard': 'डैशबोर्ड',
    'auth.dashboard': 'डैशबोर्ड',
    'auth.logout': 'लॉगआउट',
    'auth.logoutConfirmTitle': 'लॉग आउट',
    'auth.logoutConfirmMsg': 'क्या आप अपने खाते से लॉग आउट करना चाहते हैं?',
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
    'common.clearSearch': 'साफ़ करें',
    'common.resetFilters': 'फ़िल्टर रीसेट',
    'common.retry': 'पुनः प्रयास करें',
    'common.close': 'बंद करें',
    'common.change': 'बदलें',
    'common.changeNumber': 'नंबर बदलें',
    'common.all': 'सभी',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.back': 'वापस जाएं',
    'common.loading': 'लोड हो रहा है...',
    'common.find': 'खोजें',
    'common.selectLocation': 'शहर / स्थान चुनें',

    // Role / Navbar Badges
    'nav.patient': 'मरीज़',
    'nav.doctor': 'डॉक्टर',
    'nav.clinic': 'क्लिनिक',
    'nav.receptionist': 'रिसेप्शनिस्ट',
    'nav.diagnostic': 'डायग्नोस्टिक',
    'nav.staff': 'स्टाफ',
    'nav.admin': 'व्यवस्थापक',
    'nav.superAdmin': 'सुपर व्यवस्थापक',
    'nav.portal': 'पोर्टल',

    // Auth
    'auth.patientLogin': 'मरीज़',
    'auth.staffLogin': 'क्लिनिक / स्टाफ',
    'auth.patientPortal': 'मरीज़ पोर्टल',
    'auth.staffPortal': 'स्टाफ पोर्टल',
    'auth.signInAccount': 'खाते में साइन इन करें',
    'auth.selectUserType': 'अपने व्यक्तिगत पोर्टल तक पहुंचने के लिए प्रकार चुनें।',
    'auth.mobileNumber': 'मोबाइल नंबर',
    'auth.enterMobile': '10-अंकीय मोबाइल नंबर',
    'auth.getOtp': 'सुरक्षित ओटीपी प्राप्त करें',
    'auth.sendingOtp': 'ओटीपी भेजा जा रहा है...',
    'auth.otpSentSecurelyTo': 'ओटीपी सुरक्षित रूप से भेजा गया',
    'auth.enter6DigitOtp': '6-अंकीय सत्यापन कोड दर्ज करें',
    'auth.verifyLogin': 'सत्यापित करें और लॉगिन करें',
    'auth.verifying': 'सत्यापित किया जा रहा है...',
    'auth.resendOtp': 'ओटीपी पुनः भेजें',
    'auth.resendOtpIn': 'ओटीपी पुनः भेजें',
    'auth.validPhoneRequired': 'कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें',
    'auth.enterCompleteOtp': 'कृपया पूरा 6-अंकीय ओटीपी दर्ज करें',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.haveAccount': 'पहले से खाता है?',
    'auth.createFreeAccount': 'मुफ़्त खाता बनाएं',
    'auth.createAccount': 'खाता बनाएं',
    'auth.newAccountSetup': 'नया खाता सेटअप',
    'auth.patientRegistration': 'मरीज़ खाता पंजीकरण',
    'auth.fullName': 'पूरा नाम',
    'auth.enterFullName': 'उदा. राहुल शर्मा',
    'auth.verifyAndCreate': 'सत्यापित करें और खाता बनाएं',
    'auth.creatingAccount': 'खाता बनाया जा रहा है...',
    'auth.emailOrPhone': 'ईमेल या फोन नंबर',
    'auth.password': 'पासवर्ड',
    'auth.enterPassword': 'अपना खाता पासवर्ड दर्ज करें',
    'auth.signInAsStaff': 'स्टाफ पोर्टल में साइन इन करें',
    'auth.backToHome': 'होम',
    'auth.livePortal': 'लाइव पोर्टल',
    'auth.joinFree': 'मुफ़्त जुड़ें',
    'auth.heroHeadingAuth': 'प्रतीक्षा कक्ष के तनाव के बिना तेज़ और विश्वसनीय स्वास्थ्य सेवा।',
    'auth.heroDescAuth': 'सत्यापित विशेषज्ञों को बुक करें, रीयल-टाइम में लाइव टोकन ट्रैक करें और क्लिनिक सेवाओं का प्रबंधन करें।',
    'auth.instantSlotBooking': 'त्वरित स्लॉट बुकिंग',
    'auth.instantSlotDesc': 'सेकंडों में ऑनलाइन तिथियां और स्लॉट चुनें',
    'auth.liveTokenUpdates': 'लाइव टोकन अपडेट',
    'auth.liveTokenDesc': 'अपने फोन पर रीयल-टाइम कतार ट्रैकिंग',

    // Hero Section
    'hero.eyebrow': 'सही स्वास्थ्य सेवाएं खोजें, बेहतर देखभाल से जुड़ें',
    'hero.title1': 'आपका स्वास्थ्य',
    'hero.title2': 'हमारी प्राथमिकता',
    'hero.subtitle': 'विश्वसनीय डॉक्टर और नजदीकी क्लिनिक खोजें, अपॉइंटमेंट बुक करें और लाइव टोकन ट्रैक करें - सब एक ही मंच पर।',
    'hero.searchPlaceholder': 'डॉक्टर, क्लिनिक, विशेषज्ञता...',
    'hero.popularSearches': 'लोकप्रिय खोजें',

    // Quick Cards
    'quick.findDoctors': 'डॉक्टर खोजें',
    'quick.findDoctorsDesc': 'सत्यापित विशेषज्ञों से परामर्श लें',
    'quick.nearbyClinics': 'नजदीकी क्लिनिक',
    'quick.nearbyClinicsDesc': 'आधुनिक सुविधाएं और लाइव टोकन',
    'quick.diagnosticLabs': 'डायग्नोस्टिक लैब',
    'quick.diagnosticLabsDesc': 'पैथोलॉजी टेस्ट और स्कैन',
    'quick.multiHospitals': 'मल्टी हॉस्पिटल',
    'quick.multiHospitalsDesc': 'मल्टी-स्पेशियलिटी देखभाल',
    'quick.soon': 'जल्द',
    'quick.hospitalSoonMsg': 'मल्टी-स्पेशियलिटी अस्पताल मॉड्यूल वर्तमान में विकासाधीन है और जल्द ही लॉन्च हो रहा है!',

    // Section Titles
    'section.featuredDoctors': 'प्रमुख डॉक्टर',
    'section.featuredDoctorsSub': 'शीर्ष रेटेड और सत्यापित विशेषज्ञ',
    'section.allDoctors': 'सभी डॉक्टर',
    'section.allDoctorsSub': 'विभिन्न विशेषताओं में डॉक्टरों को ब्राउज़ करें',
    'section.treatments': 'उपचार और प्रणालियाँ',
    'section.treatmentsSub': 'समग्र और विशेष स्वास्थ्य सेवा',
    'section.featuredClinics': 'प्रमुख क्लिनिक',
    'section.featuredClinicsSub': 'आधुनिक सुविधाएं और लाइव टोकन कतार',
    'section.allClinics': 'सभी क्लिनिक',
    'section.allClinicsSub': 'आपके नजदीकी सभी क्लिनिकों की सूची',
    'section.ambulance247': '24×7 एम्बुलेंस',
    'section.ambulanceSub': 'चिकित्सा सहायता के साथ त्वरित आपातकालीन प्रतिक्रिया',
    'section.callAmbulance': 'एम्बुलेंस को कॉल करें',

    // Treatments
    'treatment.homeopathy': 'होम्योपैथी',
    'treatment.homeopathyDesc': 'प्राकृतिक और सुरक्षित समग्र उपचार',
    'treatment.allopathy': 'एलोपैथी',
    'treatment.allopathyDesc': 'आधुनिक चिकित्सा और विशेषज्ञ देखभाल',
    'treatment.ayurvedic': 'आयुर्वेदिक',
    'treatment.ayurvedicDesc': 'प्राचीन जड़ी-बूटी और प्राकृतिक उपचार',
    'treatment.physiotherapy': 'फिजियोथेरेपी',
    'treatment.physiotherapyDesc': 'पुनर्वास और मांसपेशियों की रिकवरी थेरेपी',
    'treatment.dentalCare': 'दंत चिकित्सा',
    'treatment.dentalCareDesc': 'उन्नत दंत चिकित्सा और मौखिक स्वास्थ्य',
    'treatment.eyeCare': 'नेत्र देखभाल',
    'treatment.eyeCareDesc': 'दृष्टि परीक्षण और नेत्र विज्ञान',
    'treatment.diagnostics': 'डायग्नोस्टिक्स',
    'treatment.diagnosticsDesc': 'पैथोलॉजी रक्त परीक्षण और डिजिटल इमेजिंग',
    'treatment.mentalWellness': 'मानसिक स्वास्थ्य',
    'treatment.mentalWellnessDesc': 'परामर्श और मनोरोग मार्गदर्शन',
    'treatment.pediatricCare': 'बाल चिकित्सा',
    'treatment.pediatricCareDesc': 'बाल स्वास्थ्य सेवा और टीकाकरण',

    // Doctor & Clinic Directory
    'doctor.yrsExp': 'वर्षों का अनुभव',
    'doctor.consultationFee': 'परामर्श शुल्क',
    'doctor.bookAppointment': 'बुक करें',
    'doctor.fee': 'शुल्क',
    'doctor.perVisit': '/ परामर्श',
    'doctor.available': 'उपलब्ध',
    'doctor.liveNow': 'लाइव अभी',
    'doctor.today': 'आज',
    'doctor.allSpecialties': 'सभी विशेषताएँ',
    'doctor.findDoctor': 'डॉक्टर खोजें',
    'doctor.findDoctorSub': 'शीर्ष विशेषज्ञों के साथ क्लिनिक अपॉइंटमेंट बुक करें',
    'doctor.searchPrompt': 'डॉक्टर का नाम, विशेषज्ञता या क्लिनिक खोजें...',

    'clinic.chambers': 'चैंबर',
    'clinic.doctorsCount': 'डॉक्टर',
    'clinic.viewDoctors': 'डॉक्टर देखें',
    'clinic.callClinic': 'क्लिनिक को कॉल करें',
    'clinic.allClinicsHeader': 'सभी क्लिनिक और चैंबर',
    'clinic.allClinicsSub': 'अपने नजदीकी सभी सत्यापित क्लिनिक देखें',
    'clinic.featuredClinicsSub': 'शीर्ष सत्यापित क्लिनिक और आधुनिक स्वास्थ्य केंद्र',
    'clinic.searchPrompt': 'क्लिनिक का नाम, शहर, विशेषता खोजें...',

    'lab.diagnosticLabs': 'डायग्नोस्टिक लैब और स्कैन',
    'lab.diagnosticLabsDesc': 'सत्यापित पैथोलॉजी केंद्र, रक्त परीक्षण और इमेजिंग',
    'lab.homeCollection': 'घर से सैंपल संग्रह',
    'lab.popularTests': 'लोकप्रिय परीक्षण और स्कैन',
    'lab.callLab': 'लैब को कॉल करें',
    'lab.bookTest': 'टेस्ट बुक करें',
    'lab.searchPrompt': 'लैब का नाम, रक्त परीक्षण, शहर खोजें...',

    // Voice Search
    'voice.voiceSearch': 'आवाज़ से खोजें',
    'voice.listening': 'सुन रहा हूँ... बोलिए',
    'voice.speakPrompt': 'डॉक्टर का नाम, विशेषज्ञता या क्लিনिक बोलें',
    'voice.trySaying': 'बोलकर देखें',
    'voice.tapToSpeak': 'बोलने के लिए माइक पर टैप करें',
    'voice.quickTerms': 'त्वरित खोज शब्द:',

    // Footer
    'footer.developedBySoumyaAyon': 'सौम्य चटर्जी और अयन पॉल द्वारा विकसित',
    'footer.developedBy': 'विकासकर्ता',
    'footer.tagline': 'स्मार्ट हेल्थकेयर और आधुनिक कतार पारिस्थितिकी तंत्र',
    'footer.initiativeBy': 'एक पहल',
    'footer.poweredPlatform': 'संचालित प्लेटफॉर्म',
    'footer.healthcare': 'स्वास्थ्य सेवा',
    'footer.taglineDesc': 'पूरे बंगाल में क्लिनिक, विशेषज्ञ, डायग्नोस्टिक सेंटर और रीयल-टाइम लाइव कतार टोकन का एकीकरण।',
    'footer.forPatients': 'मरीजों के लिए',
    'footer.exploreClinics': 'क्लिनिक खोजें',
    'footer.liveQueueTokens': 'लाइव कतार टोकन',
    'footer.diagnosticTests': 'डायग्नोस्टिक टेस्ट',
    'footer.forProviders': 'चिकित्सा प्रदाताओं के लिए',
    'footer.doctorPortal': 'डॉक्टर पोर्टल',
    'footer.clinicChamber': 'क्लिनिक चैंबर',
    'footer.diagnosticCenter': 'डायग्नोस्टिक सेंटर',
    'footer.helpdesk': '२४/७ मरीज सहायता केंद्र',
    'footer.rightsReserved': 'सर्वाधिकार सुरक्षित।',
    'footer.privacyPolicy': 'गोपनीयता नीति',
    'footer.termsConditions': 'नियम और शर्तें',

    // Tabs
    'tab.overview': 'अवलोकन',
    'tab.dashboard': 'डैशबोर्ड',
    'tab.appointments': 'अपॉइंटमेंट्स',
    'tab.queue': 'लाइव कतार',
    'tab.prescriptions': 'पर्चे',
    'tab.earnings': 'कमाई',
    'tab.reports': 'रिपोर्ट्स',
    'tab.settings': 'सेटिंग्स',
    'tab.profile': 'प्रोफ़ाइल',
    'tab.users': 'उपयोगकर्ता',
    'tab.announcements': 'घोषणाएं',
    'tab.followups': 'फॉलो-अप',
    'tab.tests': 'मेरे टेस्ट',
    'tab.schedule': 'समय सारिणी',
    'tab.patients': 'मरीज़',
  },
};

// Direct English-to-Key mapping for seamless string translation fallback
const PHRASE_TO_KEY_MAP: Record<string, string> = {
  'Your Health': 'hero.title1',
  'Our Priority': 'hero.title2',
  'Find the right health services, connect with care': 'hero.eyebrow',
  'Find Doctors': 'quick.findDoctors',
  'Consult verified specialists': 'quick.findDoctorsDesc',
  'Nearby Clinics': 'quick.nearbyClinics',
  'Explore Nearby Clinics': 'quick.nearbyClinics',
  'Modern facilities & tokens': 'quick.nearbyClinicsDesc',
  'Diagnostic Labs': 'quick.diagnosticLabs',
  'Pathology tests & scans': 'quick.diagnosticLabsDesc',
  'Multi Hospitals': 'quick.multiHospitals',
  'Multi-specialty care': 'quick.multiHospitalsDesc',
  'SOON': 'quick.soon',
  'Coming Soon': 'common.comingSoon',
  'Featured Doctors': 'section.featuredDoctors',
  'Top rated & verified specialists': 'section.featuredDoctorsSub',
  'All Doctors': 'section.allDoctors',
  'Browse doctors across specialties': 'section.allDoctorsSub',
  'Treatments & Systems': 'section.treatments',
  'Holistic & specialized healthcare': 'section.treatmentsSub',
  'Featured Clinics': 'section.featuredClinics',
  'Modern facilities & live token queues': 'section.featuredClinicsSub',
  'All Clinics': 'section.allClinics',
  'Complete chamber directory near you': 'section.allClinicsSub',
  'All Clinics & Chambers': 'clinic.allClinicsHeader',
  '24×7 Ambulance': 'section.ambulance247',
  'Rapid emergency response with medical support': 'section.ambulanceSub',
  'Call Ambulance': 'section.callAmbulance',
  'Homeopathy': 'treatment.homeopathy',
  'Ayurvedic': 'treatment.ayurvedic',
  'Physiotherapy': 'treatment.physiotherapy',
  'Dental Care': 'treatment.dentalCare',
  'Eye Care': 'treatment.eyeCare',
  'Diagnostics': 'treatment.diagnostics',
  'Mental Wellness': 'treatment.mentalWellness',
  'Pediatric Care': 'treatment.pediatricCare',
  'Login': 'common.login',
  'Sign Up': 'common.register',
  'Sign In': 'common.signIn',
  'View All': 'common.viewAll',
  'View All →': 'common.viewAll',
  'Live': 'common.live',
  'Search': 'common.search',
  'All Cities': 'common.allLocations',
  'Doctor, clinic, specialty...': 'common.searchPlaceholder',
  'Popular searches': 'hero.popularSearches',
  'Cardiologist': 'hero.popularSearches',
  'Yrs Exp': 'doctor.yrsExp',
  'Consultation': 'doctor.consultationFee',
  'Book Appointment': 'doctor.bookAppointment',
  'Book': 'common.book',
  'Call': 'common.call',
  'Call Clinic': 'common.callClinic',
  'Call Lab': 'common.callLab',
  'Book Test': 'common.bookTest',
  'Verified': 'common.verified',
  'Home Sample Collection': 'lab.homeCollection',
  'Diagnostic Labs & Scans': 'lab.diagnosticLabs',
  'Patient': 'nav.patient',
  'Doctor': 'nav.doctor',
  'Clinic': 'nav.clinic',
  'Receptionist': 'nav.receptionist',
  'Staff': 'nav.staff',
  'Admin': 'nav.admin',
  'Super Admin': 'nav.superAdmin',
  'Home': 'common.home',
  'Change': 'common.change',
  'Change Number': 'common.changeNumber',
  'Mobile Number': 'auth.mobileNumber',
  'Get Secure OTP': 'auth.getOtp',
  'Verify & Login': 'auth.verifyLogin',
  'Resend OTP': 'auth.resendOtp',
  'Full Name': 'auth.fullName',
  'Verify & Create Account': 'auth.verifyAndCreate',
  'Allopathy': 'treatment.allopathy',
  'Modern medicine': 'treatment.allopathyDesc',
  'Ayurveda': 'treatment.ayurvedic',
  'Natural balance': 'treatment.ayurvedicDesc',
  'Gentle healing': 'treatment.homeopathyDesc',
  'For Patients': 'footer.forPatients',
  'For Providers': 'footer.forProviders',
  'Explore Clinics': 'footer.exploreClinics',
  'Live Queue Tokens': 'footer.liveQueueTokens',
  'Diagnostic Tests': 'footer.diagnosticTests',
  'Doctor Portal': 'footer.doctorPortal',
  'Clinic Chamber': 'footer.clinicChamber',
  'Diagnostic Center': 'footer.diagnosticCenter',
  '24/7 Patient Helpdesk': 'footer.helpdesk',
  'AN INITIATIVE BY': 'footer.initiativeBy',
  'POWERED PLATFORM': 'footer.poweredPlatform',
  'Healthcare': 'footer.healthcare',
  'Select City / Location': 'common.selectLocation',
  'Voice Search': 'voice.voiceSearch',
  'Listening... Speak now': 'voice.listening',
  'Quick search terms:': 'voice.quickTerms',
  'Tap the mic to restart, or choose a suggestion:': 'voice.tapToSpeak',
  'Book Lab Test': 'common.bookTest',
  'View Doctors': 'clinic.viewDoctors',
  'Reset Filters': 'common.resetFilters',
  'Clear Search': 'common.clearSearch',
  'Retry': 'common.retry',
  'Live Now': 'doctor.liveNow',
  'Available Today': 'doctor.today',
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (keyOrPhrase: string, fallback?: string) => string;
  locales: LocaleInfo[];
  currentLocale: LocaleInfo;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

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
    (keyOrPhrase: string, fallback?: string): string => {
      if (!keyOrPhrase) return fallback || '';

      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;

      // 1. Direct dictionary key match
      if (dict[keyOrPhrase]) {
        return dict[keyOrPhrase];
      }

      // 2. Phrase-to-key match
      const mappedKey = PHRASE_TO_KEY_MAP[keyOrPhrase] || PHRASE_TO_KEY_MAP[keyOrPhrase.trim()];
      if (mappedKey && dict[mappedKey]) {
        return dict[mappedKey];
      }

      // 3. Fallback to English dictionary
      if (TRANSLATIONS.en[keyOrPhrase]) {
        return TRANSLATIONS.en[keyOrPhrase];
      }
      if (mappedKey && TRANSLATIONS.en[mappedKey]) {
        return TRANSLATIONS.en[mappedKey];
      }

      return fallback || keyOrPhrase;
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
    return {
      language: 'en',
      setLanguage: async () => {},
      t: (keyOrPhrase: string, fallback?: string) => fallback || keyOrPhrase,
      locales: SUPPORTED_LOCALES,
      currentLocale: SUPPORTED_LOCALES[0],
      isReady: true,
    };
  }
  return context;
}
