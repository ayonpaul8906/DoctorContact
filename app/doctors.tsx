import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Alert,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/auth-context';
import { useDoctorSearch } from '../hooks/useDoctorSearch';
import {
  usePublicFeaturedDoctors,
  usePublicAllDoctors,
} from '../hooks/usePublicDirectory';
import {
  useSearchLocations,
  FALLBACK_LOCATIONS,
} from '../hooks/useSearchLocations';
import { formatDoctorName } from '../lib/formatters';
import {
  getDoctorSpecialty,
  getDoctorMedicalSystem,
  matchesDoctorSpecialtySearch,
} from '../lib/doctor-specialty';
import {
  Icon,
  EmptyState,
  LanguageSwitcher,
  DoctorChamberModal,
} from '../components';
import { useLanguage } from '../lib/language-context';
import type { Doctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

function DoctorCardSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.skeletonCardWrapper, { opacity: pulseAnim }]}>
      <View style={styles.skeletonInner}>
        <View style={styles.skeletonHeaderRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonMeta}>
            <View style={[styles.skeletonLine, { width: '65%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '45%', height: 12, marginTop: 8 }]} />
            <View style={[styles.skeletonLine, { width: '35%', height: 12, marginTop: 8 }]} />
          </View>
        </View>

        <View style={styles.skeletonDivider} />

        <View style={styles.skeletonPricingRow}>
          <View style={[styles.skeletonLine, { width: '35%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '30%', height: 20, borderRadius: 10 }]} />
        </View>

        <View style={styles.skeletonButtonsRow}>
          <View style={[styles.skeletonBtn, { flex: 1 }]} />
          <View style={[styles.skeletonBtn, { flex: 1.5, backgroundColor: '#CBD5E1' }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const LOCAL_DOCTOR_PHOTOS: Record<string, any> = {
  doc1: require('../assets/home/doc1.jpg'),
  doc3: require('../assets/home/doc3.jpg'),
  doc4: require('../assets/home/doc4.jpg'),
  hero: require('../assets/home/hero-doctor.jpg'),
};

function getInitials(name: string) {
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type FilterMode = 'all' | 'live' | 'today';

export default function DoctorSearchScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    filter?: string;
    q?: string;
    city?: string;
    live?: string;
  }>();
  const isFeaturedOnly = params.filter === 'featured';

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCity, setSelectedCity] = useState(params.city || '');
  const [filterMode, setFilterMode] = useState<FilterMode>(
    params.live === 'true' ? 'live' : 'all'
  );

  // Transition readiness state for 0ms lag instant screen push
  const [isScreenReady, setIsScreenReady] = useState(false);

  useEffect(() => {
    // Enable instant transition with zero screen freeze on navigation push:
    // Screen mounts with lightweight skeleton on frame 0, allowing 60fps native transition
    let timer: ReturnType<typeof setTimeout>;
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        setIsScreenReady(true);
      }, 180);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const filteredLocations = useMemo(() => {
    const list = searchLocations.map((l) => (typeof l === 'string' ? l : l.nameEn));
    if (!locationSearch.trim()) return list;
    const q = locationSearch.toLowerCase().trim();
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [searchLocations, locationSearch]);

  // Doctor Chamber Selection Modal states
  const [chamberModalVisible, setChamberModalVisible] = useState(false);
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);
  const [modalMode, setModalMode] = useState<'chamber_picker' | 'doctor_profile'>('chamber_picker');

  // Search queries with live status filter bindings
  const searchFilters = useMemo(
    () => ({
      liveNow: filterMode === 'live',
      availableToday: filterMode === 'today',
    }),
    [filterMode]
  );

  const generalSearch = useDoctorSearch(searchQuery, selectedCity, searchFilters);
  const featuredQuery = usePublicFeaturedDoctors();
  const publicAllDoctorsQuery = usePublicAllDoctors();

  const isSearchActive = Boolean(searchQuery.trim() || selectedCity);
  const isLoading = isFeaturedOnly
    ? featuredQuery.isLoading
    : isSearchActive
    ? generalSearch.isLoading && (!publicAllDoctorsQuery.data || publicAllDoctorsQuery.data.length === 0)
    : generalSearch.isLoading && (!publicAllDoctorsQuery.data || publicAllDoctorsQuery.data.length === 0);

  const isFetchingAny = isFeaturedOnly
    ? featuredQuery.isFetching
    : generalSearch.isFetching || publicAllDoctorsQuery.isFetching;

  const isError = isFeaturedOnly
    ? featuredQuery.isError
    : generalSearch.isError && (!publicAllDoctorsQuery.data || publicAllDoctorsQuery.data.length === 0);
  const refetch = isFeaturedOnly
    ? featuredQuery.refetch
    : () => {
        generalSearch.refetch();
        publicAllDoctorsQuery.refetch();
      };

  const rawDoctorList = useMemo(() => {
    if (isFeaturedOnly) {
      return featuredQuery.data ?? [];
    }

    // Merge public directory with general search so searches for medical systems
    // (e.g. Ayurveda, Allopathy, Homeopathy) and clinical specializations always
    // have the full doctor directory to filter from even if backend SQL only queries doctor name.
    const map = new Map<string, Doctor>();
    (publicAllDoctorsQuery.data ?? []).forEach((d) => map.set(d.id, d));
    (generalSearch.data ?? []).forEach((d) => {
      const existing = map.get(d.id);
      map.set(d.id, existing ? { ...existing, ...d } : d);
    });

    const combined = Array.from(map.values());
    if (combined.length > 0) return combined;

    return generalSearch.data ?? publicAllDoctorsQuery.data ?? [];
  }, [
    isFeaturedOnly,
    featuredQuery.data,
    publicAllDoctorsQuery.data,
    generalSearch.data,
  ]);

  const doctorList = useMemo(() => {
    if (!isScreenReady) return [];
    let list = rawDoctorList;

    // Filter by query client-side with smart specialty & medical system matching (Ayurveda, Allopathy, etc.)
    if (searchQuery.trim()) {
      list = list.filter((doc) => matchesDoctorSpecialtySearch(doc, searchQuery));
    }

    // Filter by city if selected
    if (selectedCity.trim()) {
      const cityLower = selectedCity.trim().toLowerCase();
      list = list.filter((doc) => {
        const c1 = (doc.clinic?.city || '').toLowerCase();
        const c2 = ((doc as any).city || '').toLowerCase();
        const allClinics = (doc as any).allClinics || [];
        const hasChamberInCity = allClinics.some((c: any) =>
          (c.city || '').toLowerCase().includes(cityLower)
        );
        return c1.includes(cityLower) || c2.includes(cityLower) || hasChamberInCity;
      });
    }

    // Apply client-side live filter fallback if API returned unfiltered
    if (filterMode === 'live') {
      list = list.filter((doc) => doc.liveStatus?.isLive || (doc as any).isLive);
    } else if (filterMode === 'today') {
      list = list.filter(
        (doc) => doc.isAvailable || doc.liveStatus?.isAvailable || doc.liveStatus?.isLive
      );
    }

    return list;
  }, [rawDoctorList, searchQuery, selectedCity, filterMode, isScreenReady]);

  const showSkeleton = !isScreenReady || isLoading || (doctorList.length === 0 && isFetchingAny);

  const handleOpenDetails = (doctor: Doctor) => {
    // Navigate to full doctor profile screen
    router.push({
      pathname: '/doctor/[id]' as any,
      params: { id: doctor.id },
    });
  };

  const handleOpenBooking = (doctor: Doctor) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'Please login or register to book an appointment with our specialist doctors.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login / Register',
            onPress: () => router.push('/(auth)' as any),
          },
        ]
      );
      return;
    }
    setSelectedDoctorForModal(doctor);
    setModalMode('chamber_picker');
    setChamberModalVisible(true);
  };

  const handleSelectChamberForBooking = (clinic: any) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'Please login or register to book an appointment with our specialist doctors.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login / Register',
            onPress: () => router.push('/(auth)' as any),
          },
        ]
      );
      return;
    }
    if (!selectedDoctorForModal) return;
    router.push({
      pathname: '/book',
      params: {
        doctorId: selectedDoctorForModal.id,
        doctorName: selectedDoctorForModal.user?.name || '',
        qualification: selectedDoctorForModal.qualification || '',
        specialization: getDoctorSpecialty(selectedDoctorForModal),
        experience: String(selectedDoctorForModal.experience ?? 0),
        clinicId: clinic.id,
        clinicName: clinic.clinicName || '',
        city: clinic.city || '',
        fee: String(clinic.fee ?? selectedDoctorForModal.fee ?? 500),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isFeaturedOnly
              ? t('section.featuredDoctors', 'Featured Doctors')
              : t('quick.findDoctors', 'Find a Doctor')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {isFeaturedOnly
              ? t('section.featuredDoctorsSub', 'Top rated and verified specialists')
              : t('doctor.findDoctorSub', 'Book an in-clinic consultation with top specialists')}
          </Text>
        </View>

        <LanguageSwitcher compact />
      </View>

      {/* Web-aligned Search & Location Bar */}
      <View style={styles.searchSection}>
        <View style={styles.webSearchCard}>
          {/* Location Selector */}
          <TouchableOpacity
            style={styles.locationSelectorBtn}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.locationIconBox}>
              <Icon name="map-pin" size={15} color="#0D9488" />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.searchSmallLabel}>LOCATION</Text>
              <Text style={styles.locationValueText} numberOfLines={1}>
                {selectedCity || 'All Locations'}
              </Text>
            </View>
            {selectedCity ? (
              <TouchableOpacity
                onPress={() => setSelectedCity('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearLocationBtn}
              >
                <Icon name="x" size={13} color={Colors.light.ink400} />
              </TouchableOpacity>
            ) : (
              <Icon name="chevron-down" size={13} color={Colors.light.ink400} />
            )}
          </TouchableOpacity>

          <View style={styles.searchDividerH} />

          {/* Search Input Container */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconBox}>
              <Icon name="search" size={15} color={Colors.light.ink500} />
            </View>
            <View style={styles.searchInputCol}>
              <Text style={styles.searchSmallLabel}>SEARCH</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={
                  isFeaturedOnly
                    ? 'Filter featured specialists...'
                    : 'System, Doctor, Specialty, Clinic...'
                }
                placeholderTextColor={Colors.light.ink400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={15} color={Colors.light.ink400} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Quick Suggestion Chips Row (Try: Allopathy, Homeopathy, Ayurveda, etc.) */}
        <View style={styles.trySuggestionsRow}>
          <Text style={styles.tryLabel}>Try:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tryChipsScroll}
          >
            {['All', 'Allopathy', 'Ayurveda', 'Homeopathy', 'Cardiologist', 'General Physician'].map(
              (tag) => {
                const isSelected =
                  tag === 'All'
                    ? !searchQuery.trim()
                    : searchQuery.trim().toLowerCase() === tag.toLowerCase();
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tryChip, isSelected && styles.tryChipActive]}
                    onPress={() => setSearchQuery(tag === 'All' ? '' : tag)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tryChipText,
                        isSelected && styles.tryChipTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* Live Filter Chips Matching Web */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'all' && styles.filterChipTextActive,
              ]}
            >
              {t('section.allDoctors', 'All Doctors')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterMode === 'today' && styles.filterChipTodayActive,
            ]}
            onPress={() => setFilterMode(filterMode === 'today' ? 'all' : 'today')}
            activeOpacity={0.8}
          >
            <View style={styles.todayGreenDot} />
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'today' && styles.filterChipTodayTextActive,
              ]}
            >
              {t('doctor.today', 'Available Today')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterMode === 'live' && styles.filterChipLiveActive,
            ]}
            onPress={() => setFilterMode(filterMode === 'live' ? 'all' : 'live')}
            activeOpacity={0.8}
          >
            <View style={styles.livePulseDot} />
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'live' && styles.filterChipLiveTextActive,
              ]}
            >
              {t('doctor.liveNow', 'Live Now')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctor Cards List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State with Instant Skeleton Loader */}
        {showSkeleton ? (
          <View style={styles.skeletonContainer}>
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
          </View>
        ) : null}

        {/* Error State */}
        {!showSkeleton && isError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Unable to load doctors</Text>
            <Text style={styles.errorSubtitle}>
              Please check your network and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => refetch()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Retry Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!showSkeleton && !isError && doctorList.length === 0 && (
          <EmptyState
            title={
              filterMode === 'live'
                ? 'No Doctors Currently Live'
                : isFeaturedOnly
                ? 'No Featured Doctors Found'
                : 'No Doctors Found'
            }
            description={
              filterMode === 'live'
                ? 'There are currently no active consultation queues running. You can browse all specialists or check upcoming availability.'
                : 'We could not find any doctors matching your search query. Try clearing filters or searching another keyword.'
            }
            actionLabel="Reset Filters"
            onActionPress={() => {
              setSearchQuery('');
              setSelectedCity('');
              setFilterMode('all');
            }}
          />
        )}

        {/* Doctor Cards with Web-matched Gradient Border Design */}
        {!showSkeleton && !isError && doctorList.map((doctor) => {
          const docName = formatDoctorName(doctor.user?.name || 'Doctor');
          const docSpecialty = getDoctorSpecialty(doctor);
          const systemInfo = getDoctorMedicalSystem(doctor);
          const exp = doctor.experience ?? 0;
          const rating = doctor.rating ?? 4.8;
          const reviewCount = doctor.reviewCount ?? 120;
          const liveStatus = doctor.liveStatus;
          const isLive = Boolean(liveStatus?.isLive || (doctor as any).isLive);
          const isAvailable = Boolean(
            liveStatus ? liveStatus.isAvailable : (doctor.isAvailable ?? true)
          );

          // Resolve fees
          const registeredClinics: any[] =
            (doctor as any).allClinics && (doctor as any).allClinics.length > 0
              ? (doctor as any).allClinics
              : doctor.clinic
              ? [doctor.clinic]
              : [];

          const clinicFees = registeredClinics
            .map((c: any) => c.associationDetails?.fee ?? doctor.fee ?? 0)
            .filter((f: number) => f > 0);

          const highestFee =
            clinicFees.length > 0 ? Math.max(...clinicFees) : (doctor.fee ?? 500);

          let avatarUri =
            doctor.profilePhoto ||
            doctor.avatar ||
            (doctor.user as any)?.avatar ||
            (doctor as any).image ||
            null;

          if (
            avatarUri &&
            typeof avatarUri === 'string' &&
            avatarUri.includes('res.cloudinary.com') &&
            avatarUri.includes('/image/upload/')
          ) {
            if (!avatarUri.includes('g_face')) {
              avatarUri = avatarUri.replace(
                '/image/upload/',
                '/image/upload/c_thumb,g_face,w_250,h_250,z_0.8/'
              );
            }
          }

          const localPhoto = (doctor as any).imageKey
            ? LOCAL_DOCTOR_PHOTOS[(doctor as any).imageKey]
            : null;

          return (
            <LinearGradient
              key={doctor.id}
              colors={['#252a67', '#3b4a8f', '#14B8A6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCardWrapper}
            >
              <View style={styles.cardInner}>
                {/* Top Row: Avatar + Info */}
                <View style={styles.doctorHeaderRow}>
                  <View style={styles.avatarBoxSquare}>
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={[
                          styles.avatarImgSquare,
                          Platform.OS === 'web' && ({ objectPosition: 'center 15%' } as any),
                        ]}
                        resizeMode="cover"
                      />
                    ) : localPhoto ? (
                      <Image
                        source={localPhoto}
                        style={[
                          styles.avatarImgSquare,
                          Platform.OS === 'web' && ({ objectPosition: 'center 15%' } as any),
                        ]}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#252a67', '#3b4a8f', '#14B8A6']}
                        style={styles.avatarGradientFallback as any}
                      >
                        <Text style={styles.avatarText}>{getInitials(docName)}</Text>
                      </LinearGradient>
                    )}

                    {/* Verified Badge */}
                    <View style={styles.verifiedBadgeCircle}>
                      <Icon name="check" size={11} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.doctorMeta}>
                    <Text style={styles.docNameText} numberOfLines={1}>
                      {docName}
                    </Text>

                    {/* Specialty line with stethoscope icon */}
                    <View style={styles.specialtyContainer}>
                      <Icon name="stethoscope" size={12} color="#0D9488" />
                      <Text style={styles.specialtyText} numberOfLines={1}>
                        {docSpecialty}
                      </Text>
                    </View>

                    {/* Medical System Badge + Rating Row */}
                    <View style={styles.systemAndRatingRow}>
                      <View
                        style={[
                          styles.medicalSystemBadge,
                          {
                            backgroundColor: systemInfo.bgColor,
                            borderColor: systemInfo.borderColor,
                          },
                        ]}
                      >
                        <Icon name={systemInfo.icon} size={10} color={systemInfo.textColor} />
                        <Text style={[styles.medicalSystemText, { color: systemInfo.textColor }]}>
                          {systemInfo.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Experience Badge */}
                {exp > 0 && (
                  <View style={styles.expBadgeRow}>
                    <View style={styles.expBadgePill}>
                      <Icon name="sparkles" size={11} color={Colors.light.ink600} />
                      <Text style={styles.expText}>
                        {exp}+ {t('doctor.yrsExp', 'years experience')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Fee & Live Status (Clean card footer without chamber list clutter - chambers shown in profile & booking) */}
                <View style={styles.cardPricingRow}>
                  <View style={styles.feeHighlightBox}>
                    <Text style={styles.feeLabelText}>CONSULTATION FEE</Text>
                    <View style={styles.feeValRow}>
                      <Text style={styles.feeAmountText}>{'\u20B9'}{highestFee}</Text>
                      <Text style={styles.feeSubText}>{t('doctor.perVisit', '/ visit')}</Text>
                    </View>
                  </View>

                  <View style={styles.statusPillWrapper}>
                    {isLive ? (
                      <View style={styles.liveStatusPill}>
                        <View style={styles.livePulseDot} />
                        <Icon name="radio" size={11} color="#DC2626" />
                        <Text style={styles.liveStatusText}>{t('doctor.liveNow', 'Live Now')}</Text>
                        {liveStatus?.capacity && (
                          <Text style={styles.capacityText}>
                            ({liveStatus.capacity.booked}/{liveStatus.capacity.max})
                          </Text>
                        )}
                      </View>
                    ) : isAvailable ? (
                      <View style={styles.availableStatusPill}>
                        <View style={styles.availableInnerDot} />
                        <Text style={styles.availableStatusText}>
                          {t('doctor.available', 'Available today')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.unavailableStatusPill}>
                        <View style={styles.unavailableInnerDot} />
                        <Text style={styles.unavailableStatusText}>
                          {t('doctor.unavailable', 'Unavailable today')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleOpenDetails(doctor)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailsButtonText}>{t('common.details', 'Details')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleOpenBooking(doctor)}
                    activeOpacity={0.85}
                  >
                    <Icon name="calendar" size={13} color="#FFFFFF" />
                    <Text style={styles.bookButtonText}>
                      {t('doctor.bookAppointment', 'Book Appointment')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Doctor Chamber Selection & Profile Modal */}
      {selectedDoctorForModal && (
        <DoctorChamberModal
          visible={chamberModalVisible}
          onClose={() => setChamberModalVisible(false)}
          doctor={selectedDoctorForModal}
          mode={modalMode}
          onBookSlot={handleSelectChamberForBooking}
        />
      )}

      {/* Location Picker Modal (All Locations + Search) */}
      {locationModalVisible && (
        <Modal
          visible={locationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLocationModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setLocationModalVisible(false)}
          >
            <Pressable style={styles.locModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.locModalHeader}>
                <View style={styles.locModalTitleRow}>
                  <View style={styles.locIconBox}>
                    <Icon name="map-pin" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.locModalTitle}>Select Location</Text>
                    <Text style={styles.locModalSub}>Filter specialists by city/town</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.locCloseBtn}
                  onPress={() => setLocationModalVisible(false)}
                >
                  <Icon name="x" size={16} color={Colors.light.ink600} />
                </TouchableOpacity>
              </View>

              {/* Location Search Input */}
              <View style={styles.locSearchBox}>
                <Icon name="search" size={14} color={Colors.light.ink400} />
                <TextInput
                  style={styles.locSearchInput}
                  placeholder="Search city, town, or district..."
                  placeholderTextColor={Colors.light.ink400}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                />
                {locationSearch ? (
                  <TouchableOpacity onPress={() => setLocationSearch('')}>
                    <Icon name="x" size={13} color={Colors.light.ink400} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Locations List */}
              <ScrollView style={styles.locListScroll} showsVerticalScrollIndicator={false}>
                {/* All Locations Option */}
                <TouchableOpacity
                  style={[styles.locItemRow, !selectedCity && styles.locItemRowActive]}
                  onPress={() => {
                    setSelectedCity('');
                    setLocationModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.locItemLeft}>
                    <Icon
                      name="map-pin"
                      size={14}
                      color={!selectedCity ? '#0D9488' : Colors.light.ink400}
                    />
                    <Text
                      style={[
                        styles.locItemText,
                        !selectedCity && styles.locItemTextActive,
                      ]}
                    >
                      All Locations
                    </Text>
                  </View>
                  {!selectedCity && <Icon name="check" size={15} color="#0D9488" />}
                </TouchableOpacity>

                {filteredLocations.map((loc) => {
                  const isSelected = selectedCity.toLowerCase() === loc.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.locItemRow, isSelected && styles.locItemRowActive]}
                      onPress={() => {
                        setSelectedCity(loc);
                        setLocationModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.locItemLeft}>
                        <Icon
                          name="map-pin"
                          size={14}
                          color={isSelected ? '#0D9488' : Colors.light.ink400}
                        />
                        <Text
                          style={[
                            styles.locItemText,
                            isSelected && styles.locItemTextActive,
                          ]}
                        >
                          {loc}
                        </Text>
                      </View>
                      {isSelected && <Icon name="check" size={15} color="#0D9488" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  webSearchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    padding: Spacing.two,
    gap: 8,
    ...Shadows.sm,
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextCol: {
    flex: 1,
  },
  searchSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink400,
    letterSpacing: 0.8,
  },
  locationValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 1,
  },
  clearLocationBtn: {
    padding: 4,
  },
  searchDividerH: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  searchIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputCol: {
    flex: 1,
  },
  searchInput: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink900,
    padding: 0,
    marginTop: 1,
  },
  trySuggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  tryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink400,
  },
  tryChipsScroll: {
    gap: 6,
  },
  tryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tryChipActive: {
    backgroundColor: '#252a67',
    borderColor: '#252a67',
  },
  tryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  tryChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  filterChipActive: {
    backgroundColor: '#252a67',
    borderColor: '#252a67',
  },
  filterChipLiveActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  filterChipTodayActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipLiveTextActive: {
    color: '#DC2626',
  },
  filterChipTodayTextActive: {
    color: '#059669',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  todayGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gradientCardWrapper: {
    borderRadius: 22,
    padding: 2,
    marginBottom: Spacing.three,
    ...Shadows.sm,
  },
  cardInner: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarBoxSquare: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarImgSquare: {
    width: '100%',
    height: '100%',
  },
  avatarGradientFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#252a67',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorMeta: {
    flex: 1,
    gap: 2,
  },
  docNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
    letterSpacing: -0.3,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
    flexShrink: 1,
  },
  systemAndRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  medicalSystemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  medicalSystemText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  ratingDot: {
    fontSize: 11,
    color: Colors.light.ink300,
  },
  expBadgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  expBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  expText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  cardPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  feeHighlightBox: {
    gap: 2,
  },
  feeLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink400,
    letterSpacing: 0.8,
  },
  feeValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  feeAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  feeSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  statusPillWrapper: {
    alignItems: 'flex-end',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    opacity: 0.8,
  },
  availableStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  availableInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  availableStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  unavailableStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  unavailableInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.ink400,
  },
  unavailableStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 6,
  },
  detailsButton: {
    flex: 0.85,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  bookButton: {
    flex: 1.4,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#252a67',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    ...Shadows.sm,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Skeleton Loading Styles */
  skeletonContainer: {
    gap: Spacing.three,
  },
  skeletonCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 1.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  skeletonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl - 1.5,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  skeletonAvatar: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  skeletonMeta: {
    flex: 1,
    gap: 4,
  },
  skeletonLine: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  skeletonPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skeletonButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 8,
  },
  skeletonBtn: {
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },

  /* Location Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 51, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  locModalContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.lg,
  },
  locModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  locIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  locModalSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  locCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  locSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  locListScroll: {
    maxHeight: 280,
  },
  locItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  locItemRowActive: {
    backgroundColor: '#F0FDFA',
  },
  locItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  locItemTextActive: {
    fontWeight: '800',
    color: '#0F766E',
  },
});
