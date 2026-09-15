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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth-context';
import {
  useDiagnosticStaffProfile,
  useUpdateStaffProfile,
} from '../../hooks/useDiagnostic';
import { uploadProfilePhoto } from '../../lib/api';
import { TokenStorage } from '../../lib/secure-store';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

export default function DiagnosticStaffProfileScreen() {
  const { user, setUser, logout, refetchUser } = useAuth();

  const {
    data: profile,
    isLoading,
    refetch,
    isRefetching,
  } = useDiagnosticStaffProfile();

  const updateProfileMutation = useUpdateStaffProfile();

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile?.user) {
      setName(profile.user.name || user?.name || '');
      setPhone(profile.user.phone || user?.phone || '');
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [profile, user]);

  const handlePickPhoto = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera access is required to take a picture.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          await uploadPhoto(result.assets[0]);
        }
      } else {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Required', 'Gallery access is required to select a picture.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          await uploadPhoto(result.assets[0]);
        }
      }
    } catch {
      Alert.alert('Error', 'Unable to pick photo.');
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingPhoto(true);
    try {
      const res = await uploadProfilePhoto({
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      const newAvatar = res?.data?.avatar || res?.data?.user?.avatar || asset.uri;
      if (user) {
        const updated = { ...user, avatar: newAvatar };
        setUser(updated);
        await TokenStorage.setStoredUser(updated);
      }
      await refetchUser();
      await refetch();
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.response?.data?.message || 'Could not upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleOpenPhotoOptions = () => {
    Alert.alert('Change Profile Picture', 'Select source for your technician avatar', [
      { text: 'Take Photo', onPress: () => handlePickPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => handlePickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Full Name cannot be empty.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      if (user) {
        const updated = {
          ...user,
          name: name.trim(),
          phone: phone.trim() || user.phone,
        };
        setUser(updated);
        await TokenStorage.setStoredUser(updated);
      }

      setIsEditing(false);
      Alert.alert('Success', 'Staff details updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update details.');
    }
  };

  const handleCancelEdit = () => {
    setName(profile?.user?.name || user?.name || '');
    setPhone(profile?.user?.phone || user?.phone || '');
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Diagnostic Staff account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const avatarUrl = getImageUrl(user?.avatar || profile?.user?.avatar);
  const displayName = profile?.user?.name || user?.name || 'Lab Technician';
  const displayEmail = profile?.user?.email || user?.email || 'staff@dewasi.com';
  const centerInfo = profile?.diagnosticCenter;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Staff Profile</Text>
            <Text style={styles.headerSubtitle}>
              Pathology credentials & assigned diagnostic center
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            disabled={isRefetching}
          >
            <Icon name="refresh-cw" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading technician profile...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* ============================================================
                1. AVATAR & IDENTITY CARD
            ============================================================ */}
            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleOpenPhotoOptions}
                  disabled={isUploadingPhoto}
                  activeOpacity={0.8}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="camera" size={13} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.roleBadge}>
                <Icon name="flask" size={11} color="#2563EB" />
                <Text style={styles.roleBadgeText}>Certified Diagnostic Staff</Text>
              </View>
              <Text style={styles.avatarHintText}>Tap camera icon to change photo</Text>
            </View>

            {/* ============================================================
                2. STAFF ACCOUNT DETAILS & EDIT
            ============================================================ */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <Icon name="user" size={16} color="#2563EB" />
                  <Text style={styles.cardTitle}>Account Information</Text>
                </View>
                {!isEditing ? (
                  <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditing(true)}
                  >
                    <Icon name="sliders" size={13} color="#2563EB" />
                    <Text style={styles.editToggleBtnText}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{displayName}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <Text style={[styles.fieldValue, { color: '#64748B' }]}>
                  {displayEmail} (Login ID)
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{phone || '–'}</Text>
                )}
              </View>

              {isEditing && (
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    updateProfileMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="save" size={15} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ============================================================
                3. ASSIGNED DIAGNOSTIC CENTER (Matches Webapp)
            ============================================================ */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleRow}>
                  <Icon name="building" size={16} color="#16A34A" />
                  <Text style={styles.cardTitle}>Assigned Diagnostic Center</Text>
                </View>
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Laboratory Name</Text>
                <Text style={styles.fieldValue}>
                  {centerInfo?.centerName || 'Diagnostic Center'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>Center Location</Text>
                <Text style={styles.fieldValue}>
                  {[centerInfo?.address, centerInfo?.city].filter(Boolean).join(', ') ||
                    'Healthcare Network Partner'}
                </Text>
              </View>

              {centerInfo?.phone ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>Center Helpdesk</Text>
                    <Text style={styles.fieldValue}>{centerInfo.phone}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* ============================================================
                4. SIGN OUT
            ============================================================ */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Icon name="log-out" size={16} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out of Staff Account</Text>
            </TouchableOpacity>
          </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 4,
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#2563EB',
    fontSize: 28,
    fontWeight: '800',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  avatarHintText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  editToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  fieldItem: {
    paddingVertical: 2,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
