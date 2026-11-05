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
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePublicFeaturedClinics,
  usePublicAllClinics,
  type PublicClinic,
} from '../hooks/usePublicDirectory';
import {
  useSearchLocations,
  FALLBACK_LOCATIONS,
} from '../hooks/useSearchLocations';
import { getClinicWhatsAppUrl } from '../lib/formatters';
import { Icon, EmptyState, LanguageSwitcher } from '../components';
import { useLanguage } from '../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

function ClinicCardSkeleton() {
  return (
    <View style={styles.skeletonCardWrapper}>
      <View style={styles.skeletonInner}>
        <View style={styles.skeletonHeaderRow}>
          <View style={styles.skeletonLogo} />
          <View style={styles.skeletonMeta}>
            <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 6 }]} />
            <View style={[styles.skeletonLine, { width: '30%', height: 12, marginTop: 6 }]} />
          </View>
        </View>
        <View style={styles.skeletonDivider} />
        <View style={styles.skeletonFooterRow}>
          <View style={[styles.skeletonLine, { width: '25%', height: 14 }]} />
          <View style={[styles.skeletonBtn, { width: 110, height: 34 }]} />
        </View>
      </View>
    </View>
  );
}

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
  const [selectedCity, setSelectedCity] = useState(params.city || '');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // Queries
  const featuredQuery = usePublicFeaturedClinics();
  const allClinicsQuery = usePublicAllClinics();
  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();

  const filteredLocations = useMemo(() => {
    const list = searchLocations.map((l) => (typeof l === 'string' ? l : l.nameEn));
    if (!locationSearch.trim()) return list;
    const q = locationSearch.toLowerCase().trim();
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [searchLocations, locationSearch]);

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
      if (selectedCity) {
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
    }
  };

  const handleWhatsAppClinic = (whatsapp?: string, cName?: string) => {
    if (whatsapp) {
      const url = getClinicWhatsAppUrl(whatsapp, cName);
      if (url) {
        Linking.openURL(url).catch(() => {});
      }
    }
  };

  const handleMapsClinic = (mapsUrl?: string) => {
    if (mapsUrl) {
      Linking.openURL(mapsUrl).catch(() => {});
    }
  };

  const handleViewDoctors = (clinic: PublicClinic) => {
    router.push({
      pathname: '/clinic/[id]' as any,
      params: {
        id: clinic.id,
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
            {t('section.allClinics', 'All Clinics')}
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
            {t('section.featuredClinics', 'Featured Clinics')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Location Bar (Matching Web App) */}
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

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconBox}>
              <Icon name="search" size={15} color={Colors.light.ink500} />
            </View>
            <View style={styles.searchInputCol}>
              <Text style={styles.searchSmallLabel}>SEARCH</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('clinic.searchPrompt', 'Search clinic name, address, services...')}
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

        {/* Quick Suggestion Pills */}
        <View style={styles.trySuggestionsRow}>
          <Text style={styles.tryLabel}>Popular:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tryChipsScroll}
          >
            {['Allopathy', 'Homeopathy', 'Dentistry', 'Orthopedics', 'Cardiology', 'Pediatrics'].map(
              (tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tryChip}
                  onPress={() => setSearchQuery(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tryChipText}>{tag}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
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
            {selectedCity ? ` in ${selectedCity}` : ''}
          </Text>
          {isFeatured && (
            <View style={styles.featuredBadgePill}>
              <Icon name="shield-check" size={11} color="#0D9488" />
              <Text style={styles.featuredBadgePillText}>Verified Partners</Text>
            </View>
          )}
        </View>

        {/* Loading State with Instant Skeleton Loader */}
        {isLoading && filteredClinics.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
          </View>
        ) : null}

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
            description={`No clinics matching "${searchQuery || selectedCity || 'All Locations'}" were found. Try another location or keyword.`}
            actionLabel="Reset Filters"
            onActionPress={() => {
              setSearchQuery('');
              setSelectedCity('');
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
                <TouchableOpacity
                  style={styles.cardInner}
                  onPress={() => handleViewDoctors(clinic)}
                  activeOpacity={0.92}
                >
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
                          style={styles.logoFallback as any}
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
                          {[city, address].filter(Boolean).join(' • ')}
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
                          {doctorsCount} {t('common.doctors', 'Doctors')}
                        </Text>
                      </View>

                      <View style={styles.ratingBadge}>
                        <Icon name="star" size={11} color="#EAB308" />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      {Boolean(clinic.phone && clinic.phone.trim().length > 3) && (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleCallClinic(clinic.phone || undefined)}
                          activeOpacity={0.8}
                          accessibilityLabel="Call Clinic"
                        >
                          <Icon name="phone" size={13} color={Colors.light.primary} />
                        </TouchableOpacity>
                      )}

                      {(() => {
                        const waUrl = clinic.whatsapp
                          ? getClinicWhatsAppUrl(clinic.whatsapp, cName)
                          : null;
                        if (!waUrl) return null;
                        return (
                          <TouchableOpacity
                            style={[
                              styles.callBtn,
                              { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                            ]}
                            onPress={() => Linking.openURL(waUrl).catch(() => {})}
                            activeOpacity={0.8}
                            accessibilityLabel="WhatsApp Clinic"
                          >
                            <Icon name="message-circle" size={13} color="#16A34A" />
                          </TouchableOpacity>
                        );
                      })()}

                      {Boolean(
                        ((clinic as any).googleMapsUrl || (clinic as any).mapUrl) &&
                          String((clinic as any).googleMapsUrl || (clinic as any).mapUrl).trim().length > 5
                      ) && (
                        <TouchableOpacity
                          style={[styles.callBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}
                          onPress={() => handleMapsClinic((clinic as any).googleMapsUrl || (clinic as any).mapUrl)}
                          activeOpacity={0.8}
                          accessibilityLabel="Clinic Map"
                        >
                          <Icon name="map-pin" size={13} color="#DC2626" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.viewDoctorsBtn}
                        onPress={() => handleViewDoctors(clinic)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.viewDoctorsBtnText}>
                          {t('clinic.viewDoctors', 'View Doctors')}
                        </Text>
                        <Icon name="chevron-right" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            );
          })}
      </ScrollView>

      {/* Location Picker Modal (All Locations + Search) */}
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
                  <Text style={styles.locModalSub}>Filter healthcare chambers by city/town</Text>
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
  searchSection: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  tryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
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
  skeletonLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
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
  skeletonFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  skeletonBtn: {
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
