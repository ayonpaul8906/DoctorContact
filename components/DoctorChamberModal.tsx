import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { api } from '../lib/api';
import { formatDoctorName, getClinicWhatsAppUrl } from '../lib/formatters';
import {
  getDoctorSpecialty,
  getDoctorMedicalSystem,
} from '../lib/doctor-specialty';
import type { Doctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorChamberModalProps {
  visible: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  mode?: 'chamber_picker' | 'doctor_profile';
  onBookSlot?: (clinic: any) => void;
}

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

function ChamberCardSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.chamberCard, { opacity: pulseAnim }]}>
      <View style={styles.chamberCardTop}>
        <View style={[styles.clinicIconBox, { backgroundColor: '#E2E8F0' }]} />
        <View style={styles.clinicInfoCol}>
          <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: '85%', height: 12, marginBottom: 8 }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
        </View>
      </View>
      <View style={styles.chamberActionsRow}>
        <View style={[styles.skeletonLine, { width: 68, height: 34, borderRadius: Radius.md }]} />
        <View style={[styles.skeletonLine, { width: 88, height: 34, borderRadius: Radius.md }]} />
        <View style={[styles.skeletonLine, { flex: 1, height: 36, borderRadius: Radius.md }]} />
      </View>
    </Animated.View>
  );
}

export function DoctorChamberModal({
  visible,
  onClose,
  doctor,
  mode = 'chamber_picker',
  onBookSlot,
}: DoctorChamberModalProps) {
  // Fetch full doctor profile unconditionally to comply with React Rules of Hooks
  const {
    data: fullDoctorData,
    isLoading: isLoadingFullDoctor,
    isFetching: isFetchingFullDoctor,
  } = useQuery({
    queryKey: ['doctor-full-profile', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return null;
      try {
        const res = await api.get(`/doctors/${doctor.id}`);
        return res.data?.data || null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(visible && doctor?.id),
    staleTime: 60 * 1000,
  });

  const isChambersLoading = Boolean(
    visible && doctor?.id && (isLoadingFullDoctor || isFetchingFullDoctor || !fullDoctorData)
  );

  if (!doctor) return null;

  const docName = formatDoctorName(doctor.user?.name || 'Doctor');
  const qualification = doctor.qualification || 'MBBS';
  const specialization = getDoctorSpecialty(doctor);
  const docSystem = getDoctorMedicalSystem(doctor);
  const exp = doctor.experience ?? 0;
  const rating = doctor.rating ?? 4.8;
  const reviewCount = doctor.reviewCount ?? 120;
  const avgMinutes = (doctor as any).avgConsultationMinutes ?? 15;

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
    avatarUri.includes('/image/upload/') &&
    !avatarUri.includes('g_face')
  ) {
    avatarUri = avatarUri.replace(
      '/image/upload/',
      '/image/upload/c_thumb,g_face,w_250,h_250,z_0.8/'
    );
  }

  const activeDoctor = fullDoctorData || doctor;

  // Resolve all practicing clinics
  const rawClinics: any[] =
    (activeDoctor as any)?.allClinics && (activeDoctor as any).allClinics.length > 0
      ? (activeDoctor as any).allClinics
      : activeDoctor?.clinic
      ? [activeDoctor.clinic]
      : [];

  const clinics = rawClinics.map((c) => ({
    ...c,
    fee: c.associationDetails?.fee ?? activeDoctor?.fee ?? doctor.fee ?? 500,
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>
              {mode === 'chamber_picker' ? 'Select Chamber to Book' : 'Doctor Profile'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'chamber_picker'
                ? `Choose which chamber you want to visit ${docName} at`
                : 'Verified Specialist Profile & Practice Locations'}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Icon name="x" size={18} color={Colors.light.ink700} />
          </TouchableOpacity>
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
                    <Icon name={docSystem.icon} size={9} color={docSystem.textColor} />
                    <Text style={[styles.medicalSystemText, { color: docSystem.textColor }]}>
                      {docSystem.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.bannerStatsRow}>
                  <View style={styles.ratingBox}>
                    <Icon name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingVal}>{rating.toFixed(1)}</Text>
                    <Text style={styles.ratingSub}>({reviewCount})</Text>
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

          {/* Profile Extra Info (When in profile mode) */}
          {mode === 'doctor_profile' && (
            <View style={styles.aboutCard}>
              <Text style={styles.sectionLabel}>ABOUT SPECIALIST</Text>
              <Text style={styles.aboutText}>
                {docName} is a verified healthcare provider specializing in {specialization} with{' '}
                {exp > 0 ? `${exp}+ years of experience` : 'extensive clinical experience'}. Average
                consultation time is approximately {avgMinutes} minutes.
              </Text>
            </View>
          )}

          {/* Section Heading */}
          <View style={styles.chambersHeaderRow}>
            <View>
              <Text style={styles.chambersSectionTitle}>Registered Chambers</Text>
              <Text style={styles.chambersSectionSub}>
                {isChambersLoading
                  ? 'Loading practicing chambers & consultation schedules...'
                  : `${clinics.length} ${clinics.length === 1 ? 'chamber' : 'chambers'} available for consultation`}
              </Text>
            </View>
          </View>

          {/* Clinics / Chambers List */}
          {isChambersLoading ? (
            <View style={{ gap: Spacing.three }}>
              <ChamberCardSkeleton />
              <ChamberCardSkeleton />
            </View>
          ) : clinics.length === 0 ? (
            <View style={styles.emptyChambersBox}>
              <Icon name="building" size={28} color={Colors.light.ink300} />
              <Text style={styles.emptyChambersTitle}>No Practice Chambers Listed</Text>
              <Text style={styles.emptyChambersSub}>
                Chamber schedules are being updated. Please check back shortly.
              </Text>
            </View>
          ) : (
            clinics.map((clinic: any, index: number) => {
              const cName = clinic.clinicName || 'Clinic Chamber';
              const city = clinic.city || '';
              const address = clinic.address || '';
              const phone = clinic.phone || (clinic as any).contactPhone;
              const whatsapp = clinic.whatsapp;
              const mapUrl = (clinic as any).googleMapsUrl || clinic.mapUrl;
              const hasPhone = Boolean(phone && String(phone).trim().length > 3);
              const hasWhatsApp = Boolean(whatsapp && String(whatsapp).trim().length > 3);
              const hasMaps = Boolean(mapUrl && String(mapUrl).trim().length > 5);

              return (
                <View key={clinic.id || index} style={styles.chamberCard}>
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

                  {/* Actions Row */}
                  <View style={styles.chamberActionsRow}>
                    {/* Call Button (Only if stored in backend!) */}
                    {hasPhone && (
                      <TouchableOpacity
                        style={styles.contactBtnCall}
                        onPress={() => handleCall(phone)}
                        activeOpacity={0.8}
                        accessibilityLabel="Call Clinic"
                      >
                        <Icon name="phone" size={14} color="#2563EB" />
                        <Text style={styles.contactBtnCallText}>Call</Text>
                      </TouchableOpacity>
                    )}

                    {/* WhatsApp Button (Only if stored in backend!) */}
                    {hasWhatsApp && (
                      <TouchableOpacity
                        style={styles.contactBtnWhatsApp}
                        onPress={() => handleWhatsApp(whatsapp, cName)}
                        activeOpacity={0.8}
                        accessibilityLabel="WhatsApp Clinic"
                      >
                        <Icon name="message-circle" size={14} color="#16A34A" />
                        <Text style={styles.contactBtnWhatsAppText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}

                    {/* Google Maps Button (Only if stored in backend!) */}
                    {hasMaps && (
                      <TouchableOpacity
                        style={styles.contactBtnMaps}
                        onPress={() => handleMaps(mapUrl)}
                        activeOpacity={0.8}
                        accessibilityLabel="View Clinic on Google Maps"
                      >
                        <Icon name="map-pin" size={14} color="#DC2626" />
                        <Text style={styles.contactBtnMapsText}>Map</Text>
                      </TouchableOpacity>
                    )}

                    {/* Book Slot Button */}
                    <TouchableOpacity
                      style={styles.bookSlotBtn}
                      onPress={() => {
                        onClose();
                        if (onBookSlot) {
                          onBookSlot(clinic);
                        }
                      }}
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
    </Modal>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.two,
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
    width: 68,
    height: 68,
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
    fontSize: 20,
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
    fontSize: 15,
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
    marginTop: 2,
  },
  specPill: {
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
    paddingVertical: 1.5,
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
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.sm,
  },
});
