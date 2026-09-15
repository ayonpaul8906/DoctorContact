import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Linking,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { Icon } from '../../components/Icon';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import {
  usePublicFeaturedDoctors,
  usePublicAllDoctors,
  usePublicFeaturedClinics,
  usePublicAllClinics,
  type PublicDoctor,
  type PublicClinic,
} from '../../hooks/usePublicDirectory';
import {
  useSearchLocations,
  type SearchLocation,
  FALLBACK_LOCATIONS,
} from '../../hooks/useSearchLocations';

const { width } = Dimensions.get('window');
const CLINIC_PHONE = '+919777777777';
const CLINIC_WHATSAPP = '919777777777';
const SUPPORT_EMAIL = 'support@doctorcontact.com';

const LOCATIONS = ['All Cities', 'Dubrajpur', 'Suri', 'Bolpur', 'Rampurhat', 'Kolkata'];
const POPULAR_SEARCHES = ['Cardiologist', 'Skin clinic', 'Pediatrician', 'Diabetes', 'Orthopedic'];
const VOICE_COMMAND_HINTS = [
  'Cardiologist',
  'Pediatrician',
  'Dermatologist',
  'Neurologist',
  'Dubrajpur Clinic',
  'Dr. Sourav Ganguly',
  'Eye specialist',
  'General Physician',
];

const TREATMENT_LOCAL_IMAGES = {
  homeopathy: require('../../assets/home/treatment-homeopathy.jpg'),
  allopathy: require('../../assets/home/treatment-allopathy.jpg'),
  ayurveda: require('../../assets/home/treatment-ayurveda.jpg'),
};

const EMERGENCY_LOCAL_IMAGES = {
  labs: require('../../assets/home/labs-tubes.jpg'),
  ambulance: require('../../assets/home/ambulance.jpg'),
};

const LOCAL_DOCTOR_PHOTOS: Record<string, any> = {
  doc1: require('../../assets/home/doc1.jpg'),
  doc3: require('../../assets/home/doc3.jpg'),
  doc4: require('../../assets/home/doc4.jpg'),
  hero: require('../../assets/home/hero-doctor.jpg'),
};

function getDoctorInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getClinicInitials(name?: string) {
  if (!name) return 'CL';
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Resolves doctor avatar URL from Cloudinary / backend.
 * Checks profilePhoto, user.avatar, or image properties.
 * If faceCrop is enabled and it's a Cloudinary URL, applies AI face detection and smart zoom!
 */
function getDoctorAvatarUrl(
  doc: PublicDoctor,
  options?: { faceCrop?: boolean; width?: number; height?: number }
): string | null {
  let remote =
    doc.profilePhoto ||
    (doc.user as any)?.avatar ||
    doc.avatar ||
    (doc as any).image ||
    null;

  if (remote && typeof remote === 'string' && (remote.startsWith('http') || remote.startsWith('data:'))) {
    if (options?.faceCrop && remote.includes('res.cloudinary.com') && remote.includes('/image/upload/')) {
      const w = options.width || 450;
      const h = options.height || 300;
      if (!remote.includes('g_face')) {
        remote = remote.replace('/image/upload/', `/image/upload/c_thumb,g_face,w_${w},h_${h},z_0.8/`);
      }
    }
    return remote;
  }
  return null;
}

/**
 * Resolves clinic logo URL from Cloudinary / backend.
 */
function getClinicLogoUrl(clinic: PublicClinic): string | null {
  const remote = clinic.logo || (clinic as any).image || (clinic as any).photo || null;
  if (remote && typeof remote === 'string' && (remote.startsWith('http') || remote.startsWith('data:'))) {
    return remote;
  }
  return null;
}

export default function MobileHomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Cities');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Dynamic Locations from Backend API
  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();

  // Voice Search states & animations
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('Listening... Speak now');
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef<any>(null);

  // Active filter for All Doctors section
  const [activeDoctorSpecialty, setActiveDoctorSpecialty] = useState('All');

  // Queries for Featured & All
  const { data: featuredDoctors, isLoading: featDoctorsLoading } = usePublicFeaturedDoctors();
  const { data: allDoctors, isLoading: allDoctorsLoading } = usePublicAllDoctors();
  const { data: featuredClinics, isLoading: featClinicsLoading } = usePublicFeaturedClinics();
  const { data: allClinics, isLoading: allClinicsLoading } = usePublicAllClinics();

  // Distinct specialties list for All Doctors
  const doctorSpecialties = useMemo(() => {
    const list = allDoctors ?? [];
    const set = new Set<string>();
    list.forEach((d) => d.specialization && set.add(d.specialization));
    return ['All', ...Array.from(set)];
  }, [allDoctors]);

  const filteredAllDoctors = useMemo(() => {
    const list = allDoctors ?? [];
    if (activeDoctorSpecialty === 'All') return list;
    return list.filter((d) => d.specialization === activeDoctorSpecialty);
  }, [allDoctors, activeDoctorSpecialty]);

  // Voice wave pulsing effect
  useEffect(() => {
    if (voiceModalVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [voiceModalVisible, pulseAnim]);

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleStartVoiceSearch = () => {
    stopVoiceRecognition();
    setVoiceStatusText('Listening... Speak doctor name or specialty');
    setIsListening(true);
    setVoiceModalVisible(true);

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-IN';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.continuous = false;

          recognition.onstart = () => {
            setIsListening(true);
            setVoiceStatusText('Listening... Speak clearly into microphone');
          };

          recognition.onresult = (event: any) => {
            const transcript = event.results?.[0]?.[0]?.transcript;
            if (transcript) {
              setVoiceStatusText(`Heard: "${transcript}"`);
              setIsListening(false);
              setTimeout(() => {
                setSearchQuery(transcript);
                setVoiceModalVisible(false);
                runSearch(transcript, selectedLocation);
              }, 600);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event?.error);
            setIsListening(false);
            setVoiceStatusText('Could not hear clearly. Tap a suggestion below:');
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (err) {
          console.warn('SpeechRecognition start failed:', err);
        }
      }
    }

    // If Web Speech API not available or native mobile, give quick helpful status
    setTimeout(() => {
      setVoiceStatusText('Speak now or choose a suggestion below:');
    }, 1200);
  };

  const handleCloseVoiceModal = () => {
    stopVoiceRecognition();
    setVoiceModalVisible(false);
  };

  const handleSelectVoiceQuery = (text: string) => {
    stopVoiceRecognition();
    setVoiceStatusText(`Selected: "${text}"`);
    setTimeout(() => {
      setSearchQuery(text);
      setVoiceModalVisible(false);
      runSearch(text, selectedLocation);
    }, 300);
  };

  const runSearch = (queryStr: string, loc: string) => {
    router.push({
      pathname: '/(patient)/doctors',
      params: {
        q: queryStr,
        city: loc === 'All Cities' ? '' : loc,
      },
    });
  };

  const handleSearch = () => {
    runSearch(searchQuery, selectedLocation);
  };

  const handleBookDoctor = (doc: PublicDoctor) => {
    if (!isAuthenticated) {
      router.push('/(auth)');
    } else {
      router.push({
        pathname: '/(patient)/book',
        params: {
          doctorId: doc.id,
          doctorName: doc.user?.name || '',
          qualification: doc.qualification || '',
          specialization: doc.specialization || '',
          experience: String(doc.experience ?? 0),
          clinicId: doc.clinicId || doc.clinic?.id || '',
          clinicName: doc.clinic?.clinicName || '',
          city: doc.clinic?.city || '',
          fee: String(doc.fee ?? 0),
        },
      });
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${CLINIC_PHONE}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${CLINIC_WHATSAPP}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ================= 1. TOP HEADER (LOGO.png + Live Badge + Login & Sign Up) ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(main)')}
          activeOpacity={0.8}
          style={styles.logoTouchable}
        >
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo-icon.png')}
              style={styles.headerLogoIcon}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/LOGO.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Language Switcher */}
          <LanguageSwitcher compact />

          {/* Live Indicator Badge */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t('common.live', 'Live')}</Text>
          </View>

          {/* Direct Login & Sign Up Buttons */}
          <View style={styles.authButtonsRow}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/(auth)')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>{t('common.login', 'Login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpBtnText}>{t('common.register', 'Sign Up')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HERO SECTION ================= */}
        <View style={styles.heroSection}>
          <View style={styles.eyebrowBadge}>
            <Icon name="shield-check" size={12} color={Colors.light.primaryLight} />
            <Text style={styles.eyebrowText}>
              Find the right health services, connect with care
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Your Health{'\n'}
            <Text style={styles.heroTitleAccent}>Our Priority</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Find trusted doctors, nearby clinics, book appointments and track live queue
            tokens — all in one unified ecosystem.
          </Text>

          {/* Search Card Pill */}
          <View style={styles.searchCard}>
            {/* Location Selector */}
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.7}
            >
              <Icon name="map-pin" size={15} color={Colors.light.primaryLight} />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedLocation}
              </Text>
              <Icon name="chevron-down" size={13} color={Colors.light.ink400} />
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            {/* Input + Mic Button + Search Action Button */}
            <View style={styles.searchInputRow}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Doctor, clinic, specialty..."
                placeholderTextColor={Colors.light.ink400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />

              {/* Workable Mic Button */}
              <TouchableOpacity
                style={styles.micBtn}
                onPress={handleStartVoiceSearch}
                activeOpacity={0.7}
                accessibilityLabel="Voice Search"
              >
                <Icon name="mic" size={17} color={Colors.light.primary} />
              </TouchableOpacity>

              {/* Search Button */}
              <TouchableOpacity
                style={styles.searchActionBtn}
                onPress={handleSearch}
                activeOpacity={0.85}
              >
                <Icon name="search" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Popular Search Chips */}
          <View style={styles.popularRow}>
            <Text style={styles.popularLabel}>Popular:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularChips}
            >
              {POPULAR_SEARCHES.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.chip}
                  onPress={() => {
                    setSearchQuery(tag);
                    runSearch(tag, selectedLocation);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ================= 2. QUICK CARDS GRID (FIND DOCTORS, CLINICS, LABS, HOSPITALS) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickLinksGrid}>
            {/* Top Row: Find Doctors & Nearby Clinics */}
            <View style={styles.quickLinksRow}>
              {/* Find the Right Doctors Card */}
              <LinearGradient
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGradientBorder}
              >
                <TouchableOpacity
                  style={styles.quickCardInnerDoctor}
                  onPress={() => router.push('/(patient)/doctors')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickImageWrapper}>
                    <Image
                      source={require('../../assets/home/quick-doctor.jpg')}
                      style={styles.quickImage}
                      resizeMode="cover"
                    />
                    <View style={styles.quickBadgeDoctor}>
                      <Icon name="stethoscope" size={12} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Breathing room gap between image and text */}
                  <View style={styles.quickCardBody}>
                    <Text style={styles.quickTitleDoctor}>
                      Find <Text style={{ color: Colors.light.primary }}>Doctors</Text>
                    </Text>
                    <Text style={styles.quickDesc} numberOfLines={2}>
                      Consult verified specialists
                    </Text>
                  </View>

                  <View style={styles.quickCardFooterRow}>
                    <View style={styles.quickArrowCircleDoctor}>
                      <Icon name="arrow-right" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              {/* Explore Nearby Clinics Card */}
              <LinearGradient
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGradientBorder}
              >
                <TouchableOpacity
                  style={styles.quickCardInnerClinic}
                  onPress={() => router.push('/(patient)/clinics')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickImageWrapper}>
                    <Image
                      source={require('../../assets/home/clinic-3d.jpg')}
                      style={styles.quickImage}
                      resizeMode="cover"
                    />
                    <View style={styles.quickBadgeClinic}>
                      <Icon name="building" size={12} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Breathing room gap between image and text */}
                  <View style={styles.quickCardBody}>
                    <Text style={styles.quickTitleClinic}>
                      Nearby <Text style={{ color: '#0D9488' }}>Clinics</Text>
                    </Text>
                    <Text style={styles.quickDesc} numberOfLines={2}>
                      Modern facilities & tokens
                    </Text>
                  </View>

                  <View style={styles.quickCardFooterRow}>
                    <View style={styles.quickArrowCircleClinic}>
                      <Icon name="arrow-right" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Bottom Row: Diagnostic Labs & Hospitals (Coming Soon) */}
            <View style={styles.quickLinksRow}>
              {/* Diagnostic Labs Card */}
              <LinearGradient
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGradientBorder}
              >
                <TouchableOpacity
                  style={styles.quickCardInnerLab}
                  onPress={() => router.push('/(patient)/labs')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickImageWrapper}>
                    <Image
                      source={require('../../assets/home/labs-tubes.jpg')}
                      style={styles.quickImage}
                      resizeMode="cover"
                    />
                    <View style={styles.quickBadgeLab}>
                      <Icon name="flask" size={12} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Breathing room gap between image and text */}
                  <View style={styles.quickCardBody}>
                    <Text style={styles.quickTitleLab}>
                      Diagnostic <Text style={{ color: '#7C3AED' }}>Labs</Text>
                    </Text>
                    <Text style={styles.quickDesc} numberOfLines={2}>
                      Pathology tests & scans
                    </Text>
                  </View>

                  <View style={styles.quickCardFooterRow}>
                    <View style={styles.quickArrowCircleLab}>
                      <Icon name="arrow-right" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              {/* Hospitals Card (Coming Soon) */}
              <LinearGradient
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickCardGradientBorder}
              >
                <TouchableOpacity
                  style={styles.quickCardInnerHospital}
                  onPress={() =>
                    Alert.alert(
                      'Hospitals Network',
                      'Multi-specialty hospital chambers and emergency inpatient care is coming soon to Doctor Contact!'
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.quickImageWrapper}>
                    <Image
                      source={require('../../assets/home/hospital-3d.jpg')}
                      style={styles.quickImage}
                      resizeMode="cover"
                    />
                    <View style={styles.hospitalFloatingBadge}>
                      <Icon name="clock" size={9} color="#B45309" />
                      <Text style={styles.hospitalFloatingBadgeText}>SOON</Text>
                    </View>
                  </View>

                  {/* Breathing room gap between image and text */}
                  <View style={styles.quickCardBody}>
                    <Text style={styles.quickTitleHospital}>
                      Multi <Text style={{ color: '#D97706' }}>Hospitals</Text>
                    </Text>
                    <Text style={styles.quickDesc} numberOfLines={2}>
                      Multi-specialty care
                    </Text>
                  </View>

                  <View style={styles.quickCardFooterRow}>
                    <View style={styles.comingSoonPill}>
                      <Icon name="sparkles" size={10} color="#B45309" />
                      <Text style={styles.comingSoonPillText}>Coming Soon</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ================= 3. FEATURED DOCTORS (GRADIENT BORDER + CLOUDINARY IMAGES + VIEW ALL FILTER) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Doctors</Text>
              <Text style={styles.sectionSubtitle}>Top rated & verified specialists</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(patient)/doctors',
                  params: { filter: 'featured' },
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {featDoctorsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading featured specialists...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScrollContent}
            >
              {(featuredDoctors ?? []).map((doc) => {
                const docName = doc.user?.name || 'Dr. Specialist';
                const avatarUrl = getDoctorAvatarUrl(doc, { faceCrop: true, width: 450, height: 300 });
                const localPhoto = LOCAL_DOCTOR_PHOTOS[doc.imageKey || ''] || null;

                return (
                  <LinearGradient
                    key={doc.id}
                    colors={['#252a67', '#3b4a8f', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredDocGradientBorder}
                  >
                    <View style={styles.doctorCardInner}>
                      {/* Image / Cloudinary Header */}
                      <View style={styles.doctorImageContainer}>
                        {avatarUrl ? (
                          <Image
                            source={{ uri: avatarUrl }}
                            style={styles.doctorCoverImage}
                            resizeMode="cover"
                          />
                        ) : localPhoto ? (
                          <Image
                            source={localPhoto}
                            style={styles.doctorCoverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={['#1B3A8C', '#3b82f6']}
                            style={styles.doctorAvatarFallback}
                          >
                            <Text style={styles.avatarFallbackText}>
                              {getDoctorInitials(docName)}
                            </Text>
                          </LinearGradient>
                        )}

                        <View style={styles.verifiedFloatingBadge}>
                          <Icon name="check-circle" size={10} color="#FFFFFF" />
                          <Text style={styles.verifiedFloatingText}>Verified</Text>
                        </View>

                        {doc.experience ? (
                          <View style={styles.expFloatingBadge}>
                            <Text style={styles.expFloatingText}>{doc.experience}+ yrs</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Content */}
                      <View style={styles.doctorCardContent}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {docName}
                        </Text>
                        <Text style={styles.doctorSpecialty} numberOfLines={1}>
                          {doc.specialization || 'Consultant Specialist'}
                        </Text>

                        {doc.clinic?.clinicName ? (
                          <View style={styles.clinicLocRow}>
                            <Icon name="building" size={11} color={Colors.light.ink500} />
                            <Text style={styles.clinicLocText} numberOfLines={1}>
                              {doc.clinic.clinicName} • {doc.clinic.city}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.doctorFooterRow}>
                          <View style={styles.ratingBadge}>
                            <Icon name="star" size={11} color="#EAB308" />
                            <Text style={styles.ratingText}>{doc.rating ?? 4.9}</Text>
                          </View>

                          <Text style={styles.docFee}>₹{doc.fee ?? 500}</Text>

                          <TouchableOpacity
                            style={styles.bookMiniBtn}
                            onPress={() => handleBookDoctor(doc)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.bookMiniBtnText}>Book</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ================= 4. ALL DOCTORS (GRADIENT BORDER + SQUARE IMAGES) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>All Doctors</Text>
              <Text style={styles.sectionSubtitle}>Browse doctors across specialties</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/doctors')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Specialty Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtyFilterRow}
          >
            {doctorSpecialties.map((spec) => {
              const isSelected = activeDoctorSpecialty === spec;
              return (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specialtyPill,
                    isSelected && styles.specialtyPillSelected,
                  ]}
                  onPress={() => setActiveDoctorSpecialty(spec)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.specialtyPillText,
                      isSelected && styles.specialtyPillTextSelected,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {allDoctorsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading doctors directory...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScrollContent}
            >
              {filteredAllDoctors.map((doc) => {
                const docName = doc.user?.name || 'Healthcare Professional';
                const avatarUrl = getDoctorAvatarUrl(doc);

                return (
                  <LinearGradient
                    key={doc.id}
                    colors={['#252a67', '#3b4a8f', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.allDocGradientBorder}
                  >
                    <TouchableOpacity
                      style={styles.allDoctorCardInner}
                      onPress={() => handleBookDoctor(doc)}
                      activeOpacity={0.85}
                    >
                      {/* SQUARE DOCTOR IMAGE (NOT CIRCLE) */}
                      <View style={styles.squareAvatarContainer}>
                        {avatarUrl ? (
                          <Image
                            source={{ uri: avatarUrl }}
                            style={styles.squareDoctorImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={['#1B3A8C', '#14B8A6']}
                            style={styles.squareFallbackGradient}
                          >
                            <Text style={styles.squareFallbackText}>
                              {getDoctorInitials(docName)}
                            </Text>
                          </LinearGradient>
                        )}
                        <View style={styles.squareOnlineDot} />
                      </View>

                      {/* Doctor Info */}
                      <View style={styles.compactDocInfo}>
                        <Text style={styles.compactDocName} numberOfLines={1}>
                          {docName}
                        </Text>
                        <Text style={styles.compactDocSpecialty} numberOfLines={1}>
                          {doc.specialization || 'Specialist'}
                        </Text>
                        <Text style={styles.compactDocClinic} numberOfLines={1}>
                          {doc.clinic?.clinicName || 'Clinic Partner'}
                        </Text>

                        <View style={styles.compactDocBottom}>
                          <View style={styles.ratingBadgeSm}>
                            <Icon name="star" size={10} color="#EAB308" />
                            <Text style={styles.ratingTextSm}>{doc.rating ?? 4.8}</Text>
                          </View>
                          <Text style={styles.compactDocFee}>₹{doc.fee ?? 400}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ================= 5. TREATMENTS (GRADIENT BORDER) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Treatments & Systems</Text>
              <Text style={styles.sectionSubtitle}>Holistic & specialized healthcare</Text>
            </View>
          </View>

          <View style={styles.treatmentsRow}>
            {/* Homeopathy */}
            <LinearGradient
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.treatmentGradientBorder}
            >
              <TouchableOpacity
                style={styles.treatmentCardInner}
                onPress={() => runSearch('Homeopathy', selectedLocation)}
                activeOpacity={0.8}
              >
                <Image
                  source={TREATMENT_LOCAL_IMAGES.homeopathy}
                  style={styles.treatmentImage}
                  resizeMode="cover"
                />
                <View style={styles.treatmentOverlay}>
                  <Text style={styles.treatmentTitle}>Homeopathy</Text>
                  <Text style={styles.treatmentSub}>Gentle healing</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Allopathy */}
            <LinearGradient
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.treatmentGradientBorder}
            >
              <TouchableOpacity
                style={styles.treatmentCardInner}
                onPress={() => runSearch('Allopathy', selectedLocation)}
                activeOpacity={0.8}
              >
                <Image
                  source={TREATMENT_LOCAL_IMAGES.allopathy}
                  style={styles.treatmentImage}
                  resizeMode="cover"
                />
                <View style={styles.treatmentOverlay}>
                  <Text style={styles.treatmentTitle}>Allopathy</Text>
                  <Text style={styles.treatmentSub}>Modern medicine</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Ayurveda */}
            <LinearGradient
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.treatmentGradientBorder}
            >
              <TouchableOpacity
                style={styles.treatmentCardInner}
                onPress={() => runSearch('Ayurveda', selectedLocation)}
                activeOpacity={0.8}
              >
                <Image
                  source={TREATMENT_LOCAL_IMAGES.ayurveda}
                  style={styles.treatmentImage}
                  resizeMode="cover"
                />
                <View style={styles.treatmentOverlay}>
                  <Text style={styles.treatmentTitle}>Ayurveda</Text>
                  <Text style={styles.treatmentSub}>Natural balance</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* ================= 6. FEATURED CLINICS (GRADIENT BORDER + CLOUDINARY LOGO) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Clinics</Text>
              <Text style={styles.sectionSubtitle}>Modern facilities & live token queues</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(patient)/clinics',
                  params: { filter: 'featured' },
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {featClinicsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading featured clinics...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScrollContent}
            >
              {(featuredClinics ?? []).map((clinic) => {
                const logoUrl = getClinicLogoUrl(clinic);
                const cName = clinic.clinicName || 'Clinic Center';

                return (
                  <LinearGradient
                    key={clinic.id}
                    colors={['#252a67', '#3b4a8f', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredClinicGradientBorder}
                  >
                    <TouchableOpacity
                      style={styles.clinicCardInner}
                      onPress={() =>
                        router.push({
                          pathname: '/(patient)/clinics',
                          params: { filter: 'featured', q: cName },
                        })
                      }
                      activeOpacity={0.85}
                    >
                      {/* Clinic Cover / Cloudinary Logo */}
                      <View style={styles.clinicImageContainer}>
                        {logoUrl ? (
                          <Image
                            source={{ uri: logoUrl }}
                            style={styles.clinicCoverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={['#14B8A6', '#0D9488']}
                            style={styles.clinicLogoFallback}
                          >
                            <Icon name="building" size={28} color="#FFFFFF" />
                            <Text style={styles.clinicFallbackText}>
                              {getClinicInitials(cName)}
                            </Text>
                          </LinearGradient>
                        )}
                        <View style={styles.clinicDoctorsBadge}>
                          <Icon name="stethoscope" size={10} color="#FFFFFF" />
                          <Text style={styles.clinicDoctorsBadgeText}>
                            {clinic.doctorsCount ?? 8} Doctors
                          </Text>
                        </View>
                      </View>

                      {/* Info */}
                      <View style={styles.clinicCardContent}>
                        <Text style={styles.clinicCardTitle} numberOfLines={1}>
                          {cName}
                        </Text>

                        <View style={styles.clinicCardLocationRow}>
                          <Icon name="map-pin" size={11} color="#16A34A" />
                          <Text style={styles.clinicCardLocationText} numberOfLines={1}>
                            {clinic.city || 'Dubrajpur'}, {clinic.address || 'Birbhum'}
                          </Text>
                        </View>

                        {clinic.specialties && clinic.specialties.length > 0 ? (
                          <View style={styles.clinicTagsRow}>
                            {clinic.specialties.slice(0, 2).map((tag) => (
                              <View key={tag} style={styles.clinicTagPill}>
                                <Text style={styles.clinicTagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}

                        <View style={styles.clinicCardFooter}>
                          <View style={styles.ratingBadge}>
                            <Icon name="star" size={11} color="#EAB308" />
                            <Text style={styles.ratingText}>{clinic.rating ?? 4.8}</Text>
                          </View>

                          <View style={styles.viewClinicBtn}>
                            <Text style={styles.viewClinicBtnText}>View</Text>
                            <Icon name="chevron-right" size={12} color={Colors.light.primary} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ================= 7. ALL CLINICS (GRADIENT BORDER) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>All Clinics</Text>
              <Text style={styles.sectionSubtitle}>Complete chamber directory near you</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(patient)/clinics',
                  params: { filter: 'all' },
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {allClinicsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading all clinics...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScrollContent}
            >
              {(allClinics ?? []).map((clinic) => {
                const logoUrl = getClinicLogoUrl(clinic);
                const cName = clinic.clinicName || 'Health Center';

                return (
                  <LinearGradient
                    key={clinic.id}
                    colors={['#252a67', '#3b4a8f', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.allClinicGradientBorder}
                  >
                    <TouchableOpacity
                      style={styles.allClinicCardInner}
                      onPress={() =>
                        router.push({
                          pathname: '/(patient)/clinics',
                          params: { q: cName },
                        })
                      }
                      activeOpacity={0.85}
                    >
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={styles.allClinicCoverImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={['#14B8A6', '#0D9488']}
                          style={styles.allClinicCoverFallback}
                        >
                          <Icon name="building" size={24} color="#FFFFFF" />
                          <Text style={styles.allClinicFallbackText}>
                            {getClinicInitials(cName)}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.allClinicOverlay}>
                        <Text style={styles.allClinicTitle} numberOfLines={1}>
                          {cName}
                        </Text>
                        <Text style={styles.allClinicSub} numberOfLines={1}>
                          {clinic.city || 'Chamber'} • {clinic.doctorsCount ?? 5} Docs
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ================= 8. LABS & AMBULANCE (GRADIENT BORDER) ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.labsAmbulanceGrid}>
            {/* Labs Card */}
            <LinearGradient
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emergencyGradientBorder}
            >
              <View style={styles.labCardInner}>
                <View style={styles.emergencyTopRow}>
                  <Image
                    source={EMERGENCY_LOCAL_IMAGES.labs}
                    style={styles.emergencyImgThumb}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyCardTitlePurple}>Diagnostic Labs</Text>
                    <Text style={styles.emergencyCardDesc}>
                      Accurate pathology reports & sample collection.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.labBtn}
                  onPress={() => router.push('/(patient)/labs')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.labBtnText}>Book Lab Test</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Ambulance Card */}
            <LinearGradient
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emergencyGradientBorder}
            >
              <View style={styles.ambCardInner}>
                <View style={styles.emergencyTopRow}>
                  <Image
                    source={EMERGENCY_LOCAL_IMAGES.ambulance}
                    style={styles.emergencyImgThumb}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyCardTitleRed}>24×7 Ambulance</Text>
                    <Text style={styles.emergencyCardDesc}>
                      Rapid emergency response with medical support.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.ambBtn}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <Icon name="phone" size={14} color="#FFFFFF" />
                  <Text style={styles.ambBtnText}>Call Ambulance</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* ================= 9. COMPLETE WEB-ALIGNED FOOTER ================= */}
        <View style={styles.footerContainer}>
          {/* DEWASI GROUP PARTNERSHIP & INITIATIVE BANNER */}
          <LinearGradient
            colors={['#252a67', '#1E2356']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.initiativeBanner}
          >
            <View style={styles.initiativeTopRow}>
              {/* Dewasi Group Box */}
              <View style={styles.initiativeBrandBox}>
                <View style={styles.initiativeLogoWrap}>
                  <Image
                    source={require('../../assets/main.png')}
                    style={styles.initiativeLogoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.initiativeTextCol}>
                  <Text style={styles.initiativeSub}>AN INITIATIVE BY</Text>
                  <Text style={styles.initiativeMain}>Dewasi Group</Text>
                </View>
              </View>

              {/* Elegant connector badge */}
              <View style={styles.connectorPill}>
                <Text style={styles.connectorText}>Healthcare</Text>
              </View>

              {/* Doctor Contact Box */}
              <View style={styles.initiativeBrandBox}>
                <View style={styles.initiativeLogoWrap}>
                  <Image
                    source={require('../../assets/logo-icon.png')}
                    style={styles.initiativeLogoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.initiativeTextCol}>
                  <Text style={styles.initiativeSub}>POWERED PLATFORM</Text>
                  <Text style={styles.initiativeMain}>Doctor Contact</Text>
                </View>
              </View>
            </View>

            <Text style={styles.initiativeSummary}>
              Unifying clinics, specialists, diagnostic centers, and real-time patient
              queues across Bengal.
            </Text>
          </LinearGradient>

          {/* Quick Links Sections */}
          <View style={styles.footerLinksGrid}>
            {/* For Patients */}
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>For Patients</Text>
              <TouchableOpacity
                onPress={() => router.push('/(patient)/doctors')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Find Doctors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(patient)/clinics')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Explore Clinics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Live Queue Tokens</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(patient)/labs')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Diagnostic Tests</Text>
              </TouchableOpacity>
            </View>

            {/* For Providers */}
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>For Providers</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Doctor Portal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Clinic Chamber</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Receptionist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)')}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>Diagnostic Center</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency & Support Contact Bar */}
          <View style={styles.contactSupportCard}>
            <Text style={styles.contactSupportTitle}>24/7 Patient Helpdesk</Text>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                style={styles.contactBtnCall}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Icon name="phone" size={14} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>+91 97777 77777</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactBtnWa}
                onPress={handleWhatsApp}
                activeOpacity={0.8}
              >
                <Icon name="message-circle" size={14} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Copyright & Legal Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.copyrightRow}>
              <Icon name="shield-check" size={13} color="#10B981" />
              <Text style={styles.copyrightText}>
                © 2026 Dewasi Group. All rights reserved.
              </Text>
            </View>
            <View style={styles.legalLinksRow}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://doctorcontact.com/privacy').catch(() => {})}
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>•</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://doctorcontact.com/terms').catch(() => {})}
              >
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Developer Attribution */}
          <View style={styles.devCreditContainer}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.devCreditCard}
            >
              <Text style={styles.devCreditText}>
                Developed by{' '}
                <Text style={styles.devCreditName}>Soumya Chatterjee</Text>
                {' '}&{' '}
                <Text style={styles.devCreditName}>Ayon Paul</Text>
              </Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* ================= VOICE SEARCH MODAL ================= */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseVoiceModal}
      >
        <TouchableOpacity
          style={styles.voiceModalOverlay}
          activeOpacity={1}
          onPress={handleCloseVoiceModal}
        >
          <View
            style={styles.voiceModalCard}
            onStartShouldSetResponder={() => true}
          >
            {/* Header with close */}
            <View style={styles.voiceModalHeader}>
              <Text style={styles.voiceModalTitle}>Voice Search</Text>
              <TouchableOpacity
                onPress={handleCloseVoiceModal}
                style={styles.voiceCloseBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            {/* Pulsing Mic Circle (Tappable to re-listen) */}
            <TouchableOpacity
              style={styles.micCircleContainer}
              onPress={handleStartVoiceSearch}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.pulseWave,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.35],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              <View style={styles.micMainCircle}>
                <Icon name="mic" size={32} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.voiceStatus}>{voiceStatusText}</Text>
            <Text style={styles.voicePromptSub}>
              Tap the mic to restart, or choose a suggestion:
            </Text>

            {/* Suggestion Chips */}
            <View style={styles.voiceSuggestionsBox}>
              <Text style={styles.voiceSuggestionsLabel}>Quick search terms:</Text>
              <View style={styles.voiceSuggestionsGrid}>
                {VOICE_COMMAND_HINTS.map((hint) => (
                  <TouchableOpacity
                    key={hint}
                    style={styles.voiceChip}
                    onPress={() => handleSelectVoiceQuery(hint)}
                    activeOpacity={0.7}
                  >
                    <Icon name="search" size={11} color={Colors.light.primary} />
                    <Text style={styles.voiceChipText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================= LOCATION SELECTION MODAL (DYNAMIC BACKEND DATA) ================= */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.locationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City / Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {(searchLocations || FALLBACK_LOCATIONS).map((loc) => {
                const locName = typeof loc === 'string' ? loc : loc.nameEn;
                const locId = typeof loc === 'string' ? loc : loc.id;
                const isSelected = selectedLocation === locName;
                return (
                  <TouchableOpacity
                    key={locId || locName}
                    style={[
                      styles.modalLocationItem,
                      isSelected && styles.modalLocationItemActive,
                    ]}
                    onPress={() => {
                      setSelectedLocation(locName);
                      setLocationModalVisible(false);
                    }}
                  >
                    <Icon
                      name="map-pin"
                      size={16}
                      color={isSelected ? Colors.light.primary : Colors.light.ink400}
                    />
                    <Text
                      style={[
                        styles.modalLocationText,
                        isSelected && styles.modalLocationTextActive,
                      ]}
                    >
                      {locName}
                    </Text>
                    {isSelected && (
                      <Icon name="check-circle" size={16} color={Colors.light.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logoTouchable: {
    paddingVertical: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLogoIcon: {
    width: 32,
    height: 32,
  },
  headerLogo: {
    width: 102,
    height: 26,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E11D48',
    textTransform: 'uppercase',
  },
  authButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loginBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  signUpBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  signUpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Hero Section */
  heroSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.primaryLight,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#12295E',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    color: '#5CA904',
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.light.ink600,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: Spacing.three,
  },

  /* Search Pill */
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    ...Shadows.md,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    paddingVertical: 4,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  popularLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  popularChips: {
    gap: 6,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },

  /* 2. Quick Cards in Same Row with Gradient Border & Spacing */
  sectionContainer: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  quickLinksGrid: {
    gap: 12,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCardGradientBorder: {
    flex: 1,
    borderRadius: 20,
    padding: 3, // p-[3px] gradient border
    ...Shadows.sm,
  },
  quickCardInnerDoctor: {
    backgroundColor: '#EAF2FF',
    borderRadius: 17,
    padding: 14,
    minHeight: 228,
    justifyContent: 'space-between',
  },
  quickCardInnerClinic: {
    backgroundColor: '#E8F8F5',
    borderRadius: 17,
    padding: 14,
    minHeight: 228,
    justifyContent: 'space-between',
  },
  quickCardInnerLab: {
    backgroundColor: '#FAF5FF',
    borderRadius: 17,
    padding: 14,
    minHeight: 228,
    justifyContent: 'space-between',
  },
  quickCardInnerHospital: {
    backgroundColor: '#FFFBEB',
    borderRadius: 17,
    padding: 14,
    minHeight: 228,
    justifyContent: 'space-between',
  },
  quickImageWrapper: {
    height: 106, // Enlarged from 72 to 106 for full image visibility
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: 10, // Breathing room gap between image and text
  },
  quickImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      web: {
        objectPosition: 'top' as any,
        objectFit: 'cover' as any,
      },
    }),
  },
  quickBadgeDoctor: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: Colors.light.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBadgeClinic: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: '#0D9488',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBadgeLab: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: '#7C3AED',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalFloatingBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hospitalFloatingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  quickCardBody: {
    marginTop: 4,
  },
  quickTitleDoctor: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  quickTitleClinic: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  quickTitleLab: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  quickTitleHospital: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  quickDesc: {
    fontSize: 11,
    color: Colors.light.ink600,
    marginTop: 2,
    lineHeight: 15,
  },
  quickCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  quickArrowCircleDoctor: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickArrowCircleClinic: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickArrowCircleLab: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  comingSoonPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    textTransform: 'uppercase',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F1B33',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  loadingBox: {
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },

  /* 3. Featured Doctor Card With Gradient Border */
  cardsScrollContent: {
    gap: Spacing.three,
    paddingRight: Spacing.two,
  },
  featuredDocGradientBorder: {
    width: 224,
    borderRadius: 22,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  doctorCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    overflow: 'hidden',
  },
  doctorImageContainer: {
    height: 135,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  doctorCoverImage: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        objectPosition: 'center 20%' as any,
        objectFit: 'cover' as any,
      },
    }),
  },
  doctorAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifiedFloatingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: 'rgba(21, 128, 61, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  verifiedFloatingText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  expFloatingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: 'rgba(15, 27, 51, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
  },
  expFloatingText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  doctorCardContent: {
    padding: 12,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1B33',
  },
  doctorSpecialty: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 2,
  },
  clinicLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clinicLocText: {
    fontSize: 10,
    color: Colors.light.ink500,
    flex: 1,
  },
  doctorFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF9C3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A16207',
  },
  docFee: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1B33',
  },
  bookMiniBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  bookMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* 4. All Doctors Section (Square Images) */
  specialtyFilterRow: {
    gap: 8,
    paddingBottom: Spacing.two,
  },
  specialtyPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specialtyPillSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  specialtyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  specialtyPillTextSelected: {
    color: '#FFFFFF',
  },
  allDocGradientBorder: {
    width: 236,
    borderRadius: 18,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  allDoctorCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  /* SQUARE NOT CIRCLE */
  squareAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 10, // Modern square with subtle radius
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  squareDoctorImage: {
    width: '100%',
    height: '100%',
  },
  squareFallbackGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  squareOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  compactDocInfo: {
    flex: 1,
  },
  compactDocName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1B33',
  },
  compactDocSpecialty: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 1,
  },
  compactDocClinic: {
    fontSize: 9,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  compactDocBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingBadgeSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF9C3',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
  },
  ratingTextSm: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A16207',
  },
  compactDocFee: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F1B33',
  },

  /* 5. Treatments */
  treatmentsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  treatmentGradientBorder: {
    flex: 1,
    borderRadius: 16,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  treatmentCardInner: {
    height: 100,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1B33',
  },
  treatmentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  treatmentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(15, 27, 51, 0.7)',
  },
  treatmentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  treatmentSub: {
    fontSize: 8,
    color: '#CBD5E1',
  },

  /* 6. Featured Clinics (Gradient Border) */
  featuredClinicGradientBorder: {
    width: 224,
    borderRadius: 22,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  clinicCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    overflow: 'hidden',
  },
  clinicImageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  clinicCoverImage: {
    width: '100%',
    height: '100%',
  },
  clinicLogoFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  clinicDoctorsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
  },
  clinicDoctorsBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  clinicCardContent: {
    padding: 12,
  },
  clinicCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1B33',
  },
  clinicCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  clinicCardLocationText: {
    fontSize: 10,
    color: Colors.light.ink500,
    flex: 1,
  },
  clinicTagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  clinicTagPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  clinicTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  clinicCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewClinicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewClinicBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  /* 7. All Clinics (Matches Treatments & Systems Card Size) */
  allClinicGradientBorder: {
    width: 125,
    borderRadius: 16,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  allClinicCardInner: {
    height: 100,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1B33',
  },
  allClinicCoverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.82,
    ...Platform.select({
      web: {
        objectPosition: 'top' as any,
        objectFit: 'cover' as any,
      },
    }),
  },
  allClinicCoverFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allClinicFallbackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  allClinicOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(15, 27, 51, 0.75)',
  },
  allClinicTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  allClinicSub: {
    fontSize: 8,
    color: '#CBD5E1',
    marginTop: 1,
  },

  /* 8. Labs & Ambulance */
  labsAmbulanceGrid: {
    gap: 12,
  },
  emergencyGradientBorder: {
    borderRadius: 18,
    padding: 3, // p-[3px]
    ...Shadows.sm,
  },
  labCardInner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 15,
    padding: 12,
    gap: 10,
  },
  ambCardInner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 15,
    padding: 12,
    gap: 10,
  },
  emergencyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyImgThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  emergencyCardTitlePurple: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  emergencyCardTitleRed: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
  emergencyCardDesc: {
    fontSize: 11,
    color: Colors.light.ink600,
    marginTop: 2,
    lineHeight: 15,
  },
  labBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 9,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  labBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ambBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: Radius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  ambBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* 9. Full Footer */
  footerContainer: {
    marginTop: Spacing.six,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  initiativeBanner: {
    padding: Spacing.four,
  },
  initiativeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  initiativeBrandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  initiativeLogoWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initiativeLogoImg: {
    width: '100%',
    height: '100%',
  },
  initiativeTextCol: {
    justifyContent: 'center',
  },
  initiativeSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  initiativeMain: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  connectorPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  connectorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase',
  },
  initiativeSummary: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 8,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  footerCol: {
    flex: 1,
    gap: 8,
  },
  footerColTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1B33',
    marginBottom: 4,
  },
  footerLink: {
    paddingVertical: 2,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  contactSupportCard: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactSupportTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  contactBtnWa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748B',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legalLinkText: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  legalDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  devCreditContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
    backgroundColor: '#FFFFFF',
  },
  devCreditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  devCreditSparkleWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devCreditText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  devCreditName: {
    color: '#38BDF8',
    fontWeight: '800',
  },

  /* Modals */
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  voiceModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    ...Shadows.lg,
  },
  voiceModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  voiceModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F1B33',
  },
  voiceCloseBtn: {
    padding: 4,
  },
  micCircleContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  pulseWave: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#93C5FD',
  },
  micMainCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  voiceStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  voicePromptSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  voiceSuggestionsBox: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  voiceSuggestionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  voiceSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voiceChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  modalLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  modalLocationItemActive: {
    backgroundColor: '#EFF6FF',
  },
  modalLocationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink700,
    fontWeight: '500',
  },
  modalLocationTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
});
