import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatDoctorName, getClinicWhatsAppUrl } from '../../lib/formatters';
import {
  getDoctorSpecialty,
  getDoctorMedicalSystem,
  matchesDoctorSpecialtySearch,
} from '../../lib/doctor-specialty';
import { Icon, LanguageSwitcher, EmptyState } from '../../components';
import { useLanguage } from '../../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function getClinicInitials(name?: string) {
  if (!name) return 'CL';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getDoctorInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^dr\.?\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getDoctorFaceUrl(avatarUri?: string | null): string | null {
  if (!avatarUri || typeof avatarUri !== 'string') return null;
  if (
    avatarUri.includes('res.cloudinary.com') &&
    avatarUri.includes('/image/upload/') &&
    !avatarUri.includes('g_face')
  ) {
    return avatarUri.replace(
      '/image/upload/',
      '/image/upload/c_thumb,g_face,w_450,h_450,z_0.85/'
    );
  }
  return avatarUri;
}

export default function ClinicProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clinic, isLoading, isError, refetch } = useQuery({
    queryKey: ['clinic', id],
    queryFn: async () => {
      const res = await api.get(`/clinic/${id}`);
      return res.data?.data || null;
    },
    enabled: Boolean(id),
  });

  const doctorsList: any[] = useMemo(() => {
    if (!clinic?.allDoctors) return [];
    return clinic.allDoctors;
  }, [clinic?.allDoctors]);

  const filteredDoctors = useMemo(() => {
    if (!doctorsList.length) return [];
    if (!searchQuery.trim()) return doctorsList;

    const q = searchQuery.toLowerCase().trim();
    return doctorsList.filter((doc: any) => {
      const day = (doc.associationDetails?.dayOfWeek || '').toLowerCase();
      return matchesDoctorSpecialtySearch(doc, searchQuery) || day.includes(q);
    });
  }, [doctorsList, searchQuery]);

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = (whatsapp?: string) => {
    if (whatsapp) {
      const url = getClinicWhatsAppUrl(whatsapp, clinic?.clinicName);
      if (url) {
        Linking.openURL(url).catch(() => {});
      }
    }
  };

  const handleMaps = (mapUrl?: string, fallbackAddress?: string) => {
    if (mapUrl) {
      Linking.openURL(mapUrl).catch(() => {});
    } else if (fallbackAddress) {
      const query = encodeURIComponent(`${clinic?.clinicName || 'Clinic'}, ${fallbackAddress}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
    }
  };

  const handleBookDoctor = (doc: any) => {
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
    const fee = doc.associationDetails?.fee ?? doc.fee ?? 500;
    router.push({
      pathname: '/book',
      params: {
        doctorId: doc.id,
        doctorName: formatDoctorName(doc.user?.name || 'Doctor'),
        qualification: doc.qualification || '',
        specialization: doc.specialization || '',
        experience: String(doc.experience ?? 0),
        clinicId: clinic.id,
        clinicName: clinic.clinicName || '',
        city: clinic.city || '',
        fee: String(fee),
      },
    });
  };

  const handleDoctorProfile = (doc: any) => {
    router.push({
      pathname: '/doctor/[id]',
      params: {
        id: doc.id,
        clinicId: clinic?.id,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Clinic...</Text>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Fetching clinic & available doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !clinic) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clinic Not Found</Text>
        </View>
        <View style={styles.centerBox}>
          <Icon name="building" size={48} color={Colors.light.ink300} />
          <Text style={styles.errorTitle}>Clinic Profile Unavailable</Text>
          <Text style={styles.errorSub}>
            The clinic information could not be loaded. Please return to the clinics directory.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/clinics')} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Browse Nearby Clinics</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cName = clinic.clinicName || 'Clinic Center';
  const fullAddress = [clinic.address, clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', ');
  const phone = clinic.phone || clinic.contactPhone;
  const whatsapp = clinic.whatsapp;
  const mapUrl = clinic.googleMapsUrl || clinic.mapUrl;
  const hasPhone = Boolean(phone && String(phone).trim().length > 3);
  const hasWhatsApp = Boolean(whatsapp && String(whatsapp).trim().length > 3);
  const hasMaps = Boolean((mapUrl && String(mapUrl).trim().length > 5) || fullAddress);
  const logoUrl = clinic.logo || clinic.image || clinic.photo || null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Navbar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {cName}
          </Text>
          <Text style={styles.headerSubTitle} numberOfLines={1}>
            {clinic.city || 'Healthcare Center'}
          </Text>
        </View>
        <LanguageSwitcher />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HERO CLINIC BANNER ================= */}
        <LinearGradient
          colors={['#0F766E', '#14B8A6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBannerGradient}
        >
          <View style={styles.heroBannerContent}>
            <View style={styles.heroTopRow}>
              {/* Logo / Initials */}
              <View style={styles.heroLogoWrap}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.heroLogoImg} resizeMode="cover" />
                ) : (
                  <View style={styles.heroLogoFallback}>
                    <Text style={styles.heroLogoFallbackText}>{getClinicInitials(cName)}</Text>
                  </View>
                )}
                {clinic.isApproved && (
                  <View style={styles.heroVerifiedBadge}>
                    <Icon name="check" size={11} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Title & Stats */}
              <View style={styles.heroMetaCol}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.verifiedPill}>
                    <Icon name="shield-check" size={11} color="#10B981" />
                    <Text style={styles.verifiedPillText}>Verified Facility</Text>
                  </View>
                  {clinic.onlineConsultationEnabled && (
                    <View style={styles.onlinePill}>
                      <Icon name="activity" size={11} color="#0D9488" />
                      <Text style={styles.onlinePillText}>Online</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.heroClinicName} numberOfLines={2}>
                  {cName}
                </Text>

                <View style={styles.heroRatingRow}>
                  <Icon name="star" size={13} color="#FBBF24" />
                  <Text style={styles.heroRatingText}>{clinic.rating ? String(clinic.rating) : '4.8'}</Text>
                  <Text style={styles.heroDoctorsCount}>
                    • {doctorsList.length} {doctorsList.length === 1 ? 'Doctor' : 'Doctors'} Registered
                  </Text>
                </View>
              </View>
            </View>

            {/* Address Row */}
            {fullAddress ? (
              <View style={styles.heroAddressRow}>
                <Icon name="map-pin" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroAddressText} numberOfLines={2}>
                  {fullAddress}
                </Text>
              </View>
            ) : null}

            {/* Action Buttons Row */}
            {(hasPhone || hasWhatsApp || hasMaps) && (
              <View style={styles.heroActionsRow}>
                {hasPhone && (
                  <TouchableOpacity
                    style={[styles.heroActionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleCall(phone)}
                    activeOpacity={0.85}
                  >
                    <Icon name="phone" size={14} color="#FFFFFF" />
                    <Text style={styles.heroActionBtnText}>Call Clinic</Text>
                  </TouchableOpacity>
                )}

                {hasWhatsApp && (
                  <TouchableOpacity
                    style={[styles.heroActionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={() => handleWhatsApp(whatsapp)}
                    activeOpacity={0.85}
                  >
                    <Icon name="message-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.heroActionBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                )}

                {hasMaps && (
                  <TouchableOpacity
                    style={[styles.heroActionBtn, { backgroundColor: '#2563EB' }]}
                    onPress={() => handleMaps(mapUrl, fullAddress)}
                    activeOpacity={0.85}
                  >
                    <Icon name="map-pin" size={14} color="#FFFFFF" />
                    <Text style={styles.heroActionBtnText}>Get Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ================= DOCTORS AVAILABLE SECTION ================= */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.sectionTagRow}>
                <Icon name="sparkles" size={12} color="#0D9488" />
                <Text style={styles.sectionTag}>PRACTICING TEAM</Text>
              </View>
              <Text style={styles.sectionTitle}>Doctors Available</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
              </Text>
            </View>
          </View>

          {/* Search bar inside this clinic */}
          {doctorsList.length > 2 && (
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search doctors, specializations in this clinic..."
                placeholderTextColor={Colors.light.ink400}
              />
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="x" size={15} color={Colors.light.ink500} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Doctors List */}
          {filteredDoctors.length === 0 ? (
            <View style={styles.emptyDoctorsBox}>
              <Icon name="stethoscope" size={32} color={Colors.light.ink300} />
              <Text style={styles.emptyDoctorsTitle}>No Doctors Found</Text>
              <Text style={styles.emptyDoctorsSub}>
                {searchQuery.trim()
                  ? `No doctor matches "${searchQuery}". Try a different name or specialty.`
                  : 'Doctors will appear here as visiting schedules are updated by the clinic.'}
              </Text>
            </View>
          ) : (
            <View style={styles.doctorsGrid}>
              {filteredDoctors.map((doc: any, index: number) => {
                const docName = formatDoctorName(doc.user?.name || 'Doctor');
                const docQual = doc.qualification || 'MBBS';
                const docSpec = getDoctorSpecialty(doc);
                const docSystem = getDoctorMedicalSystem(doc);
                const fee = doc.associationDetails?.fee ?? doc.fee ?? null;
                const scheduleDay = doc.associationDetails?.dayOfWeek;
                const scheduleTime = doc.associationDetails?.startTime;
                const scheduleEnd = doc.associationDetails?.endTime;
                const avatarUri = getDoctorFaceUrl(
                  doc.profilePhoto || doc.avatar || doc.user?.avatar || (doc as any).image
                );

                return (
                  <View key={doc.id || index} style={styles.doctorCard}>
                    <View style={styles.doctorCardInner}>
                      {/* Top Row: Avatar + Meta */}
                      <View style={styles.doctorCardHeader}>
                        <View style={styles.doctorAvatarBox}>
                          {avatarUri ? (
                            <Image
                              source={{ uri: avatarUri }}
                              style={styles.doctorAvatarImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.doctorAvatarFallback}>
                              <Text style={styles.doctorAvatarFallbackText}>
                                {getDoctorInitials(docName)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.doctorVerifiedBadge}>
                            <Icon name="check" size={9} color="#FFFFFF" />
                          </View>
                        </View>

                        <View style={styles.doctorMetaCol}>
                          <View style={styles.docHeaderTop}>
                            {doc.isPrimary && (
                              <View style={styles.primaryDocBadge}>
                                <Icon name="award" size={10} color="#0F766E" />
                                <Text style={styles.primaryDocBadgeText}>Primary Doctor</Text>
                              </View>
                            )}
                            {fee && (
                              <View style={styles.feeBadge}>
                                <Text style={styles.feeBadgeText}>{'\u20B9'}{fee} / visit</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.doctorName} numberOfLines={1}>
                            {docName}
                          </Text>

                          <View style={styles.specBadgeRow}>
                            <Icon name="stethoscope" size={11} color="#0D9488" />
                            <Text style={styles.specText} numberOfLines={1}>
                              {docSpec}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.clinicDocSysBadge,
                              {
                                backgroundColor: docSystem.bgColor,
                                borderColor: docSystem.borderColor,
                              },
                            ]}
                          >
                            <Icon name={docSystem.icon} size={9} color={docSystem.textColor} />
                            <Text style={[styles.clinicDocSysText, { color: docSystem.textColor }]}>
                              {docSystem.label}
                            </Text>
                          </View>

                          {docQual ? (
                            <Text style={styles.qualText} numberOfLines={1}>
                              {docQual}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Visiting Schedule Row */}
                      {(scheduleDay || scheduleTime) && (
                        <View style={styles.scheduleRow}>
                          <Icon name="clock" size={12} color="#0284C7" />
                          <Text style={styles.scheduleText} numberOfLines={1}>
                            Visiting: {scheduleDay ? `${scheduleDay.slice(0, 3)} ` : ''}
                            {scheduleTime ? `• ${scheduleTime}` : ''}
                            {scheduleEnd ? ` – ${scheduleEnd}` : ''}
                          </Text>
                        </View>
                      )}

                      {/* Divider */}
                      <View style={styles.doctorDivider} />

                      {/* Action Buttons: Details + Book Appointment */}
                      <View style={styles.doctorActionsRow}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => handleDoctorProfile(doc)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailsBtnText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bookBtn}
                          onPress={() => handleBookDoctor(doc)}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={['#0F766E', '#14B8A6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.bookBtnGradient as any}
                          >
                            <Text style={styles.bookBtnText}>Book Appointment</Text>
                            <Icon name="arrow-right" size={13} color="#FFFFFF" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ================= LOCATION & CONTACT SECTION ================= */}
        <View style={styles.locationSection}>
          <View style={styles.locHeaderRow}>
            <Icon name="map-pin" size={16} color="#0D9488" />
            <Text style={styles.locSectionTitle}>Location & Contact</Text>
          </View>

          <View style={styles.locContentCard}>
            <View style={styles.locItemRow}>
              <View style={styles.locIconBox}>
                <Icon name="building" size={14} color="#0F766E" />
              </View>
              <View style={styles.locTextCol}>
                <Text style={styles.locLabel}>Clinic Address</Text>
                <Text style={styles.locVal}>{fullAddress || 'Address details on request'}</Text>
              </View>
            </View>

            {hasPhone && (
              <View style={styles.locItemRow}>
                <View style={styles.locIconBox}>
                  <Icon name="phone" size={14} color="#16A34A" />
                </View>
                <View style={styles.locTextCol}>
                  <Text style={styles.locLabel}>Phone Number</Text>
                  <Text style={styles.locVal}>{phone}</Text>
                </View>
              </View>
            )}

            {hasWhatsApp && (
              <View style={styles.locItemRow}>
                <View style={styles.locIconBox}>
                  <Icon name="message-circle" size={14} color="#10B981" />
                </View>
                <View style={styles.locTextCol}>
                  <Text style={styles.locLabel}>WhatsApp Reception</Text>
                  <Text style={styles.locVal}>+{whatsapp}</Text>
                </View>
              </View>
            )}
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  errorSub: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroBannerGradient: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  heroBannerContent: {
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroLogoWrap: {
    position: 'relative',
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  heroLogoFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoFallbackText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  heroVerifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroMetaCol: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
  },
  verifiedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
  },
  onlinePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  heroClinicName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDoctorsCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroAddressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionWrap: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  countBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: Colors.light.ink900,
    padding: 0,
  },
  emptyDoctorsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyDoctorsTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink800,
  },
  emptyDoctorsSub: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 17,
  },
  doctorsGrid: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  doctorCardInner: {
    padding: 14,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  doctorAvatarBox: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  doctorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  doctorAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#252a67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  doctorVerifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  doctorMetaCol: {
    flex: 1,
  },
  docHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  primaryDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryDocBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  feeBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  feeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  specBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  specText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  clinicDocSysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  clinicDocSysText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  qualText: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    flex: 1,
  },
  doctorDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  doctorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  bookBtn: {
    flex: 2,
    height: 38,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  bookBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  locHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  locSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  locContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  locItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locTextCol: {
    flex: 1,
  },
  locLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  locVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.light.ink800,
    marginTop: 2,
    lineHeight: 17,
  },
});
