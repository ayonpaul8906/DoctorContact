import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import {
  useDoctorReceivedRequests,
  useDoctorSentRequests,
} from '../../hooks/useDoctor';
import {
  GradientCard,
  Icon,
  DoctorProfilePhotoModal,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function getInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ProfileFieldItemProps {
  label: string;
  value?: string | number | null;
  icon: any;
  isLocked?: boolean;
  fallbackText?: string;
}

function ProfileFieldItem({
  label,
  value,
  icon,
  isLocked = true,
  fallbackText = 'Not provided',
}: ProfileFieldItemProps) {
  const displayValue =
    value !== undefined && value !== null && String(value).trim() !== ''
      ? String(value)
      : fallbackText;
  const isFallback = displayValue === fallbackText;

  return (
    <View style={styles.fieldBox}>
      <View style={styles.fieldTopRow}>
        <View style={styles.fieldLabelGroup}>
          <Icon name={icon} size={14} color={Colors.light.primary} />
          <Text style={styles.fieldLabelText}>{label}</Text>
        </View>
        {isLocked && (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={10} color={Colors.light.ink500} />
            <Text style={styles.lockBadgeText}>Read-Only</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.fieldValueText, isFallback && styles.fieldValueFallback]}
        numberOfLines={1}
      >
        {displayValue}
      </Text>
    </View>
  );
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, logout, refetchUser } = useAuth();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Queries for practice associations
  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
    isRefetching: isRefetchingReceived,
  } = useDoctorReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
    isRefetching: isRefetchingSent,
  } = useDoctorSentRequests();

  const isRefreshing = isRefetchingReceived || isRefetchingSent;

  // Derived metrics and practice meta (matching webapp)
  const {
    activeClinicsCount,
    acceptedCount,
    pendingCount,
    specialization,
    qualification,
  } = useMemo(() => {
    const all = [...receivedRequests, ...sentRequests];
    const accepted = all.filter((r) => r.status === 'ACCEPTED');
    const pending = all.filter((r) => r.status === 'PENDING');

    const clinics = new Set<string>();
    accepted.forEach((r) => {
      const cId = r.clinicId || r.clinic?.id;
      if (cId) clinics.add(cId);
    });

    const docWithSpec = all.find((r) => Boolean((r.doctor as any)?.specialization));
    const spec = (docWithSpec?.doctor as any)?.specialization || 'General Physician';

    const docWithQual = all.find((r) => Boolean((r.doctor as any)?.qualification));
    const qual = (docWithQual?.doctor as any)?.qualification || 'MBBS, MD';

    return {
      activeClinicsCount: clinics.size,
      acceptedCount: accepted.length,
      pendingCount: pending.length,
      specialization: spec,
      qualification: qual,
    };
  }, [receivedRequests, sentRequests]);

  const handleRefreshAll = async () => {
    await Promise.all([refetchUser(), refetchReceived(), refetchSent()]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out of your doctor portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Avatar URL resolved from user avatar or doctor profile photo
  const photoUrl =
    user?.avatar ||
    (receivedRequests.find((r) => Boolean((r.doctor as any)?.profilePhoto))?.doctor as any)?.profilePhoto ||
    (sentRequests.find((r) => Boolean((r.doctor as any)?.profilePhoto))?.doctor as any)?.profilePhoto ||
    null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* 1. Header (ProfileHeader from Web) */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradientCard}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitlesCol}>
              <View style={styles.headerBadgeRow}>
                <Text style={styles.headerMainTitle}>Doctor Profile</Text>
                <View style={styles.roleVerifiedPill}>
                  <Icon name="user-check" size={12} color="#1D4ED8" />
                  <Text style={styles.roleVerifiedPillText}>
                    Verified {user?.role || 'DOCTOR'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSubtitleText}>
                View your verified medical practice credentials, contact details, and account profile settings.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.headerRefreshBtn}
              onPress={handleRefreshAll}
              disabled={isRefreshing}
              activeOpacity={0.8}
            >
              <Icon
                name="refresh-cw"
                size={14}
                color={Colors.light.ink700}
              />
              <Text style={styles.headerRefreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 2. Avatar & Identity Banner (ProfileAvatar from Web) */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBannerCard}
        >
          <View style={styles.avatarBannerContent}>
            <View style={styles.avatarLeftCol}>
              {/* Avatar Container with Camera Button */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircleBox}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#1e3a8a', '#3b82f6']}
                      style={styles.initialsGradientFallback as any}
                    >
                      <Text style={styles.initialsText}>{getInitials(user?.name)}</Text>
                    </LinearGradient>
                  )}
                </View>

                {/* Camera Overlay Button */}
                <TouchableOpacity
                  style={styles.cameraOverlayBtn}
                  onPress={() => setIsPhotoModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Icon name="camera" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Identity Meta */}
              <View style={styles.identityMetaCol}>
                <View style={styles.doctorNameRow}>
                  <Text style={styles.doctorNameText} numberOfLines={1}>
                    Dr. {user?.name || 'Doctor'}
                  </Text>
                  <View style={styles.practitionerChip}>
                    <Icon name="check-circle" size={11} color="#059669" />
                    <Text style={styles.practitionerChipText}>Verified</Text>
                  </View>
                </View>

                <Text style={styles.practitionerRoleSub}>
                  Medical Practitioner • Verified Account
                </Text>
              </View>
            </View>

            {/* Change Photo CTA Button */}
            <TouchableOpacity
              style={styles.changePhotoCtaBtn}
              onPress={() => setIsPhotoModalOpen(true)}
              activeOpacity={0.85}
            >
              <Icon name="camera" size={13} color="#FFFFFF" />
              <Text style={styles.changePhotoCtaBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 3. Real Derived Statistics (ProfileStats from Web) */}
        <View style={styles.statsGrid}>
          {/* Associated Clinics */}
          <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradientCard}
          >
            <View style={styles.statCardInner}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardTitle}>Associated Clinics</Text>
                <View style={styles.statIconBox}>
                  <Icon name="building" size={15} color="#2563EB" />
                </View>
              </View>
              <View style={styles.statNumbersRow}>
                <Text style={styles.statBigNumber}>{activeClinicsCount}</Text>
                <Text style={styles.statUnitText}>Active Centers</Text>
              </View>
              <Text style={styles.statSubText}>Connected practice hubs</Text>
            </View>
          </LinearGradient>

          {/* Approved Links */}
          <LinearGradient
            colors={['#059669', '#10b981', '#34d399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradientCard}
          >
            <View style={styles.statCardInner}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardTitle}>Approved Links</Text>
                <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="check-circle" size={15} color="#059669" />
                </View>
              </View>
              <View style={styles.statNumbersRow}>
                <Text style={styles.statBigNumber}>{acceptedCount}</Text>
                <Text style={styles.statUnitText}>Accepted</Text>
              </View>
              <Text style={styles.statSubText}>Verified affiliations</Text>
            </View>
          </LinearGradient>

          {/* Pending Requests */}
          <LinearGradient
            colors={['#f59e0b', '#f97316', '#fb7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradientCard}
          >
            <View style={styles.statCardInner}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardTitle}>Pending Requests</Text>
                <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Icon name="clock" size={15} color="#D97706" />
                </View>
              </View>
              <View style={styles.statNumbersRow}>
                <Text style={styles.statBigNumber}>{pendingCount}</Text>
                <Text style={styles.statUnitText}>Awaiting</Text>
              </View>
              <Text style={styles.statSubText}>In review queue</Text>
            </View>
          </LinearGradient>
        </View>

        {/* 4. Verified Account Information (ProfileInformation & ProfileField from Web) */}
        <GradientCard variant="purple" style={styles.infoSectionCard}>
          <View style={styles.infoSectionPadding}>
            <View style={styles.infoHeaderRow}>
              <View style={styles.infoIconBox}>
                <Icon name="file-text" size={15} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.infoSectionTitle}>
                  Verified Account Information
                </Text>
                <Text style={styles.infoSectionSubtitle}>
                  Personal, contact & medical credentials
                </Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <ProfileFieldItem
                label="Full Name"
                value={`Dr. ${user?.name}`}
                icon="user"
                isLocked={true}
              />

              <ProfileFieldItem
                label="Email Address"
                value={user?.email}
                icon="mail"
                isLocked={true}
              />

              <ProfileFieldItem
                label="Phone Number"
                value={user?.phone}
                icon="phone"
                isLocked={true}
                fallbackText="Not provided"
              />

              <ProfileFieldItem
                label="Account Role"
                value={user?.role || 'DOCTOR'}
                icon="shield"
                isLocked={true}
              />

              <ProfileFieldItem
                label="Medical Specialization"
                value={specialization}
                icon="stethoscope"
                isLocked={true}
                fallbackText="General Physician"
              />

              <ProfileFieldItem
                label="Qualification & Degrees"
                value={qualification}
                icon="award"
                isLocked={true}
                fallbackText="MBBS, MD"
              />
            </View>

            <Text style={styles.infoFooterNote}>
              Note: Core identity and contact credentials are authenticated via verified platform credentials.
            </Text>
          </View>
        </GradientCard>

        {/* 5. Practice Management Tools */}
        <GradientCard variant="blue" style={styles.toolsCard}>
          <View style={styles.toolsContent}>
            <View style={styles.toolsHeaderRow}>
              <View style={styles.toolsHeaderIconBox}>
                <Icon name="sliders" size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.toolsSectionTitle}>Practice Management Tools</Text>
            </View>

            <View style={styles.toolsList}>
              <TouchableOpacity
                style={styles.toolItemRow}
                onPress={() => router.push('/(doctor)/earnings')}
                activeOpacity={0.7}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[styles.toolIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Icon name="trending-up" size={14} color="#16A34A" />
                  </View>
                  <Text style={styles.toolItemTitle}>Practice Earnings & Analytics</Text>
                </View>
                <Icon name="chevron-right" size={15} color={Colors.light.ink400} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolItemRow}
                onPress={() => router.push('/(doctor)/prescriptions')}
                activeOpacity={0.7}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[styles.toolIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="file-text" size={14} color="#7C3AED" />
                  </View>
                  <Text style={styles.toolItemTitle}>Digital Prescriptions</Text>
                </View>
                <Icon name="chevron-right" size={15} color={Colors.light.ink400} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolItemRow}
                onPress={() => router.push('/(doctor)/referrals')}
                activeOpacity={0.7}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[styles.toolIconBox, { backgroundColor: '#FFE4E6' }]}>
                    <Icon name="activity" size={14} color="#E11D48" />
                  </View>
                  <Text style={styles.toolItemTitle}>Diagnostic Requisitions & Referrals</Text>
                </View>
                <Icon name="chevron-right" size={15} color={Colors.light.ink400} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolItemRow}
                onPress={() => router.push('/(doctor)/requests')}
                activeOpacity={0.7}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[styles.toolIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="inbox" size={14} color="#D97706" />
                  </View>
                  <Text style={styles.toolItemTitle}>Clinic Connection Requests</Text>
                </View>
                <Icon name="chevron-right" size={15} color={Colors.light.ink400} />
              </TouchableOpacity>
            </View>
          </View>
        </GradientCard>

        {/* 6. Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={Colors.light.danger} />
          ) : (
            <>
              <Icon name="log-out" size={16} color={Colors.light.danger} />
              <Text style={styles.logoutText}>Sign Out of Doctor Portal</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 7. Profile Photo Upload Modal (ProfilePhotoModal from Web) */}
      <DoctorProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={() => handleRefreshAll()}
        currentPhotoUrl={photoUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerGradientCard: {
    borderRadius: 20,
    padding: Spacing.four,
    ...Shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTitlesCol: {
    flex: 1,
    gap: 4,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  headerMainTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: '#FFFFFF',
  },
  roleVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  roleVerifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 15,
  },
  headerRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  headerRefreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  avatarBannerCard: {
    borderRadius: 20,
    padding: 2,
    ...Shadows.sm,
  },
  avatarBannerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatarLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
  },
  avatarCircleBox: {
    width: 76,
    height: 76,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialsGradientFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraOverlayBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  identityMetaCol: {
    flex: 1,
    gap: 3,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  practitionerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  practitionerChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  practitionerRoleSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  changePhotoCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#252a67',
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  changePhotoCtaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statGradientCard: {
    flex: 1,
    borderRadius: 16,
    padding: 2,
    ...Shadows.sm,
  },
  statCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.three,
    gap: 2,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  statIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  statBigNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  statUnitText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink400,
  },
  statSubText: {
    fontSize: 9,
    color: Colors.light.ink400,
  },
  infoSectionCard: {
    borderRadius: 20,
  },
  infoSectionPadding: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.two,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  infoSectionSubtitle: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  fieldsGrid: {
    gap: Spacing.two,
  },
  fieldBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.three,
    gap: 4,
  },
  fieldTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E2E8F0',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  fieldValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  fieldValueFallback: {
    fontStyle: 'italic',
    color: Colors.light.ink400,
  },
  infoFooterNote: {
    fontSize: 10,
    color: Colors.light.ink400,
    marginTop: 2,
  },
  toolsCard: {
    borderRadius: 20,
  },
  toolsContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  toolsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toolsHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  toolsList: {
    gap: Spacing.two,
  },
  toolItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  toolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toolIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    marginTop: Spacing.two,
  },
  logoutText: {
    color: Colors.light.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
