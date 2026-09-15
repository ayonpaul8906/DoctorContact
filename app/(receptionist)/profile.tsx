import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import {
  useMyAssignedDoctors,
  useUpdateReceptionistProfile,
  useChangeReceptionistPassword,
} from '../../hooks/useReceptionist';
import { TokenStorage } from '../../lib/secure-store';
import { Icon } from '../../components/Icon';
import { DoctorProfilePhotoModal } from '../../components/DoctorProfilePhotoModal';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

function getInitials(name?: string) {
  if (!name) return 'RC';
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ReceptionistProfileScreen() {
  const { user, setUser, logout, refetchUser } = useAuth();
  const { data: doctors = [] } = useMyAssignedDoctors();

  const updateProfileMutation = useUpdateReceptionistProfile();
  const changePasswordMutation = useChangeReceptionistPassword();

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Edit details form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Success / Error alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep state synced with auth user
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Derive Clinic information from assigned doctors
  const primaryClinic = doctors[0]?.clinic;
  const clinicName = primaryClinic?.clinicName || 'Clinic Front Desk';
  const clinicCity = primaryClinic?.city || '';
  const clinicAddress = primaryClinic?.address || '';

  const handleSaveProfile = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };

      await updateProfileMutation.mutateAsync(payload);

      // Update local session
      if (user) {
        const updatedUser = {
          ...user,
          name: payload.name,
          phone: payload.phone ?? user.phone,
          email: payload.email ?? user.email,
        };
        setUser(updatedUser);
        await TokenStorage.setStoredUser(updatedUser);
      }

      setIsEditing(false);
      setSuccessMsg('Profile details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        userId: user?.id || '',
        newPassword,
      });

      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setSuccessMsg('Password changed successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePhotoSuccess = async () => {
    await refetchUser();
    setSuccessMsg('Profile photo updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Receptionist Desk?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const currentAvatarUrl = user?.avatar;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching Webapp */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Receptionist Profile</Text>
          <Text style={styles.headerSubtitle}>
            Front desk credentials, clinic chamber assignments, and account settings
          </Text>
        </View>

        {/* Feedback Messages */}
        {errorMsg && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorCardText}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg(null)}>
              <Icon name="x" size={14} color="#991B1B" />
            </TouchableOpacity>
          </View>
        )}

        {successMsg && (
          <View style={styles.successCard}>
            <Icon name="check-circle" size={16} color="#059669" />
            <Text style={styles.successCardText}>{successMsg}</Text>
            <TouchableOpacity onPress={() => setSuccessMsg(null)}>
              <Icon name="x" size={14} color="#065F46" />
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Card with Photo and Change Option */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarContainer}>
            {currentAvatarUrl ? (
              <Image
                source={{ uri: getImageUrl(currentAvatarUrl) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              </View>
            )}

            {/* Camera Overlay Icon */}
            <TouchableOpacity
              style={styles.cameraIconBadge}
              onPress={() => setPhotoModalOpen(true)}
              activeOpacity={0.85}
            >
              <Icon name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Reception Staff'}</Text>
          <View style={styles.rolePill}>
            <Icon name="shield-check" size={12} color={Colors.light.primary} />
            <Text style={styles.rolePillText}>Front Desk Receptionist</Text>
          </View>

          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={() => setPhotoModalOpen(true)}
            activeOpacity={0.8}
          >
            <Icon name="image" size={13} color={Colors.light.primary} />
            <Text style={styles.changePhotoBtnText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Assigned Clinic Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="building" size={15} color={Colors.light.primary} />
              <Text style={styles.cardSectionTitle}>Assigned Clinic</Text>
            </View>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.clinicInfoWrap}>
            <Text style={styles.clinicMainName}>{clinicName}</Text>
            {clinicCity ? (
              <View style={styles.clinicDetailRow}>
                <Icon name="map-pin" size={12} color={Colors.light.ink400} />
                <Text style={styles.clinicDetailText}>
                  {clinicCity}
                  {clinicAddress ? ` • ${clinicAddress}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Edit Profile Details Section */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="user" size={15} color={Colors.light.primary} />
              <Text style={styles.cardSectionTitle}>Profile Details</Text>
            </View>

            {!isEditing ? (
              <TouchableOpacity
                style={styles.editToggleBtn}
                onPress={() => setIsEditing(true)}
              >
                <Icon name="sliders" size={12} color={Colors.light.primary} />
                <Text style={styles.editToggleBtnText}>Edit Details</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setPhone(user?.phone || '');
                  setEmail(user?.email || '');
                }}
              >
                <Text style={styles.cancelEditBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            /* Editing Form */
            <View style={styles.editForm}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
              />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="10-digit mobile number"
              />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
              />

              <TouchableOpacity
                style={styles.saveDetailsBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.saveDetailsBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Read-Only Info View */
            <View style={styles.detailsView}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.name || 'Receptionist'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Change Password Section */}
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.cardHeaderRow}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderLeft}>
              <Icon name="lock" size={15} color={Colors.light.primary} />
              <Text style={styles.cardSectionTitle}>Security & Password</Text>
            </View>
            <Icon
              name={showPasswordSection ? 'chevron-down' : 'chevron-right'}
              size={15}
              color={Colors.light.ink500}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordForm}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholder="At least 6 characters"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={Colors.light.ink400}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.formInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="Re-enter new password"
              />

              <TouchableOpacity
                style={styles.updatePasswordBtn}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="lock" size={14} color="#FFFFFF" />
                    <Text style={styles.updatePasswordBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Assigned Doctors List Overview */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Icon name="stethoscope" size={15} color={Colors.light.primary} />
              <Text style={styles.cardSectionTitle}>Assigned Doctors ({doctors.length})</Text>
            </View>
          </View>

          {doctors.length === 0 ? (
            <Text style={styles.emptyDoctorText}>No doctors currently assigned.</Text>
          ) : (
            <View style={styles.assignedDoctorsList}>
              {doctors.map((d, index) => (
                <View key={d.id || index} style={styles.doctorItemRow}>
                  <View style={styles.docItemAvatar}>
                    <Text style={styles.docItemInitials}>{getInitials(d.user?.name)}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.docItemName}>
                      Dr. {(d.user?.name || 'Doctor').replace(/^dr\.?\s*/i, '')}
                    </Text>
                    <Text style={styles.docItemSpec}>
                      {d.specialization || 'General Practitioner'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.availIndicator,
                      { backgroundColor: d.isAvailable ? '#ECFDF5' : '#F3F4F6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availIndicatorText,
                        { color: d.isAvailable ? '#059669' : '#6B7280' },
                      ]}
                    >
                      {d.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Icon name="log-out" size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Reception Desk</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Photo Modal with Camera & Gallery */}
      <DoctorProfilePhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onSuccess={handlePhotoSuccess}
        currentPhotoUrl={currentAvatarUrl}
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
    paddingBottom: 90,
    gap: Spacing.three,
  },
  headerCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 3,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    lineHeight: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  errorCardText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  successCardText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
  },
  profileHeroCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EFF6FF',
    ...Shadows.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 4,
  },
  changePhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  infoCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  clinicInfoWrap: {
    gap: 3,
    paddingTop: 4,
  },
  clinicMainName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  clinicDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clinicDetailText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  editToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  cancelEditBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  editForm: {
    gap: 8,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  saveDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 11,
    marginTop: 6,
  },
  saveDetailsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailsView: {
    gap: 6,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  passwordForm: {
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  updatePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: Radius.md,
    paddingVertical: 11,
    marginTop: 4,
  },
  updatePasswordBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyDoctorText: {
    fontSize: 12,
    color: Colors.light.ink500,
    paddingVertical: 6,
  },
  assignedDoctorsList: {
    gap: 8,
    marginTop: 4,
  },
  doctorItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  docItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docItemInitials: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  flex1: {
    flex: 1,
  },
  docItemName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  docItemSpec: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  availIndicator: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
  },
  availIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: Spacing.two,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});
