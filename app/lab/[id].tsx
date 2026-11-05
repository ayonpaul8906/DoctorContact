import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getLabWhatsAppUrl } from '../../lib/formatters';
import { Icon, LanguageSwitcher, EmptyState } from '../../components';
import { useLanguage } from '../../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

interface CenterTestItem {
  id: string;
  price: number;
  isAvailable?: boolean;
  diagnosticTest?: {
    id: string;
    name: string;
    description?: string | null;
  };
  name?: string;
  description?: string;
}

function TestCardSkeleton() {
  return (
    <View style={styles.skeletonTestCard}>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skeletonLine, { width: '65%', height: 16 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: 70, height: 28, borderRadius: Radius.md }]} />
    </View>
  );
}

export default function PublicLabDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();

  const [testSearch, setTestSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Public Lab Details from Backend
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-center', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/diagnostic-centers/public/${id}`);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (err) {
        // Fallback: search in all approved centers
        const allRes = await api.get('/diagnostic-centers/all');
        const centers = allRes.data?.data?.centers || [];
        const match = centers.find((c: any) => c.id === id);
        if (match) {
          return {
            center: match,
            tests: match.centerTests || match.availableTests || [],
          };
        }
        throw err;
      }
      return null;
    },
    enabled: Boolean(id),
  });

  const center = data?.center;
  const rawTests: CenterTestItem[] = useMemo(() => {
    return data?.tests || center?.centerTests || center?.availableTests || [];
  }, [data?.tests, center]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const centerName = center?.centerName || 'Diagnostic Center';
  const city = center?.city || '';
  const address = center?.address || '';
  const phone = center?.phone || '';
  const whatsapp = center?.whatsapp || phone || '';
  const hasHomeService = Boolean(center?.hasHomeService);
  const isApproved = Boolean(center?.isApproved);
  const isOnline = Boolean(center?.isOnline);
  const labLogo = center?.logo || center?.image || center?.photo || null;

  // Filter tests by search keyword
  const filteredTests = useMemo(() => {
    if (!rawTests.length) return [];
    if (!testSearch.trim()) return rawTests;

    const q = testSearch.toLowerCase().trim();
    return rawTests.filter((item) => {
      const name = (item.diagnosticTest?.name || item.name || '').toLowerCase();
      const desc = (item.diagnosticTest?.description || item.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [rawTests, testSearch]);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    } else {
      Alert.alert('Phone Unavailable', 'This diagnostic laboratory has not listed a phone number yet.');
    }
  };

  const handleWhatsApp = (testName?: string) => {
    const targetNumber = whatsapp || phone;
    const url = targetNumber ? getLabWhatsAppUrl(targetNumber, centerName, testName) : null;
    if (url) {
      Linking.openURL(url).catch(() => {});
    } else {
      Alert.alert('WhatsApp Unavailable', 'WhatsApp contact is currently not available for this center.');
    }
  };

  const handleOpenMap = () => {
    if (center?.googleMapsUrl) {
      Linking.openURL(center.googleMapsUrl).catch(() => {});
    } else if (address || city) {
      const query = encodeURIComponent(`${centerName}, ${address}, ${city}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
    } else {
      Alert.alert('Location Map', 'Directions are not available for this center.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {centerName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {city ? `${city} • Diagnostic Laboratory` : 'Diagnostic Laboratory & Scans'}
          </Text>
        </View>

        <LanguageSwitcher compact />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0D9488', '#252A67']} />
        }
      >
        {/* Loading State */}
        {isLoading && !center ? (
          <View style={styles.loadingContainer}>
            <View style={styles.skeletonHeroBanner} />
            <View style={styles.skeletonSection}>
              <TestCardSkeleton />
              <TestCardSkeleton />
              <TestCardSkeleton />
            </View>
          </View>
        ) : null}

        {/* Error State */}
        {!isLoading && isError && !center ? (
          <EmptyState
            title="Lab Not Found"
            description="The diagnostic laboratory you are looking for is currently unavailable or has been removed."
            actionLabel="Back to Labs"
            onActionPress={() => router.back()}
          />
        ) : null}

        {/* Lab Content */}
        {center ? (
          <>
            {/* Hero / Banner with Backend Lab Image */}
            <View style={styles.heroBannerWrapper}>
              {labLogo ? (
                <View style={styles.labImageFrame}>
                  <Image
                    source={{ uri: labLogo }}
                    style={styles.labHeroImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 27, 51, 0.75)']}
                    style={styles.imageOverlayGradient}
                  />
                </View>
              ) : (
                <LinearGradient
                  colors={['#252A67', '#0D9488']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.labHeroGradientFallback as any}
                >
                  <Icon name="flask" size={48} color="#FFFFFF" />
                </LinearGradient>
              )}

              {/* Verified Pill */}
              {isApproved && (
                <View style={styles.verifiedFloatingBadge}>
                  <Icon name="shield-check" size={13} color="#0D9488" />
                  <Text style={styles.verifiedFloatingText}>Verified Diagnostic Center</Text>
                </View>
              )}
            </View>

            {/* Profile Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labTitleText}>{centerName}</Text>
                  {(address || city) ? (
                    <View style={styles.addressRow}>
                      <Icon name="map-pin" size={13} color="#0D9488" />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {[address, city].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Status Indicator */}
                <View
                  style={[
                    styles.statusPill,
                    isOnline ? styles.statusPillOnline : styles.statusPillOffline,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isOnline ? styles.statusDotOnline : styles.statusDotOffline,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      isOnline ? styles.statusTextOnline : styles.statusTextOffline,
                    ]}
                  >
                    {isOnline ? 'Open Now' : 'Consulting Hours'}
                  </Text>
                </View>
              </View>

              {/* Feature Badges */}
              <View style={styles.badgesWrapper}>
                {hasHomeService && (
                  <View style={styles.featureBadgeTeal}>
                    <Icon name="home" size={12} color="#0F766E" />
                    <Text style={styles.featureBadgeTealText}>Home Sample Collection</Text>
                  </View>
                )}
                <View style={styles.featureBadgeBlue}>
                  <Icon name="file-text" size={12} color="#1D4ED8" />
                  <Text style={styles.featureBadgeBlueText}>Digital Lab Reports</Text>
                </View>
                <View style={styles.featureBadgePurple}>
                  <Icon name="check-circle" size={12} color="#6D28D9" />
                  <Text style={styles.featureBadgePurpleText}>NABL Standard Pathology</Text>
                </View>
              </View>

              {/* Action Buttons Row: Call, WhatsApp, Directions */}
              <View style={styles.actionButtonsRow}>
                {Boolean(phone) && (
                  <TouchableOpacity
                    style={styles.callActionButton}
                    onPress={handleCall}
                    activeOpacity={0.85}
                  >
                    <Icon name="phone" size={15} color="#0D9488" />
                    <Text style={styles.callActionButtonText}>Call Lab</Text>
                  </TouchableOpacity>
                )}

                {Boolean(whatsapp || phone) && (
                  <TouchableOpacity
                    style={styles.waActionButton}
                    onPress={() => handleWhatsApp()}
                    activeOpacity={0.85}
                  >
                    <Icon name="message-circle" size={15} color="#16A34A" />
                    <Text style={styles.waActionButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.mapActionButton}
                  onPress={handleOpenMap}
                  activeOpacity={0.85}
                >
                  <Icon name="map-pin" size={15} color="#252A67" />
                  <Text style={styles.mapActionButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Available Tests Section */}
            <View style={styles.testsSection}>
              <View style={styles.testsSectionHeader}>
                <View>
                  <Text style={styles.testsSectionOverline}>PATHOLOGY & DIAGNOSTICS</Text>
                  <Text style={styles.testsSectionTitle}>Available Tests & Scans</Text>
                </View>
                <View style={styles.testsCountBadge}>
                  <Text style={styles.testsCountBadgeText}>
                    {rawTests.length} {rawTests.length === 1 ? 'Test' : 'Tests'}
                  </Text>
                </View>
              </View>

              {/* Test Search Input */}
              <View style={styles.testSearchBox}>
                <Icon name="search" size={15} color={Colors.light.ink400} />
                <TextInput
                  style={styles.testSearchInput}
                  placeholder="Search available tests in this lab (e.g. CBC, Lipid, Thyroid)..."
                  placeholderTextColor={Colors.light.ink400}
                  value={testSearch}
                  onChangeText={setTestSearch}
                  clearButtonMode="while-editing"
                />
                {testSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setTestSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x" size={15} color={Colors.light.ink400} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Filter Tag Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testFilterChips}>
                {['All', 'CBC', 'Lipid', 'Thyroid', 'Liver', 'Blood Glucose', 'USG'].map((chip) => {
                  const isSelected = chip === 'All' ? !testSearch : testSearch.toLowerCase() === chip.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.testFilterChip, isSelected && styles.testFilterChipActive]}
                      onPress={() => setTestSearch(chip === 'All' ? '' : chip)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.testFilterChipText, isSelected && styles.testFilterChipTextActive]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Tests List */}
              <View style={styles.testsListWrap}>
                {filteredTests.length > 0 ? (
                  filteredTests.map((testItem) => {
                    const testName = testItem.diagnosticTest?.name || testItem.name || 'Diagnostic Test';
                    const testDesc = testItem.diagnosticTest?.description || testItem.description || null;
                    const price = testItem.price;

                    return (
                      <View key={testItem.id} style={styles.testCard}>
                        <View style={styles.testCardMain}>
                          <View style={styles.testNameCol}>
                            <Text style={styles.testCardTitle}>{testName}</Text>
                            {testDesc ? (
                              <Text style={styles.testCardDesc} numberOfLines={2}>
                                {testDesc}
                              </Text>
                            ) : null}
                            <View style={styles.testMetaRow}>
                              <View style={styles.testTag}>
                                <Text style={styles.testTagText}>Verified Pathology</Text>
                              </View>
                              {hasHomeService && (
                                <View style={[styles.testTag, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}>
                                  <Text style={[styles.testTagText, { color: '#0F766E' }]}>Home Collection</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.testPriceCol}>
                            <Text style={styles.testPriceText}>{'\u20B9'}{price}</Text>
                            <TouchableOpacity
                              style={styles.bookTestBtn}
                              onPress={() => handleWhatsApp(testName)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.bookTestBtnText}>Book / Inquire</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noTestsCard}>
                    <Icon name="flask" size={28} color={Colors.light.ink400} />
                    <Text style={styles.noTestsTitle}>No tests matching query</Text>
                    <Text style={styles.noTestsSub}>
                      Try clearing search or contact the lab directly to inquire about this test.
                    </Text>
                    <TouchableOpacity
                      style={styles.clearSearchBtn}
                      onPress={() => setTestSearch('')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearSearchBtnText}>Reset Test Filter</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </>
        ) : null}
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F1B33',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },

  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 40,
  },

  /* Hero Banner */
  heroBannerWrapper: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  labImageFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  labHeroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  labHeroGradientFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedFloatingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    ...Shadows.sm,
  },
  verifiedFloatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },

  /* Overview Card */
  overviewCard: {
    marginHorizontal: Spacing.four,
    marginTop: -28,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.four,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  labTitleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F1B33',
    lineHeight: 24,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  addressText: {
    fontSize: 12,
    color: Colors.light.ink600,
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillOnline: {
    backgroundColor: '#DCFCE7',
  },
  statusPillOffline: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOnline: {
    backgroundColor: '#16A34A',
  },
  statusDotOffline: {
    backgroundColor: '#94A3B8',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextOnline: {
    color: '#15803D',
  },
  statusTextOffline: {
    color: Colors.light.ink600,
  },

  /* Badges */
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadgeTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  featureBadgeTealText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  featureBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  featureBadgeBlueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  featureBadgePurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  featureBadgePurpleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
  },

  /* Action Buttons */
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  callActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  callActionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },
  waActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  waActionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapActionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#252A67',
  },

  /* Tests Section */
  testsSection: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    gap: 12,
  },
  testsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  testsSectionOverline: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#0D9488',
  },
  testsSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F1B33',
    marginTop: 1,
  },
  testsCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testsCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink600,
  },

  /* Search Box */
  testSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    ...Shadows.sm,
  },
  testSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.light.ink900,
    padding: 0,
  },
  testFilterChips: {
    gap: 6,
    paddingVertical: 2,
  },
  testFilterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testFilterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  testFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  testFilterChipTextActive: {
    color: '#FFFFFF',
  },

  /* Tests List */
  testsListWrap: {
    gap: 10,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  testCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  testNameCol: {
    flex: 1,
    gap: 3,
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1B33',
  },
  testCardDesc: {
    fontSize: 11,
    color: Colors.light.ink500,
    lineHeight: 15,
  },
  testMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  testTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  testTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  testPriceCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  testPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D9488',
  },
  bookTestBtn: {
    backgroundColor: '#252A67',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  bookTestBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* No Tests */
  noTestsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noTestsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1B33',
  },
  noTestsSub: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 17,
  },
  clearSearchBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },

  /* Skeletons */
  loadingContainer: {
    gap: 14,
  },
  skeletonHeroBanner: {
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  skeletonSection: {
    paddingHorizontal: Spacing.four,
    gap: 10,
  },
  skeletonTestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonLine: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
});
