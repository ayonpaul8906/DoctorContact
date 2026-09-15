import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import {
  useClinicProfile,
  useUpdateClinicProfile,
  useToggleOnlineConsultation,
  useToggleAutoFollowup,
  useClinicDoctors,
  useClinicReceptionists,
  useUploadClinicLogo,
} from '../../hooks/useClinic';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

export default function ClinicProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    data: clinic,
    isLoading,
    refetch,
    isRefetching,
  } = useClinicProfile();

  const { data: doctors = [] } = useClinicDoctors();
  const { data: receptionists = [] } = useClinicReceptionists();

  const updateProfileMutation = useUpdateClinicProfile();
  const toggleOnlineMutation = useToggleOnlineConsultation();
  const toggleAutoFollowupMutation = useToggleAutoFollowup();
  const uploadLogoMutation = useUploadClinicLogo();

  const [showEditModal, setShowEditModal] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');

  const handlePickLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select a clinic logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadLogoMutation.mutateAsync({
          uri: asset.uri,
          name: asset.fileName || 'clinic-logo.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
        Alert.alert('Success', 'Clinic logo updated successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to upload clinic logo.');
    }
  };

  const openEditModal = () => {
    if (clinic) {
      setClinicName(clinic.clinicName || '');
      setAddress(clinic.address || '');
      setCity(clinic.city || '');
      setStateVal(clinic.state || '');
      setPincode(clinic.pincode || '');
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!clinicName.trim()) {
      Alert.alert('Required', 'Please enter clinic center name.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        clinicName: clinicName.trim(),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: stateVal.trim() || undefined,
        pincode: pincode.trim() || undefined,
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Clinic profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const handleToggleOnline = async (newValue: boolean) => {
    try {
      await toggleOnlineMutation.mutateAsync(newValue);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update online status.');
    }
  };

  const handleToggleAutoFollowup = async (newValue: boolean) => {
    try {
      await toggleAutoFollowupMutation.mutateAsync(newValue);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update auto-followup setting.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Clinic Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
          } catch (err) {
            Alert.alert('Error', 'Unable to sign out.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* 1. Profile Hero Card */}
        <GradientCard variant="blue" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.avatarRow}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handlePickLogo}
                disabled={uploadLogoMutation.isPending}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  {clinic?.logo ? (
                    <Image
                      source={{ uri: getImageUrl(clinic.logo) }}
                      style={styles.avatarLogoImage}
                    />
                  ) : (
                    <Icon name="building" size={26} color="#FFFFFF" />
                  )}
                  {uploadLogoMutation.isPending && (
                    <View style={styles.avatarPendingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={10} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.heroDetailsCol}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroNameText} numberOfLines={1}>
                    {clinic?.clinicName || user?.name || 'Clinic Center'}
                  </Text>
                </View>
                <View style={styles.approvedPill}>
                  <Icon name="check-circle" size={12} color="#047857" />
                  <Text style={styles.approvedPillText}>
                    {clinic?.isApproved !== false ? 'Verified Center' : 'Approval Pending'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={openEditModal}
                activeOpacity={0.8}
              >
                <Icon name="sliders" size={14} color={Colors.light.primary} />
                <Text style={styles.editProfileBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Address */}
            <View style={styles.locationContainer}>
              <Icon name="map-pin" size={14} color={Colors.light.ink500} />
              <Text style={styles.locationText}>
                {[clinic?.address, clinic?.city, clinic?.state, clinic?.pincode]
                  .filter(Boolean)
                  .join(', ') || 'Address not configured'}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* 2. Staff Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Icon name="stethoscope" size={16} color={Colors.light.primary} />
            <Text style={styles.statVal}>{doctors.length}</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="users" size={16} color="#7C3AED" />
            <Text style={styles.statVal}>{receptionists.length}</Text>
            <Text style={styles.statLabel}>Receptionists</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="activity" size={16} color="#059669" />
            <Text style={styles.statVal}>{doctors.length + receptionists.length}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Loading clinic profile...</Text>
          </View>
        ) : (
          <>
            {/* 3. Online Consultation Feature Switch */}
            <GradientCard variant="green" style={styles.featureCard}>
              <View style={styles.featureContent}>
                <View style={styles.featureHeaderRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: '#10B981' }]}>
                    <Icon name="pulse" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.featureTitle}>Online Consultation</Text>
                    <Text style={styles.featureSub}>
                      Enable patient online video consultations and appointment booking
                    </Text>
                  </View>
                  <Switch
                    value={clinic?.onlineConsultationEnabled ?? false}
                    onValueChange={handleToggleOnline}
                    trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
                    thumbColor={clinic?.onlineConsultationEnabled ? '#10B981' : '#F3F4F6'}
                  />
                </View>
              </View>
            </GradientCard>

            {/* 4. Automatic Follow-Up Feature Switch */}
            <GradientCard variant="indigo" style={styles.featureCard}>
              <View style={styles.featureContent}>
                <View style={styles.featureHeaderRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: '#4F46E5' }]}>
                    <Icon name="calendar-clock" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.featureTitle}>Auto Follow-Up (1 Month)</Text>
                    <Text style={styles.featureSub}>
                      Auto-schedule follow-up reminders for patients without recent visits
                    </Text>
                  </View>
                  <Switch
                    value={(clinic as any)?.autoFollowupEnabled ?? false}
                    onValueChange={handleToggleAutoFollowup}
                    trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                    thumbColor={(clinic as any)?.autoFollowupEnabled ? '#4F46E5' : '#F3F4F6'}
                  />
                </View>
              </View>
            </GradientCard>

            {/* 3. Account & Administrative Information */}
            <GradientCard variant="blue" style={styles.detailsCard}>
              <View style={styles.detailsContent}>
                <Text style={styles.sectionHeading}>Clinic Account Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registered Email</Text>
                  <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User Role</Text>
                  <Text style={styles.detailValue}>CLINIC_ADMINISTRATOR</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City / Location</Text>
                  <Text style={styles.detailValue}>{clinic?.city || 'Not set'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode</Text>
                  <Text style={styles.detailValue}>{clinic?.pincode || 'Not set'}</Text>
                </View>
              </View>
            </GradientCard>

            {/* 4. Management & Analytics Menu */}
            <GradientCard variant="purple" style={styles.detailsCard}>
              <View style={styles.detailsContent}>
                <Text style={styles.sectionHeading}>Clinic Operations & Tools</Text>

                <View style={styles.toolsMenu}>
                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/overview?tab=doctors')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="stethoscope" size={16} color={Colors.light.primary} />
                      <Text style={styles.toolTitle}>Doctors Directory</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/overview?tab=receptionists')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="users" size={16} color="#7C3AED" />
                      <Text style={styles.toolTitle}>Front Desk Receptionists</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/management?tab=requests')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="inbox" size={16} color="#2563EB" />
                      <Text style={styles.toolTitle}>Doctor Connection Requests</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/management?tab=followups')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="calendar-clock" size={16} color="#D97706" />
                      <Text style={styles.toolTitle}>Patient Follow-ups</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/services?tab=referrals')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="activity" size={16} color="#E11D48" />
                      <Text style={styles.toolTitle}>Diagnostic Lab Requisitions</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolRow}
                    onPress={() => router.push('/(clinic)/services?tab=reports')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toolLeft}>
                      <Icon name="trending-up" size={16} color="#059669" />
                      <Text style={styles.toolTitle}>Reports & Period Analytics</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>
              </View>
            </GradientCard>

            {/* 5. Sign Out Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.85}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Icon name="log-out" size={16} color="#DC2626" />
                  <Text style={styles.logoutBtnText}>Sign Out of Clinic Account</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Clinic Information</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Clinic Center Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicName}
                    onChangeText={setClinicName}
                    placeholder="e.g. Apex Health Clinic"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. 123 Healthcare Ave, Suite 4"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.rowTwo}>
                  <View style={styles.flex1}>
                    <Text style={styles.formLabel}>City</Text>
                    <TextInput
                      style={styles.formInput}
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Mumbai"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>

                  <View style={styles.flex1}>
                    <Text style={styles.formLabel}>State</Text>
                    <TextInput
                      style={styles.formInput}
                      value={stateVal}
                      onChangeText={setStateVal}
                      placeholder="e.g. Maharashtra"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pincode</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="numeric"
                    placeholder="400001"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveProfileBtn}
                  onPress={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  activeOpacity={0.85}
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveProfileBtnText}>Save Clinic Details</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  heroCard: {
    marginBottom: 0,
  },
  heroContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  avatarLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  heroDetailsCol: {
    flex: 1,
    gap: 3,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroNameText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  approvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  approvedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  locationText: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  statVal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  featureCard: {
    marginBottom: 0,
  },
  featureContent: {
    padding: Spacing.four,
  },
  featureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  featureSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  detailsCard: {
    marginBottom: 0,
  },
  detailsContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  toolsMenu: {
    gap: Spacing.two,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  toolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  closeBtn: {
    padding: 4,
  },
  scrollForm: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  formGroup: {
    gap: 4,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  saveProfileBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  saveProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
