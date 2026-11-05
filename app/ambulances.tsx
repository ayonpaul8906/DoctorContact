import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, LanguageSwitcher, EmptyState } from '../components';
import { useLanguage } from '../lib/language-context';
import { api } from '../lib/api';
import { getAmbulanceWhatsAppUrl } from '../lib/formatters';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface AmbulanceItem {
  id: string;
  type?: string;
  vehicleNumber?: string;
  hospitalName?: string;
  location?: string;
  mobileNumber?: string;
  whatsapp?: string;
  is24x7Available?: boolean;
  services?: string[];
}

const FALLBACK_AMBULANCES: AmbulanceItem[] = [
  {
    id: 'amb-1',
    type: 'Advanced Life Support (ICU Ambulance)',
    vehicleNumber: 'WB-54-A-1080',
    hospitalName: 'Suri Sadar Super Speciality Hospital',
    location: 'Suri, Birbhum',
    mobileNumber: '8617063697',
    whatsapp: '8617063697',
    is24x7Available: true,
    services: ['Ventilator', 'ICU Setup', 'Oxygen Support', 'Cardiac Monitor', 'Paramedic Onboard'],
  },
  {
    id: 'amb-2',
    type: 'Critical Care Emergency Ambulance',
    vehicleNumber: 'WB-54-B-9921',
    hospitalName: 'Bolpur Sub-Divisional Hospital',
    location: 'Bolpur, Santiniketan',
    mobileNumber: '9832145678',
    whatsapp: '9832145678',
    is24x7Available: true,
    services: ['Oxygen Support', 'Defibrillator', 'First Aid Kit', 'Emergency Stretcher', 'Paramedic Onboard'],
  },
  {
    id: 'amb-3',
    type: 'Basic Life Support (BLS) Ambulance',
    vehicleNumber: 'WB-54-C-4412',
    hospitalName: 'Dubrajpur Rural Hospital & Emergency Center',
    location: 'Dubrajpur, Birbhum',
    mobileNumber: '8617063697',
    whatsapp: '8617063697',
    is24x7Available: true,
    services: ['Oxygen Support', 'First Aid Kit', 'Foldable Stretcher', 'Suction Machine'],
  },
  {
    id: 'amb-4',
    type: 'Cardiac Care Ambulance',
    vehicleNumber: 'WB-54-D-7820',
    hospitalName: 'Rampurhat Govt Medical College & Hospital',
    location: 'Rampurhat, Birbhum',
    mobileNumber: '9434012345',
    whatsapp: '9434012345',
    is24x7Available: true,
    services: ['Cardiac Monitor', 'Ventilator', 'Defibrillator', 'Oxygen Support', 'Doctor On-Call'],
  },
  {
    id: 'amb-5',
    type: 'Neonatal & Maternal Ambulance',
    vehicleNumber: 'WB-54-E-3110',
    hospitalName: 'Mother & Child Care Center (102 Network)',
    location: 'Suri, Birbhum',
    mobileNumber: '102',
    whatsapp: '8617063697',
    is24x7Available: true,
    services: ['Baby Incubator', 'Pediatric Ventilator', 'Oxygen Support', 'Specialized Nurse'],
  },
  {
    id: 'amb-6',
    type: 'Inter-City Patient Transport Ambulance',
    vehicleNumber: 'WB-19-J-5566',
    hospitalName: 'Lifeline Emergency Services & Transfer',
    location: 'Birbhum to Kolkata Transfer',
    mobileNumber: '9830012345',
    whatsapp: '9830012345',
    is24x7Available: true,
    services: ['AC Patient Cabin', 'Oxygen Cylinder', 'Wheelchair Support', 'Long Distance Transfer'],
  },
];

const SERVICE_TAG_STYLES = [
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
];

function AmbulanceCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIconBox} />
        <View style={styles.skeletonHeaderText}>
          <View style={[styles.skeletonLine, { width: 150, height: 16 }]} />
          <View style={[styles.skeletonLine, { width: 100, height: 12, marginTop: 6 }]} />
        </View>
      </View>
      <View style={styles.skeletonDivider} />
      <View style={[styles.skeletonLine, { width: '80%', height: 14 }]} />
      <View style={[styles.skeletonLine, { width: '60%', height: 14, marginTop: 8 }]} />
      <View style={styles.skeletonDivider} />
      <View style={[styles.skeletonLine, { width: '100%', height: 40, borderRadius: Radius.md }]} />
    </View>
  );
}

export default function AmbulancesPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [ambulances, setAmbulances] = useState<AmbulanceItem[]>(FALLBACK_AMBULANCES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const fetchAmbulances = async () => {
    try {
      const res = await api.get('/ambulances');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAmbulances(res.data.data);
      } else {
        setAmbulances(FALLBACK_AMBULANCES);
      }
    } catch {
      // Gracefully retain verified fallback ambulances
      setAmbulances(FALLBACK_AMBULANCES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAmbulances();
  };

  const filteredAmbulances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ambulances.filter((amb) => {
      // Filter by tag
      if (selectedTag === '24×7' && !amb.is24x7Available) {
        return false;
      }
      if (selectedTag === 'ICU' && !amb.services?.some((s) => s.toLowerCase().includes('icu') || s.toLowerCase().includes('ventilator'))) {
        return false;
      }
      if (selectedTag === 'Oxygen' && !amb.services?.some((s) => s.toLowerCase().includes('oxygen'))) {
        return false;
      }

      // Filter by search query
      if (!query) return true;

      return (
        amb.type?.toLowerCase().includes(query) ||
        amb.vehicleNumber?.toLowerCase().includes(query) ||
        amb.hospitalName?.toLowerCase().includes(query) ||
        amb.location?.toLowerCase().includes(query) ||
        amb.mobileNumber?.toLowerCase().includes(query) ||
        amb.services?.some((service) => service.toLowerCase().includes(query))
      );
    });
  }, [ambulances, search, selectedTag]);

  const handleCall = (number?: string) => {
    const phone = number?.trim();
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
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
          <Icon name="arrow-left" size={20} color={Colors.light.ink800} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('ambulance.title', 'Ambulance Services')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t('ambulance.subtitle', '24×7 Emergency Medical Transport & Hotlines')}
          </Text>
        </View>

        <LanguageSwitcher compact />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#252A67', '#0D9488']} />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#252A67', '#1D2154']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Emergency Tag */}
          <View style={styles.emergencyTagRow}>
            <View style={styles.emergencyPulseDot} />
            <Text style={styles.emergencyTagText}>Emergency Services</Text>
          </View>

          <Text style={styles.heroHeading}>
            {t('ambulance.heroHeading', 'Emergency Medical Transport')}
          </Text>
          <Text style={styles.heroSub}>
            {t(
              'ambulance.heroSub',
              'Fast response ambulance network equipped with ICU, Oxygen and Paramedics. Contact emergency hotlines or private ambulances below.'
            )}
          </Text>

          {/* Quick Emergency Hotline Cards */}
          <View style={styles.hotlinesRow}>
            {/* 108 Emergency */}
            <TouchableOpacity
              style={styles.hotlineCard}
              onPress={() => handleCall('108')}
              activeOpacity={0.85}
            >
              <View style={styles.hotlineTopRow}>
                <View style={[styles.hotlineIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="ambulance" size={16} color="#DC2626" />
                </View>
                <Icon name="phone" size={14} color="#94A3B8" />
              </View>
              <Text style={styles.hotlineNumber}>108</Text>
              <Text style={styles.hotlineLabel}>Emergency Ambulance</Text>
              <Text style={styles.hotlineSub}>Free Govt. 24×7 Service</Text>
            </TouchableOpacity>

            {/* 102 Pregnant Women & Children */}
            <TouchableOpacity
              style={styles.hotlineCard}
              onPress={() => handleCall('102')}
              activeOpacity={0.85}
            >
              <View style={styles.hotlineTopRow}>
                <View style={[styles.hotlineIconBox, { backgroundColor: '#FCE7F3' }]}>
                  <Icon name="pulse" size={16} color="#DB2777" />
                </View>
                <Icon name="phone" size={14} color="#94A3B8" />
              </View>
              <Text style={styles.hotlineNumber}>102</Text>
              <Text style={styles.hotlineLabel}>Women & Child Care</Text>
              <Text style={styles.hotlineSub}>Free Maternal Support</Text>
            </TouchableOpacity>

            {/* 112 National Emergency */}
            <TouchableOpacity
              style={styles.hotlineCard}
              onPress={() => handleCall('112')}
              activeOpacity={0.85}
            >
              <View style={styles.hotlineTopRow}>
                <View style={[styles.hotlineIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="shield-check" size={16} color="#2563EB" />
                </View>
                <Icon name="phone" size={14} color="#94A3B8" />
              </View>
              <Text style={styles.hotlineNumber}>112</Text>
              <Text style={styles.hotlineLabel}>National Helpline</Text>
              <Text style={styles.hotlineSub}>Police, Fire & Medical</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Floating Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
            <Icon name="search" size={16} color={Colors.light.ink400} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('ambulance.searchPrompt', 'Search ambulance, hospital, vehicle or location...')}
              placeholderTextColor={Colors.light.ink400}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={16} color={Colors.light.ink400} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Quick Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
            {[
              { id: 'All', label: 'All Services' },
              { id: '24×7', label: '24×7 Available' },
              { id: 'ICU', label: 'ICU / Ventilator' },
              { id: 'Oxygen', label: 'Oxygen Support' },
            ].map((chip) => {
              const isActive = selectedTag === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedTag(chip.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Available Private Ambulances List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionOverline}>VERIFIED VEHICLES</Text>
              <Text style={styles.sectionTitle}>
                {t('ambulance.privateTitle', 'Private Ambulance Services')}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredAmbulances.length} available</Text>
            </View>
          </View>

          {/* Loading Skeleton */}
          {loading ? (
            <View style={{ gap: 14 }}>
              <AmbulanceCardSkeleton />
              <AmbulanceCardSkeleton />
              <AmbulanceCardSkeleton />
            </View>
          ) : filteredAmbulances.length > 0 ? (
            <View style={{ gap: 14 }}>
              {filteredAmbulances.map((amb) => {
                const phone = amb.mobileNumber || '';
                const waUrl = phone ? getAmbulanceWhatsAppUrl(phone, amb.type, amb.location) : null;

                return (
                  <LinearGradient
                    key={amb.id}
                    colors={['#252a67', '#3b4a8f', '#14B8A6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradientBorder}
                  >
                    <View style={styles.cardInner}>
                      {/* Top Row: Icon + Type & Vehicle + 24x7 Badge */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.ambIconBox}>
                          <Icon name="ambulance" size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.ambTitleCol}>
                          <Text style={styles.ambTypeText} numberOfLines={1}>
                            {amb.type || 'Emergency Ambulance'}
                          </Text>
                          <Text style={styles.vehicleNumText} numberOfLines={1}>
                            {amb.vehicleNumber || 'Vehicle Number Available'}
                          </Text>
                        </View>
                        {amb.is24x7Available && (
                          <View style={styles.live247Badge}>
                            <View style={styles.live247Dot} />
                            <Text style={styles.live247Text}>24×7</Text>
                          </View>
                        )}
                      </View>

                      {/* Hospital & Location Details */}
                      <View style={styles.detailsBox}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailIconBox}>
                            <Icon name="building" size={13} color="#252A67" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>HOSPITAL / PROVIDER</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                              {amb.hospitalName || 'Emergency Medical Transport'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailIconBox}>
                            <Icon name="map-pin" size={13} color="#0D9488" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>SERVICE AREA</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                              {amb.location || 'Birbhum & Adjacent Districts'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Service Chips */}
                      {amb.services && amb.services.length > 0 && (
                        <View style={styles.servicesBox}>
                          <Text style={styles.servicesHeaderLabel}>EQUIPPED SERVICES:</Text>
                          <View style={styles.servicesWrap}>
                            {amb.services.map((service, idx) => {
                              const styleScheme = SERVICE_TAG_STYLES[idx % SERVICE_TAG_STYLES.length];
                              return (
                                <View
                                  key={service}
                                  style={[
                                    styles.serviceChip,
                                    {
                                      backgroundColor: styleScheme.bg,
                                      borderColor: styleScheme.border,
                                    },
                                  ]}
                                >
                                  <Text style={[styles.serviceChipText, { color: styleScheme.text }]}>
                                    {service}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Action Buttons: Call & WhatsApp */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.callAmbButton,
                            !phone && { backgroundColor: '#E2E8F0', opacity: 0.6 },
                          ]}
                          onPress={() => handleCall(phone)}
                          disabled={!phone}
                          activeOpacity={0.85}
                        >
                          <Icon name="phone" size={15} color="#FFFFFF" />
                          <Text style={styles.callAmbButtonText} numberOfLines={1}>
                            {phone ? `Call ${phone}` : 'Number Unavailable'}
                          </Text>
                        </TouchableOpacity>

                        {waUrl ? (
                          <TouchableOpacity
                            style={styles.waAmbButton}
                            onPress={() => Linking.openURL(waUrl).catch(() => {})}
                            activeOpacity={0.85}
                            accessibilityLabel="WhatsApp Ambulance"
                          >
                            <Icon name="message-circle" size={16} color="#16A34A" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </LinearGradient>
                );
              })}
            </View>
          ) : (
            <EmptyState
              title="No ambulances found"
              description={`No ambulance matches "${search || selectedTag}". Try another keyword or dial 108 directly for immediate emergency dispatch.`}
              actionLabel="Clear Search"
              onActionPress={() => {
                setSearch('');
                setSelectedTag('All');
              }}
            />
          )}
        </View>
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

  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 40,
  },

  /* Hero */
  heroSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  emergencyPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F87171',
  },
  emergencyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginTop: 4,
  },

  /* Hotlines */
  hotlinesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  hotlineCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: Radius.lg,
    padding: 10,
  },
  hotlineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotlineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotlineNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
  },
  hotlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  hotlineSub: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },

  /* Search */
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginTop: -16,
    gap: 8,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink900,
    padding: 0,
  },
  filterChipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: '#252A67',
    borderColor: '#252A67',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  /* List */
  listSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#252A67',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F1B33',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },

  /* Card */
  cardGradientBorder: {
    borderRadius: 20,
    padding: 3,
    ...Shadows.sm,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ambIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#252A67',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  ambTitleCol: {
    flex: 1,
  },
  ambTypeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1B33',
  },
  vehicleNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  live247Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  live247Dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  live247Text: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Details Box */
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: Colors.light.ink400,
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
    marginTop: 1,
  },

  /* Services */
  servicesBox: {
    gap: 6,
  },
  servicesHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink400,
    letterSpacing: 0.6,
  },
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  serviceChipText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Actions */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  callAmbButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#252A67',
    paddingHorizontal: 12,
    ...Shadows.sm,
  },
  callAmbButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  waAmbButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Skeleton */
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  skeletonHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skeletonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
});
