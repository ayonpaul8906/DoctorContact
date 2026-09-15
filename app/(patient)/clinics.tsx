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
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePublicFeaturedClinics,
  usePublicAllClinics,
  type PublicClinic,
} from '../../hooks/usePublicDirectory';
import {
  useSearchLocations,
  FALLBACK_LOCATIONS,
} from '../../hooks/useSearchLocations';
import { Icon, EmptyState, LanguageSwitcher } from '../../components';
import { useLanguage } from '../../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function getClinicInitials(name?: string) {
  if (!name) return 'CL';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getClinicLogoUrl(clinic: PublicClinic): string | null {
  const remote = clinic.logo || (clinic as any).image || (clinic as any).photo || null;
  if (remote && typeof remote === 'string' && (remote.startsWith('http') || remote.startsWith('data:'))) {
    return remote;
  }
  return null;
}

export default function ClinicsDirectoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ filter?: string; q?: string; city?: string }>();

  // Filter mode: 'featured' vs 'all'
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>(
    params.filter === 'featured' ? 'featured' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCity, setSelectedCity] = useState(params.city || 'All Cities');

  // Queries
  const featuredQuery = usePublicFeaturedClinics();
  const allClinicsQuery = usePublicAllClinics();
  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();

  const isFeatured = activeTab === 'featured';
  const isLoading = isFeatured ? featuredQuery.isLoading : allClinicsQuery.isLoading;
  const isError = isFeatured ? featuredQuery.isError : allClinicsQuery.isError;
  const refetch = isFeatured ? featuredQuery.refetch : allClinicsQuery.refetch;

  const rawList = isFeatured
    ? (featuredQuery.data ?? [])
    : (allClinicsQuery.data ?? []);

  const filteredClinics = useMemo(() => {
    return rawList.filter((clinic) => {
      // City filter
      if (selectedCity && selectedCity !== 'All Cities') {
        const cCity = (clinic.city || '').toLowerCase().trim();
        if (cCity !== selectedCity.toLowerCase().trim()) {
          return false;
        }
      }
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (clinic.clinicName || '').toLowerCase();
        const city = (clinic.city || '').toLowerCase();
        const address = (clinic.address || '').toLowerCase();
        const specs = (clinic.specialties || []).map((s) => s.toLowerCase()).join(' ');
        if (!name.includes(q) && !city.includes(q) && !address.includes(q) && !specs.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawList, selectedCity, searchQuery]);

  const handleCallClinic = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    } else {
      Linking.openURL('tel:+919777777777').catch(() => {});
    }
  };

  const handleViewDoctors = (clinic: PublicClinic) => {
    router.push({
      pathname: '/(patient)/doctors',
      params: {
        city: clinic.city || '',
        q: clinic.clinicName || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
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
            {isFeatured
              ? t('section.featuredClinics', 'Featured Clinics')
              : t('section.allClinics', 'All Clinics & Chambers')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {isFeatured
              ? t('section.featuredClinicsSub', 'Top verified clinics and modern healthcare centers')
              : t('section.allClinicsSub', 'Browse verified chambers and clinics near you')}
          </Text>
        </View>

        <LanguageSwitcher compact />
      </View>

      {/* Tabs Toggle: All Clinics vs Featured Clinics */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Icon
            name="building"
            size={14}
            color={activeTab === 'all' ? '#FFFFFF' : Colors.light.ink600}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}
          >
            All Clinics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'featured' && styles.tabButtonActive]}
          onPress={() => setActiveTab('featured')}
          activeOpacity={0.8}
        >
          <Icon
            name="sparkles"
            size={14}
            color={activeTab === 'featured' ? '#FFFFFF' : Colors.light.ink600}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'featured' && styles.tabButtonTextActive]}
          >
            Featured Clinics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={17} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clinic name, city, specialty..."
            placeholderTextColor={Colors.light.ink400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={16} color={Colors.light.ink400} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal City Filter Scroll */}
      <View style={styles.cityFilterBox}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityChips}
        >
          {(searchLocations || FALLBACK_LOCATIONS).map((loc) => {
            const locName = typeof loc === 'string' ? loc : loc.nameEn;
            const isSelected = selectedCity === locName;
            return (
              <TouchableOpacity
                key={locName}
                style={[styles.cityChip, isSelected && styles.cityChipSelected]}
                onPress={() => setSelectedCity(locName)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cityChipText,
                    isSelected && styles.cityChipTextSelected,
                  ]}
                >
                  {locName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Filter Info Badge */}
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: '800', color: Colors.light.ink900 }}>{filteredClinics.length}</Text> {isFeatured ? 'featured clinics' : 'clinics'}
            {selectedCity !== 'All Cities' ? ` in ${selectedCity}` : ''}
          </Text>
          {isFeatured && (
            <View style={styles.featuredBadgePill}>
              <Icon name="shield-check" size={11} color="#0D9488" />
              <Text style={styles.featuredBadgePillText}>Verified Partners</Text>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading clinics directory...</Text>
          </View>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <EmptyState
            title="Failed to load clinics"
            description="We encountered an issue fetching clinic listings. Please try again."
            actionLabel="Retry"
            onActionPress={() => {
              refetch();
            }}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredClinics.length === 0 && (
          <EmptyState
            title="No clinics found"
            description={`No clinics matching "${searchQuery || selectedCity}" were found. Try another city or keyword.`}
            actionLabel="Reset Filters"
            onActionPress={() => {
              setSearchQuery('');
              setSelectedCity('All Cities');
            }}
          />
        )}

        {/* Clinic Cards with 3px Gradient Border */}
        {!isLoading &&
          !isError &&
          filteredClinics.map((clinic) => {
            const logoUrl = getClinicLogoUrl(clinic);
            const cName = clinic.clinicName || 'Healthcare Clinic';
            const city = clinic.city || 'Dubrajpur';
            const address = clinic.address || 'Birbhum, West Bengal';
            const doctorsCount = clinic.doctorsCount ?? 6;
            const rating = clinic.rating ?? 4.8;

            return (
              <LinearGradient
                key={clinic.id}
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCardBorder}
              >
                <View style={styles.cardInner}>
                  {/* Top Row: Logo + Main Info */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.logoContainer}>
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={styles.logoImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={['#14B8A6', '#0D9488']}
                          style={styles.logoFallback}
                        >
                          <Icon name="building" size={24} color="#FFFFFF" />
                          <Text style={styles.logoFallbackText}>
                            {getClinicInitials(cName)}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.verifiedDot}>
                        <Icon name="check" size={10} color="#FFFFFF" />
                      </View>
                    </View>

                    <View style={styles.clinicDetailsCol}>
                      <View style={styles.clinicTitleRow}>
                        <Text style={styles.clinicNameText} numberOfLines={1}>
                          {cName}
                        </Text>
                      </View>

                      <View style={styles.clinicLocationRow}>
                        <Icon name="map-pin" size={12} color="#16A34A" />
                        <Text style={styles.clinicLocationText} numberOfLines={1}>
                          {city} • {address}
                        </Text>
                      </View>

                      {clinic.specialties && clinic.specialties.length > 0 ? (
                        <View style={styles.specialtiesRow}>
                          {clinic.specialties.slice(0, 3).map((spec) => (
                            <View key={spec} style={styles.specPill}>
                              <Text style={styles.specPillText}>{spec}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Bottom Stats & Actions */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.statsGroup}>
                      <View style={styles.docCountBadge}>
                        <Icon name="stethoscope" size={12} color="#0D9488" />
                        <Text style={styles.docCountText}>
                          {doctorsCount} Doctors
                        </Text>
                      </View>

                      <View style={styles.ratingBadge}>
                        <Icon name="star" size={11} color="#EAB308" />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => handleCallClinic(clinic.phone || undefined)}
                        activeOpacity={0.8}
                      >
                        <Icon name="phone" size={13} color={Colors.light.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewDoctorsBtn}
                        onPress={() => handleViewDoctors(clinic)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.viewDoctorsBtnText}>View Doctors</Text>
                        <Icon name="chevron-right" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F1B33',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
  },

  /* Tab Toggle */
  tabToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    padding: 0,
  },

  /* City Filter */
  cityFilterBox: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: Spacing.three,
  },
  cityChips: {
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityChipSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  cityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  cityChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Results Meta */
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  featuredBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  featuredBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },

  /* List */
  listContainer: {
    padding: Spacing.four,
    gap: 14,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },

  /* Card with 3px gradient border */
  gradientCardBorder: {
    borderRadius: 20,
    padding: 3, // 3px gradient border
    ...Shadows.sm,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicDetailsCol: {
    flex: 1,
    gap: 3,
  },
  clinicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  clinicLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicLocationText: {
    fontSize: 11,
    color: Colors.light.ink500,
    flex: 1,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  specPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  specPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  docCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF9C3',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A16207',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  viewDoctorsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
