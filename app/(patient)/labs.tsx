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
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePublicDiagnosticCenters,
  type PublicDiagnosticCenter,
} from '../../hooks/usePublicDirectory';
import {
  useSearchLocations,
  FALLBACK_LOCATIONS,
} from '../../hooks/useSearchLocations';
import { Icon, EmptyState, LanguageSwitcher } from '../../components';
import { useLanguage } from '../../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function LabsDirectoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ q?: string; city?: string }>();

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCity, setSelectedCity] = useState(params.city || 'All Cities');
  const [homeServiceOnly, setHomeServiceOnly] = useState(false);

  // Queries
  const { data: centers = [], isLoading, isError, refetch } = usePublicDiagnosticCenters();
  const { data: searchLocations = FALLBACK_LOCATIONS } = useSearchLocations();

  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      // Home service filter
      if (homeServiceOnly && !center.hasHomeService) {
        return false;
      }

      // City filter
      if (selectedCity && selectedCity !== 'All Cities') {
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
    } else {
      Linking.openURL('tel:+919777777777').catch(() => {});
    }
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

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={17} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('lab.searchPrompt', 'Search lab name, blood test, city...')}
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

      {/* Horizontal Filter Row (Home Service Toggle + City Filter) */}
      <View style={styles.filterRowBox}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {/* Home Service Filter Pill */}
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
              color={homeServiceOnly ? '#FFFFFF' : '#7C3AED'}
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

          {/* City Chips */}
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
        {/* Results Meta Info */}
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: '800', color: Colors.light.ink900 }}>{filteredCenters.length}</Text> diagnostic labs
            {selectedCity !== 'All Cities' ? ` in ${selectedCity}` : ''}
          </Text>
          {homeServiceOnly && (
            <View style={styles.homeFilterBadge}>
              <Icon name="check" size={11} color="#7C3AED" />
              <Text style={styles.homeFilterBadgeText}>Home Visits</Text>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading diagnostic labs...</Text>
          </View>
        )}

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
            description={`No labs matching "${searchQuery || selectedCity}" were found. Try clearing filters.`}
            actionLabel="Reset Filters"
            onActionPress={() => {
              setSearchQuery('');
              setSelectedCity('All Cities');
              setHomeServiceOnly(false);
            }}
          />
        )}

        {/* Diagnostic Lab Cards with 3px Gradient Border */}
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

            return (
              <LinearGradient
                key={center.id}
                colors={['#252a67', '#3b4a8f', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCardWrapper}
              >
                <View style={styles.cardInner}>
                  {/* Top Header: Logo/Icon + Name + Badges */}
                  <View style={styles.labHeaderRow}>
                    <View style={styles.labLogoBox}>
                      <Icon name="flask" size={24} color="#FFFFFF" />
                    </View>

                    <View style={styles.labHeaderInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.labNameText} numberOfLines={1}>
                          {centerName}
                        </Text>
                        <Icon name="check-circle" size={15} color="#7C3AED" />
                      </View>

                      <View style={styles.locationRow}>
                        <Icon name="map-pin" size={13} color="#16A34A" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {city} • {address}
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
                            <Text style={styles.testPillPrice}>₹{ct.price}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Card Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCallLab(center.phone)}
                      activeOpacity={0.8}
                    >
                      <Icon name="phone" size={14} color="#7C3AED" />
                      <Text style={styles.callButtonText}>{t('common.callLab', 'Call Lab')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleCallLab(center.phone)}
                      activeOpacity={0.85}
                    >
                      <Icon name="calendar" size={14} color="#FFFFFF" />
                      <Text style={styles.bookButtonText}>{t('common.bookTest', 'Book Test')}</Text>
                      <Icon name="arrow-right" size={13} color="#FFFFFF" />
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
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    height: 44,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  filterRowBox: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: Spacing.three,
  },
  filterChips: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  homeServicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  homeServicePillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  homeServicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  homeServicePillTextActive: {
    color: '#FFFFFF',
  },
  cityChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  cityChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
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
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  bookButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#7C3AED',
    ...Shadows.sm,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
