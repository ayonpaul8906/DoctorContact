import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Platform,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePublicDiagnosticCenters,
  type PublicDiagnosticCenter,
} from '../hooks/usePublicDirectory';
import {
  useSearchLocations,
  FALLBACK_LOCATIONS,
} from '../hooks/useSearchLocations';
import { getLabWhatsAppUrl } from '../lib/formatters';
import { Icon, EmptyState, LanguageSwitcher } from '../components';
import { useLanguage } from '../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

function LabCardSkeleton() {
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
          <View style={styles.skeletonLogo} />
          <View style={styles.skeletonMeta}>
            <View style={[styles.skeletonLine, { width: '65%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '45%', height: 12, marginTop: 6 }]} />
            <View style={[styles.skeletonLine, { width: '35%', height: 12, marginTop: 6 }]} />
          </View>
        </View>
        <View style={styles.skeletonDivider} />
        <View style={styles.skeletonFooterRow}>
          <View style={[styles.skeletonBtn, { flex: 1, height: 36 }]} />
          <View style={[styles.skeletonBtn, { flex: 1.2, height: 36, backgroundColor: '#CCFBF1' }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function LabsDirectoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ q?: string; city?: string }>();

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCity, setSelectedCity] = useState(params.city || '');
  const [homeServiceOnly, setHomeServiceOnly] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // Queries
  const { data: centers = [], isLoading, isError, refetch } = usePublicDiagnosticCenters();
  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();

  const filteredLocations = useMemo(() => {
    const list = searchLocations.map((l) => (typeof l === 'string' ? l : l.nameEn));
    if (!locationSearch.trim()) return list;
    const q = locationSearch.toLowerCase().trim();
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [searchLocations, locationSearch]);

  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      // Home service filter
      if (homeServiceOnly && !center.hasHomeService) {
        return false;
      }

      // City filter
      if (selectedCity) {
        const cCity = (center.city || '').toLowerCase().trim();
        if (cCity !== selectedCity.toLowerCase().trim()) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (center.centerName || '').toLowerCase();
        const city = (center.city || '').toLowerCase();
        const address = (center.address || '').toLowerCase();
        const matchesTest = (center.centerTests || []).some((ct) =>
          (ct.diagnosticTest?.name || '').toLowerCase().includes(q)
        );

        if (!name.includes(q) && !city.includes(q) && !address.includes(q) && !matchesTest) {
          return false;
        }
      }

      return true;
    });
  }, [centers, selectedCity, searchQuery, homeServiceOnly]);

  const handleCallLab = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleOpenLab = (labId: string) => {
    router.push({
      pathname: '/lab/[id]' as any,
      params: { id: labId },
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
            {t('quick.diagnosticLabs', 'Diagnostic Labs & Scans')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t('quick.diagnosticLabsDesc', 'Verified pathology centers, blood tests & diagnostic imaging')}
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

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconBox}>
              <Icon name="search" size={15} color={Colors.light.ink500} />
            </View>
            <View style={styles.searchInputCol}>
              <Text style={styles.searchSmallLabel}>SEARCH</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('lab.searchPrompt', 'Search diagnostic tests, labs, scans...')}
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

        {/* Filter Row: Home Sample Collection Pill */}
        <View style={styles.filterRowBox}>
          <TouchableOpacity
            style={[
              styles.homeServicePill,
              homeServiceOnly && styles.homeServicePillActive,
            ]}
            onPress={() => setHomeServiceOnly((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Icon
              name="home"
              size={13}
              color={homeServiceOnly ? '#FFFFFF' : '#0D9488'}
            />
            <Text
              style={[
                styles.homeServicePillText,
                homeServiceOnly && styles.homeServicePillTextActive,
              ]}
            >
              {t('lab.homeCollection', 'Home Sample Collection')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Test Suggestions */}
        <View style={styles.trySuggestionsRow}>
          <Text style={styles.tryLabel}>Popular:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tryChipsScroll}
          >
            {['CBC', 'Lipid Profile', 'Thyroid Panel', 'Liver Function', 'USG Abdomen', 'Blood Glucose'].map(
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
        {/* Results Meta Info */}
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: '800', color: Colors.light.ink900 }}>{filteredCenters.length}</Text> diagnostic labs
            {selectedCity ? ` in ${selectedCity}` : ''}
          </Text>
          {homeServiceOnly && (
            <View style={styles.homeFilterBadge}>
              <Icon name="check" size={11} color="#0D9488" />
              <Text style={styles.homeFilterBadgeText}>Home Visits</Text>
            </View>
          )}
        </View>

        {/* Loading State with Instant Skeleton Loader */}
        {isLoading && filteredCenters.length === 0 ? (
          <View style={styles.skeletonContainer}>
            <LabCardSkeleton />
            <LabCardSkeleton />
            <LabCardSkeleton />
          </View>
        ) : null}

        {/* Error State */}
        {isError && !isLoading && (
          <EmptyState
            title="Failed to load labs"
            description="We encountered an issue fetching diagnostic centers. Please try again."
            actionLabel="Retry"
            onActionPress={() => {
              refetch();
            }}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCenters.length === 0 && (
          <EmptyState
            title="No diagnostic labs found"
            description={`No labs matching "${searchQuery || selectedCity || 'All Locations'}" were found. Try another location or keyword.`}
            actionLabel="Reset Filters"
            onActionPress={() => {
              setSearchQuery('');
              setSelectedCity('');
              setHomeServiceOnly(false);
            }}
          />
        )}

        {/* Diagnostic Lab Cards with Web-matched Gradient Border */}
        {!isLoading &&
          !isError &&
          filteredCenters.map((center) => {
            const centerName = center.centerName || 'Diagnostic Center';
            const city = center.city || 'Birbhum';
            const address = center.address || 'Main Road';
            const rating = center.rating ?? 4.8;
            const reviewCount = center.reviewCount ?? 120;
            const testsCount = center.testsCount || (center.centerTests ? center.centerTests.length : 35);
            const tests = center.centerTests || [];

            const labLogo = center.logo || (center as any).image || (center as any).photo;

            return (
              <LinearGradient
                key={center.id}
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCardWrapper}
              >
                <TouchableOpacity
                  style={styles.cardInner}
                  onPress={() => handleOpenLab(center.id)}
                  activeOpacity={0.9}
                >
                  {/* Top Header: Logo/Icon + Name + Badges */}
                  <View style={styles.labHeaderRow}>
                    {labLogo ? (
                      <View style={styles.labLogoBox}>
                        <Image
                          source={{ uri: labLogo }}
                          style={styles.labLogoImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#252a67', '#0D9488']}
                        style={styles.labLogoBox as any}
                      >
                        <Icon name="flask" size={22} color="#FFFFFF" />
                      </LinearGradient>
                    )}

                    <View style={styles.labHeaderInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.labNameText} numberOfLines={1}>
                          {centerName}
                        </Text>
                        <Icon name="chevron-right" size={15} color={Colors.light.ink400} />
                      </View>

                      <View style={styles.locationRow}>
                        <Icon name="map-pin" size={13} color="#16A34A" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {[city, address].filter(Boolean).join(' • ')}
                        </Text>
                      </View>

                      <View style={styles.ratingRow}>
                        <View style={styles.ratingBadge}>
                          <Icon name="star" size={11} color="#EAB308" />
                          <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                        <Text style={styles.reviewText}>({reviewCount} reviews)</Text>
                        <View style={styles.dotSeparator} />
                        <Text style={styles.testsCountText}>{testsCount}+ Tests</Text>
                      </View>
                    </View>
                  </View>

                  {/* Feature Badges Row */}
                  <View style={styles.badgesRow}>
                    {center.hasHomeService ? (
                      <View style={styles.homeServiceBadge}>
                        <Icon name="home" size={12} color="#15803D" />
                        <Text style={styles.homeServiceText}>Home Sample Collection</Text>
                      </View>
                    ) : null}
                    <View style={styles.reportBadge}>
                      <Icon name="file-text" size={12} color="#1D4ED8" />
                      <Text style={styles.reportText}>Digital Reports</Text>
                    </View>
                  </View>

                  {/* Popular Tests Showcase */}
                  {tests.length > 0 ? (
                    <View style={styles.testsPreviewBox}>
                      <Text style={styles.testsPreviewTitle}>Popular Tests Available:</Text>
                      <View style={styles.testPillsContainer}>
                        {tests.slice(0, 3).map((ct) => (
                          <View key={ct.id} style={styles.testPill}>
                            <Text style={styles.testPillName} numberOfLines={1}>
                              {ct.diagnosticTest?.name || 'Pathology Test'}
                            </Text>
                            <Text style={styles.testPillPrice}>{'\u20B9'}{ct.price}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Card Actions: Call Lab, WhatsApp, View Tests */}
                  <View style={styles.actionsRow}>
                    {Boolean(center.phone && center.phone.trim().length > 3) && (
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCallLab(center.phone)}
                        activeOpacity={0.8}
                      >
                        <Icon name="phone" size={14} color="#0D9488" />
                        <Text style={styles.callButtonText}>{t('common.callLab', 'Call Lab')}</Text>
                      </TouchableOpacity>
                    )}

                    {(() => {
                      const labPhone = center.phone || (center as any).whatsapp;
                      const waUrl = labPhone ? getLabWhatsAppUrl(labPhone, centerName) : null;
                      if (!waUrl) return null;
                      return (
                        <TouchableOpacity
                          style={styles.waButton}
                          onPress={() => Linking.openURL(waUrl).catch(() => {})}
                          activeOpacity={0.8}
                          accessibilityLabel="WhatsApp Lab"
                        >
                          <Icon name="message-circle" size={14} color="#16A34A" />
                        </TouchableOpacity>
                      );
                    })()}

                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleOpenLab(center.id)}
                      activeOpacity={0.85}
                    >
                      <Icon name="flask" size={14} color="#FFFFFF" />
                      <Text style={styles.bookButtonText}>View Tests</Text>
                      <Icon name="arrow-right" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
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
                  <Text style={styles.locModalSub}>Filter diagnostic laboratories by city/town</Text>
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
    marginTop: 1,
  },
  /* Web-aligned Search Section */
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
  filterRowBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  homeServicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  homeServicePillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  homeServicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  homeServicePillTextActive: {
    color: '#FFFFFF',
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
  listContainer: {
    padding: Spacing.four,
    paddingBottom: 40,
    gap: Spacing.four,
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    fontSize: 13,
    color: Colors.light.ink600,
  },
  homeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  homeFilterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  gradientCardWrapper: {
    borderRadius: 20,
    padding: 3,
    ...Shadows.sm,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  labHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  labLogoBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  labLogoImage: {
    width: '100%',
    height: '100%',
  },
  labHeaderInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#A16207',
  },
  reviewText: {
    fontSize: 11,
    color: Colors.light.ink400,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.light.ink300,
  },
  testsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  homeServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  homeServiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  reportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  testsPreviewBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: Radius.md,
    padding: Spacing.two,
    gap: 4,
  },
  testsPreviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B21A8',
  },
  testPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  testPillName: {
    fontSize: 11,
    color: Colors.light.ink800,
    maxWidth: 160,
  },
  testPillPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  waButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#0D9488',
    ...Shadows.sm,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    gap: Spacing.two,
    paddingTop: 4,
  },
  skeletonBtn: {
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
});
