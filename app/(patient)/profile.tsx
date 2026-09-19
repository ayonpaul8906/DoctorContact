import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import {
  useMyPatientProfile,
  useUpdatePatientProfile,
} from '../../hooks/usePatient';
import { GradientCard, Icon, KeyboardAwareScrollView } from '../../components';
import { updateProfileSchema } from '../../lib/validation';
import type { Gender } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const { data: patient, isLoading: profileLoading } = useMyPatientProfile();
  const updateMutation = useUpdatePatientProfile();

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'PATIENT')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (patient) {
      setDob(patient.dob ? patient.dob.slice(0, 10) : '');
      setGender(patient.gender ?? undefined);
      setBloodGroup(patient.bloodGroup ?? '');
      setAddress(patient.address ?? '');
    }
  }, [patient]);

  const handleSave = async () => {
    setServerError('');
    setSuccessMessage('');

    const payload: {
      dob?: string;
      gender?: Gender;
      bloodGroup?: string;
      address?: string;
    } = {};

    if (dob.trim()) {
      payload.dob = new Date(dob.trim()).toISOString();
    }
    if (gender) {
      payload.gender = gender;
    }
    if (bloodGroup.trim()) {
      payload.bloodGroup = bloodGroup.trim();
    }
    if (address.trim()) {
      payload.address = address.trim();
    }

    const validation = updateProfileSchema.safeParse(payload);
    if (!validation.success) {
      setServerError('Please provide valid profile details');
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        setServerError(res?.data?.message || 'Failed to update profile');
      } else {
        setServerError('Unable to update profile. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace('/(auth)');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter} edges={['left', 'right']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Patient Profile...</Text>
      </SafeAreaView>
    );
  }

  const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        extraHeight={140}
        keyboardShouldPersistTaps="handled"
      >
          {/* Header Card */}
          <GradientCard variant="blue" style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.headerBadgeRow}>
                <View style={styles.badgeIconBox}>
                  <Icon name="user" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.headerBadgeText}>Profile</Text>
                <View style={styles.verifiedPill}>
                  <Icon name="shield-check" size={11} color="#FFFFFF" />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              </View>

              <Text style={styles.headerTitle}>Personal Profile</Text>
              <Text style={styles.headerSubtitle}>
                Manage your personal information and preferences
              </Text>
            </View>
          </GradientCard>

          {/* User Summary Card */}
          <GradientCard variant="purple" style={styles.profileSummaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.userTopRow}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarLetter}>{initialLetter}</Text>
                  <View style={styles.avatarCheckmark}>
                    <Icon name="check-circle" size={14} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.userMeta}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={styles.emailRow}>
                    <Icon name="mail" size={13} color={Colors.light.primary} />
                    <Text style={styles.emailText}>{user.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metaCardsRow}>
                <View style={styles.metaMiniCard}>
                  <View style={styles.miniIconBox}>
                    <Icon name="phone" size={14} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.miniLabel}>Phone</Text>
                    <Text style={styles.miniValue}>
                      {user.phone || 'Not registered'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaMiniCard}>
                  <View style={[styles.miniIconBox, styles.statusIconBox]}>
                    <Icon name="activity" size={14} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.miniLabel}>Status</Text>
                    <Text style={styles.miniValue}>Active Patient</Text>
                  </View>
                </View>
              </View>
            </View>
          </GradientCard>

          {/* Edit Form */}
          {profileLoading ? (
            <View style={styles.formLoadingCard}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.formLoadingText}>Loading personal details...</Text>
            </View>
          ) : (
            <GradientCard variant="green" style={styles.formCard}>
              <View style={styles.formContent}>
                <View style={styles.formHeader}>
                  <View style={styles.formHeaderIconBox}>
                    <Icon name="save" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.formTitle}>Personal Information</Text>
                    <Text style={styles.formSubtitle}>
                      Update your demographic and medical details
                    </Text>
                  </View>
                </View>

                {/* Date of Birth Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icon name="calendar" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="1990-05-15"
                      placeholderTextColor={Colors.light.ink400}
                      value={dob}
                      onChangeText={setDob}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Gender Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.genderOptionsRow}>
                    {GENDER_OPTIONS.map((opt) => {
                      const selected = gender === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.genderOption,
                            selected && styles.genderOptionSelected,
                          ]}
                          onPress={() => setGender(opt.value)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              selected && styles.genderOptionTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Blood Group Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Blood Group</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icon name="heart" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. O+, A+, B+, AB-"
                      placeholderTextColor={Colors.light.ink400}
                      value={bloodGroup}
                      onChangeText={setBloodGroup}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Address Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Residential Address</Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <View style={[styles.inputIcon, styles.textAreaIcon]}>
                      <Icon name="map-pin" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.textAreaInput]}
                      placeholder="Enter your street, city and pin code"
                      placeholderTextColor={Colors.light.ink400}
                      value={address}
                      onChangeText={setAddress}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Success Banner */}
                {successMessage ? (
                  <View style={styles.successBanner}>
                    <Icon name="check-circle" size={16} color="#047857" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                {/* Server Error Banner */}
                {serverError ? (
                  <View style={styles.errorBanner}>
                    <Icon name="alert-circle" size={16} color={Colors.light.danger} />
                    <Text style={styles.errorText}>{serverError}</Text>
                  </View>
                ) : null}

                {/* Submit Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    updateMutation.isPending && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Saving changes...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnRow}>
                      <Icon name="save" size={16} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </GradientCard>
          )}

          {/* Logout Action Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <View style={styles.logoutRow}>
                <Icon name="log-out" size={18} color="#DC2626" />
                <Text style={styles.logoutText}>Sign Out of Patient Account</Text>
              </View>
            )}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  keyboardView: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSoft,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerContent: {
    padding: Spacing.four,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  badgeIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#1E40AF',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#059669',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  profileSummaryCard: {
    marginBottom: 0,
  },
  summaryContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarBox: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarCheckmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userMeta: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emailText: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  metaCardsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metaMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surface50,
    borderColor: Colors.light.surface200,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  miniIconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconBox: {
    backgroundColor: '#059669',
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  formLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  formLoadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 0,
  },
  formContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  formHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  formSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  inputGroup: {
    gap: Spacing.half,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.light.ink700,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: 80,
    paddingVertical: Spacing.two,
  },
  inputIcon: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.ink900,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textAreaInput: {
    textAlignVertical: 'top',
    height: 60,
  },
  genderOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    backgroundColor: Colors.light.surface50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EFF6FF',
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  genderOptionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  successText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
