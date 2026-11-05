import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
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
} from '../../lib/doctor-specialty';
import { Icon, LanguageSwitcher } from '../../components';
import { useLanguage } from '../../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function getInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();

  const { data: doctor, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${id}`);
      return res.data?.data || null;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Profile...</Text>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#252a67" />
          <Text style={styles.loadingText}>Fetching doctor details & chambers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !doctor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
        </View>
        <View style={styles.centerBox}>
          <Icon name="alert-circle" size={32} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Doctor Not Found</Text>
          <Text style={styles.errorSub}>
            This profile could not be loaded or may no longer be available.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const docName = formatDoctorName(doctor.user?.name || 'Doctor');
  const qualification = doctor.qualification || 'MBBS';
  const specialization = getDoctorSpecialty(doctor);
  const docSystem = getDoctorMedicalSystem(doctor);
  const exp = doctor.experience ?? 0;
  const rating = doctor.rating ?? 4.8;
  const reviewCount = doctor.reviewCount ?? 120;
  const avgMinutes = doctor.avgConsultationMinutes ?? 15;

  let avatarUri =
    doctor.profilePhoto ||
    doctor.avatar ||
    doctor.user?.avatar ||
    (doctor as any).image ||
    null;

  if (
    avatarUri &&
    typeof avatarUri === 'string' &&
    avatarUri.includes('res.cloudinary.com') &&
    avatarUri.includes('/image/upload/') &&
    !avatarUri.includes('g_face')
  ) {
    avatarUri = avatarUri.replace(
      '/image/upload/',
      '/image/upload/c_thumb,g_face,w_250,h_250,z_0.8/'
    );
  }

  // Resolve all practicing clinics
  const rawClinics: any[] =
    doctor.allClinics && doctor.allClinics.length > 0
      ? doctor.allClinics
      : doctor.clinic
      ? [doctor.clinic]
      : [];

  const clinics = rawClinics.map((c: any) => ({
    ...c,
    fee: c.associationDetails?.fee ?? doctor.fee ?? 500,
  }));

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = (whatsapp?: string, cName?: string) => {
    if (whatsapp) {
      const url = getClinicWhatsAppUrl(whatsapp, cName, docName);
      if (url) {
        Linking.openURL(url).catch(() => {});
      }
    }
  };

  const handleMaps = (mapUrl?: string) => {
    if (mapUrl) {
      Linking.openURL(mapUrl).catch(() => {});
    }
  };

  const handleBookClinic = (clinic: any) => {
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
    router.push({
      pathname: '/book',
      params: {
        doctorId: doctor.id,
        doctorName: docName,
        qualification: qualification,
        specialization: specialization,
        experience: String(exp),
        clinicId: clinic.id,
        clinicName: clinic.clinicName || '',
        city: clinic.city || '',
        fee: String(clinic.fee),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {docName}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {specialization}
          </Text>
        </View>
        <LanguageSwitcher compact />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Header Banner Card */}
        <LinearGradient
          colors={['#252a67', '#3b4a8f', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.docBannerInner}>
            <View style={styles.avatarBox}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatarImg,
                    Platform.OS === 'web' && ({ objectPosition: 'center 15%' } as any),
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#252a67', '#3b4a8f', '#14B8A6']}
                  style={styles.avatarGradient as any}
                >
                  <Text style={styles.avatarInitials}>{getInitials(docName)}</Text>
                </LinearGradient>
              )}
              <View style={styles.verifiedCheck}>
                <Icon name="check" size={10} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.docBannerMeta}>
              <Text style={styles.docNameText} numberOfLines={1}>
                {docName}
              </Text>
              <Text style={styles.docQualText} numberOfLines={1}>
                {qualification}
              </Text>

              <View style={styles.specRow}>
                <View style={styles.specPill}>
                  <Icon name="stethoscope" size={10} color="#0D9488" />
                  <Text style={styles.specPillText}>{specialization}</Text>
                </View>

                <View
                  style={[
                    styles.medicalSystemBadge,
                    {
                      backgroundColor: docSystem.bgColor,
                      borderColor: docSystem.borderColor,
                    },
                  ]}
                >
                  <Icon name={docSystem.icon} size={10} color={docSystem.textColor} />
                  <Text style={[styles.medicalSystemText, { color: docSystem.textColor }]}>
                    {docSystem.label}
                  </Text>
                </View>
              </View>

              <View style={styles.bannerStatsRow}>
                <View style={styles.ratingBox}>
                  <Icon name="star" size={11} color="#F59E0B" />
                  <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
                  <Text style={styles.ratingSub}>({reviewCount} reviews)</Text>
                </View>

                {exp > 0 && (
                  <View style={styles.expBox}>
                    <Icon name="sparkles" size={11} color="#0D9488" />
                    <Text style={styles.expVal}>{exp}+ yrs exp</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Highlights Row */}
        <View style={styles.highlightsRow}>
          <View style={styles.highlightCard}>
            <Icon name="clock" size={16} color="#252a67" />
            <Text style={styles.highlightVal}>Avg. {avgMinutes}m</Text>
            <Text style={styles.highlightLabel}>Consultation</Text>
          </View>

          <View style={styles.highlightCard}>
            <Icon name="shield-check" size={16} color="#0D9488" />
            <Text style={styles.highlightVal}>Verified</Text>
            <Text style={styles.highlightLabel}>Specialist</Text>
          </View>

          <View style={styles.highlightCard}>
            <Icon name="building" size={16} color="#3B4A8F" />
            <Text style={styles.highlightVal}>{clinics.length}</Text>
            <Text style={styles.highlightLabel}>Chambers</Text>
          </View>
        </View>

        {/* About Card */}
        <View style={styles.aboutCard}>
          <Text style={styles.sectionLabel}>ABOUT SPECIALIST</Text>
          <Text style={styles.aboutText}>
            {docName} is a verified medical professional with {exp > 0 ? `${exp}+ years of experience` : 'extensive clinical experience'}, specializing in {specialization}. Average consultation duration is approximately {avgMinutes} minutes.
          </Text>
        </View>

        {/* Practice Chambers Heading */}
        <View style={styles.chambersHeaderRow}>
          <Text style={styles.chambersSectionTitle}>Practice Chambers &amp; Hospitals</Text>
          <Text style={styles.chambersSectionSub}>
            Book a slot or contact any of the verified chambers below
          </Text>
        </View>

        {/* Chambers List */}
        {clinics.length === 0 ? (
          <View style={styles.emptyChambersBox}>
            <Icon name="building" size={28} color={Colors.light.ink300} />
            <Text style={styles.emptyChambersTitle}>No Practice Chambers Listed</Text>
            <Text style={styles.emptyChambersSub}>
              Consultation schedules are currently being updated.
            </Text>
          </View>
        ) : (
          clinics.map((clinic: any, idx: number) => {
            const cName = clinic.clinicName || 'Clinic Chamber';
            const city = clinic.city || '';
            const address = clinic.address || '';
            const phone = clinic.phone || clinic.contactPhone;
            const whatsapp = clinic.whatsapp;
            const mapUrl = clinic.googleMapsUrl || clinic.mapUrl;
            const hasPhone = Boolean(phone && String(phone).trim().length > 3);
            const hasWhatsApp = Boolean(whatsapp && String(whatsapp).trim().length > 3);
            const hasMaps = Boolean(mapUrl && String(mapUrl).trim().length > 5);

            return (
              <View key={clinic.id || idx} style={styles.chamberCard}>
                <View style={styles.chamberCardTop}>
                  <View style={styles.clinicIconBox}>
                    <Icon name="building" size={16} color="#0D9488" />
                  </View>

                  <View style={styles.clinicInfoCol}>
                    <View style={styles.clinicTitleRow}>
                      <Text style={styles.clinicNameText} numberOfLines={1}>
                        {cName}
                      </Text>
                      {clinic.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>

                    {(city || address) ? (
                      <View style={styles.clinicAddressRow}>
                        <Icon name="map-pin" size={11} color="#16A34A" />
                        <Text style={styles.clinicAddressText} numberOfLines={1}>
                          {[address, city].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.feeBadge}>
                      <Text style={styles.feeLabel}>Fee: </Text>
                      <Text style={styles.feeVal}>{'\u20B9'}{clinic.fee}</Text>
                      <Text style={styles.feePer}> / consultation</Text>
                    </View>
                  </View>
                </View>

                {/* Actions Row: Phone, WhatsApp, Maps (strictly if stored!) and Book Slot */}
                <View style={styles.chamberActionsRow}>
                  {hasPhone && (
                    <TouchableOpacity
                      style={styles.contactBtnCall}
                      onPress={() => handleCall(phone)}
                      activeOpacity={0.8}
                    >
                      <Icon name="phone" size={14} color="#2563EB" />
                      <Text style={styles.contactBtnCallText}>Call</Text>
                    </TouchableOpacity>
                  )}

                  {hasWhatsApp && (
                    <TouchableOpacity
                      style={styles.contactBtnWhatsApp}
                      onPress={() => handleWhatsApp(whatsapp, cName)}
                      activeOpacity={0.8}
                    >
                      <Icon name="message-circle" size={14} color="#16A34A" />
                      <Text style={styles.contactBtnWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}

                  {hasMaps && (
                    <TouchableOpacity
                      style={styles.contactBtnMaps}
                      onPress={() => handleMaps(mapUrl)}
                      activeOpacity={0.8}
                    >
                      <Icon name="map-pin" size={14} color="#DC2626" />
                      <Text style={styles.contactBtnMapsText}>Map</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.bookSlotBtn}
                    onPress={() => handleBookClinic(clinic)}
                    activeOpacity={0.85}
                  >
                    <Icon name="calendar" size={13} color="#FFFFFF" />
                    <Text style={styles.bookSlotBtnText}>Book Slot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: Spacing.three,
  },
  backBtn: {
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.danger,
    marginTop: Spacing.two,
  },
  errorSub: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    maxWidth: 260,
  },
  retryBtn: {
    marginTop: Spacing.three,
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  gradientBorder: {
    borderRadius: Radius.xl,
    padding: 2,
    ...Shadows.sm,
  },
  docBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl - 2,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatarBox: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#252a67',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docBannerMeta: {
    flex: 1,
    gap: 2,
  },
  docNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  docQualText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.ink500,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  specPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  medicalSystemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  medicalSystemText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bannerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  ratingSub: {
    fontSize: 10,
    color: Colors.light.ink400,
  },
  expBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  expVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0D9488',
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  highlightLabel: {
    fontSize: 9,
    color: Colors.light.ink400,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.ink400,
  },
  aboutText: {
    fontSize: 12,
    color: Colors.light.ink700,
    lineHeight: 18,
  },
  chambersHeaderRow: {
    marginTop: Spacing.two,
  },
  chambersSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  chambersSectionSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  emptyChambersBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyChambersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyChambersSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  chamberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    ...Shadows.sm,
  },
  chamberCardTop: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  clinicIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicInfoCol: {
    flex: 1,
    gap: 3,
  },
  clinicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clinicNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  clinicAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicAddressText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  feeLabel: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  feeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  feePer: {
    fontSize: 10,
    color: Colors.light.ink400,
  },
  chamberActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.two,
  },
  contactBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  contactBtnCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  contactBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  contactBtnWhatsAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  contactBtnMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  contactBtnMapsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  bookSlotBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#252a67',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  bookSlotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
