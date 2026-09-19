import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDoctorSearch } from '../../hooks/useDoctorSearch';
import { usePublicFeaturedDoctors } from '../../hooks/usePublicDirectory';
import { Icon, EmptyState, LanguageSwitcher } from '../../components';
import { useLanguage } from '../../lib/language-context';
import type { Doctor } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const LOCAL_DOCTOR_PHOTOS: Record<string, any> = {
  doc1: require('../../assets/home/doc1.jpg'),
  doc3: require('../../assets/home/doc3.jpg'),
  doc4: require('../../assets/home/doc4.jpg'),
  hero: require('../../assets/home/hero-doctor.jpg'),
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
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ filter?: string; q?: string; city?: string }>();
  const isFeaturedOnly = params.filter === 'featured';

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCity, setSelectedCity] = useState(params.city || '');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const isLoading = isFeaturedOnly ? featuredQuery.isLoading : generalSearch.isLoading;
  const isError = isFeaturedOnly ? featuredQuery.isError : generalSearch.isError;
  const refetch = isFeaturedOnly ? featuredQuery.refetch : generalSearch.refetch;

  const rawDoctorList = isFeaturedOnly ? (featuredQuery.data ?? []) : (generalSearch.data ?? []);

  const doctorList = useMemo(() => {
    let list = rawDoctorList;

    // Filter by query client-side if needed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((doc) => {
        const name = (doc.user?.name || '').toLowerCase();
        const spec = (doc.specialization || '').toLowerCase();
        const clinic = (doc.clinic?.clinicName || '').toLowerCase();
        const city = (doc.clinic?.city || '').toLowerCase();
        return name.includes(q) || spec.includes(q) || clinic.includes(q) || city.includes(q);
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
  }, [rawDoctorList, searchQuery, filterMode]);

  const handleBookDoctor = (doctor: Doctor) => {
    router.push({
      pathname: '/(patient)/book',
      params: {
        doctorId: doctor.id,
        doctorName: doctor.user?.name || '',
        qualification: doctor.qualification || '',
        specialization: doctor.specialization || '',
        experience: String(doctor.experience ?? 0),
        clinicId: doctor.clinicId,
        clinicName: doctor.clinic?.clinicName || '',
        city: doctor.clinic?.city || '',
        fee: String(doctor.fee ?? 0),
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

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isFeaturedOnly
                ? t('section.featuredDoctorsSub', 'Filter featured specialists...')
                : t('doctor.searchPrompt', 'Search doctors by name, specialty, or clinic...')
            }
            placeholderTextColor={Colors.light.ink400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={16} color={Colors.light.ink400} />
            </TouchableOpacity>
          ) : null}
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
        </View>
      </View>

      {/* Doctor Cards List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Finding available doctors...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && isError && (
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
        {!isLoading && !isError && doctorList.length === 0 && (
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
        {!isLoading &&
          !isError &&
          doctorList.map((doctor) => {
            const docName = doctor.user?.name || 'Doctor';
            const clinicName = doctor.clinic?.clinicName || 'Dewasi Healthcare';
            const city = doctor.clinic?.city || 'Main Branch';
            const exp = doctor.experience ?? 0;
            const rating = doctor.rating ?? 4.5;
            const reviewCount = doctor.reviewCount ?? 120;
            const liveStatus = doctor.liveStatus;
            const isLive = liveStatus?.isLive ?? false;
            const isAvailable = liveStatus ? liveStatus.isAvailable : (doctor.isAvailable ?? true);
            const isFav = !!favorites[doctor.id];

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
                  {/* Favorite Button */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(doctor.id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="heart"
                      size={14}
                      color={isFav ? '#EF4444' : Colors.light.ink400}
                    />
                  </TouchableOpacity>

                  {/* Top Row: Avatar + Info */}
                  <View style={styles.doctorHeaderRow}>
                    <View style={styles.avatarBoxSquare}>
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          style={[
                            styles.avatarImgSquare,
                            Platform.OS === 'web' && ({ objectPosition: 'center 20%' } as any),
                          ]}
                          resizeMode="cover"
                        />
                      ) : localPhoto ? (
                        <Image
                          source={localPhoto}
                          style={[
                            styles.avatarImgSquare,
                            Platform.OS === 'web' && ({ objectPosition: 'center 20%' } as any),
                          ]}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={['#252a67', '#3b4a8f', '#14B8A6']}
                          style={styles.avatarGradientFallback}
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

                      <Text style={styles.specialtyText} numberOfLines={1}>
                        {doctor.specialization || doctor.qualification || 'General Specialist'}
                      </Text>

                      {/* Rating Row */}
                      <View style={styles.ratingRow}>
                        <Icon name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
                        <Text style={styles.ratingDot}>•</Text>
                        <Text style={styles.reviewsText}>{reviewCount} reviews</Text>
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

                  {/* Clinic Location Section */}
                  <View style={styles.clinicSection}>
                    <View style={styles.clinicHeaderRow}>
                      <Icon name="map-pin" size={11} color="#0F766E" />
                      <Text style={styles.clinicHeaderLabel}>CLINIC</Text>
                    </View>

                    <View style={styles.clinicDetailsRow}>
                      <Text style={styles.clinicNameText} numberOfLines={1}>
                        {clinicName}{city ? `, ${city}` : ''}
                      </Text>
                      {doctor.fee != null && (
                        <Text style={styles.feeInlineText}>
                          ₹{doctor.fee}
                          <Text style={styles.feeSubText}> {t('doctor.perVisit', '/ visit')}</Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Live Status Pill */}
                  <View style={styles.statusPillRow}>
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
                          {t('doctor.available', 'Available now')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.unavailableStatusPill}>
                        <View style={styles.unavailableInnerDot} />
                        <Text style={styles.unavailableStatusText}>
                          {t('doctor.unavailable', 'Currently unavailable')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => handleBookDoctor(doctor)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsButtonText}>{t('common.details', 'Details')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleBookDoctor(doctor)}
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1.5,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    height: 46,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
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
  loadingContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '600',
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
  favoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    paddingRight: 32,
    gap: 3,
  },
  docNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
    letterSpacing: -0.3,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.ink500,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
  reviewsText: {
    fontSize: 11,
    color: Colors.light.ink500,
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
  clinicSection: {
    gap: 2,
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink400,
    letterSpacing: 0.8,
  },
  clinicDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  clinicNameText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  feeInlineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#252a67',
  },
  feeSubText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.ink400,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
});
