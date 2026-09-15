import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth-context';
import {
  useDiagnosticCenterProfile,
  useUpdateDiagnosticCenterProfile,
  useUploadCenterLogo,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

export default function DiagnosticCenterProfileScreen() {
  const { user, logout } = useAuth();

  const {
    data: center,
    isLoading,
    refetch,
    isRefetching,
  } = useDiagnosticCenterProfile();

  const updateProfileMutation = useUpdateDiagnosticCenterProfile();
  const uploadLogoMutation = useUploadCenterLogo();

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [centerName, setCenterName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [authorizationNote, setAuthorizationNote] = useState('');
  const [hasHomeService, setHasHomeService] = useState(false);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync state with server profile
  useEffect(() => {
    if (center) {
      setCenterName(center.centerName || '');
      setPhone(center.phone || '');
      setWhatsapp(center.whatsapp || '');
      setAddress(center.address || '');
      setCity(center.city || '');
      setState(center.state || '');
      setPincode(center.pincode || '');
      setGoogleMapsUrl(center.googleMapsUrl || '');
      setAuthorizationNote(center.authorizationNote || '');
      setHasHomeService(center.hasHomeService ?? false);
    }
  }, [center]);

  const handlePickLogo = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          await uploadLogo(result.assets[0]);
        }
      } else {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Required', 'Gallery access is required to select a logo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          await uploadLogo(result.assets[0]);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to pick image.');
    }
  };

  const uploadLogo = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingLogo(true);
    try {
      await uploadLogoMutation.mutateAsync({
        uri: asset.uri,
        name: asset.fileName || 'center_logo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      Alert.alert('Success', 'Diagnostic Center logo updated successfully.');
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.response?.data?.message || 'Could not upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleOpenPhotoOptions = () => {
    Alert.alert(
      'Change Center Logo',
      'Select a photo source to update your laboratory branding',
      [
        { text: 'Take Photo', onPress: () => handlePickLogo('camera') },
        { text: 'Choose from Gallery', onPress: () => handlePickLogo('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!centerName.trim()) {
      Alert.alert('Required', 'Center Name is required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        centerName: centerName.trim(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        authorizationNote: authorizationNote.trim() || undefined,
        hasHomeService,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Diagnostic Center profile details saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update center profile.');
    }
  };

  const handleCancelEdit = () => {
    if (center) {
      setCenterName(center.centerName || '');
      setPhone(center.phone || '');
      setWhatsapp(center.whatsapp || '');
      setAddress(center.address || '');
      setCity(center.city || '');
      setState(center.state || '');
      setPincode(center.pincode || '');
      setGoogleMapsUrl(center.googleMapsUrl || '');
      setAuthorizationNote(center.authorizationNote || '');
      setHasHomeService(center.hasHomeService ?? false);
    }
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the Diagnostic Center Manager portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const logoUrl = getImageUrl(center?.logo);

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
            <Text style={styles.headerTitle}>Center Profile</Text>
            <Text style={styles.headerSubtitle}>
              Laboratory branding, contact information & accreditation
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            disabled={isRefetching}
          >
            <Icon name="refresh-cw" size={16} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading center profile details...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* ============================================================
                1. CENTER BRANDING & LOGO CARD
            ============================================================ */}
            <View style={styles.profileHeroCard}>
              <View style={styles.avatarWrap}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="flask" size={32} color="#0F766E" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleOpenPhotoOptions}
                  disabled={isUploadingLogo}
                  activeOpacity={0.8}
                >
                  {isUploadingLogo ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="camera" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.centerNameDisplay}>
                {center?.centerName || user?.name || 'Diagnostic Center'}
              </Text>

              <View style={styles.badgeRow}>
                {center?.isApproved !== false ? (
                  <View style={styles.verifiedBadge}>
                    <Icon name="shield-check" size={12} color="#16A34A" />
                    <Text style={styles.verifiedText}>Verified Healthcare Partner</Text>
                  </View>
                ) : (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Icon name="clock" size={12} color="#B45309" />
                    <Text style={[styles.verifiedText, { color: '#B45309' }]}>Verification Pending</Text>
                  </View>
                )}
              </View>

              <Text style={styles.tapChangeHint}>Tap camera icon to update logo</Text>
            </View>

            {/* ============================================================
                2. PROFILE DETAILS / EDIT FORM
            ============================================================ */}
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <View style={styles.formHeaderTitleRow}>
                  <Icon name="building" size={18} color="#0F766E" />
                  <Text style={styles.formSectionTitle}>Center Information</Text>
                </View>
                {!isEditing ? (
                  <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditing(true)}
                  >
                    <Icon name="sliders" size={14} color="#0F766E" />
                    <Text style={styles.editToggleBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {/* Center Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Diagnostic Center Name *</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={centerName}
                      onChangeText={setCenterName}
                      placeholder="e.g. Apollo Pathology & Imaging"
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{centerName || '–'}</Text>
                  )}
                </View>

                {/* Contact Phone & WhatsApp */}
                <View style={styles.twoColRow}>
                  <View style={styles.colField}>
                    <Text style={styles.fieldLabel}>Helpdesk Phone</Text>
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

                  <View style={styles.colField}>
                    <Text style={styles.fieldLabel}>WhatsApp Support</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.textInput}
                        value={whatsapp}
                        onChangeText={setWhatsapp}
                        placeholder="+91..."
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{whatsapp || '–'}</Text>
                    )}
                  </View>
                </View>

                {/* Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Street Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Hospital Road, Near Court"
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{address || '–'}</Text>
                  )}
                </View>

                {/* City, State, Pincode */}
                <View style={styles.threeColRow}>
                  <View style={styles.colField}>
                    <Text style={styles.fieldLabel}>City</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.textInput}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor="#94A3B8"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{city || '–'}</Text>
                    )}
                  </View>

                  <View style={styles.colField}>
                    <Text style={styles.fieldLabel}>State</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.textInput}
                        value={state}
                        onChangeText={setState}
                        placeholder="State"
                        placeholderTextColor="#94A3B8"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{state || '–'}</Text>
                    )}
                  </View>

                  <View style={styles.colField}>
                    <Text style={styles.fieldLabel}>Pincode</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.textInput}
                        value={pincode}
                        onChangeText={setPincode}
                        placeholder="PIN"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{pincode || '–'}</Text>
                    )}
                  </View>
                </View>

                {/* Google Maps URL */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Google Maps Link</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={googleMapsUrl}
                      onChangeText={setGoogleMapsUrl}
                      placeholder="https://maps.google.com/..."
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: googleMapsUrl ? '#2563EB' : '#0F172A' }]}>
                      {googleMapsUrl || '–'}
                    </Text>
                  )}
                </View>

                {/* Accreditation / License Note */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Accreditation / Clinical License</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={authorizationNote}
                      onChangeText={setAuthorizationNote}
                      placeholder="NABL Accredited / WB Health License No."
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{authorizationNote || 'NABL Accredited'}</Text>
                  )}
                </View>

                {/* Home Sample Collection Service */}
                <View style={styles.switchFieldRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.switchTitle}>Home Sample Collection</Text>
                    <Text style={styles.switchDesc}>
                      Enable if your lab offers home blood/urine sample collection
                    </Text>
                  </View>
                  <Switch
                    disabled={!isEditing}
                    value={hasHomeService}
                    onValueChange={setHasHomeService}
                    trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                    thumbColor={hasHomeService ? '#0F766E' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Save Button when in edit mode */}
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
                      <Icon name="save" size={16} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Profile Details</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ============================================================
                3. SIGN OUT
            ============================================================ */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Icon name="log-out" size={16} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out of Diagnostic Portal</Text>
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
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
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
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarWrap: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 4,
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#0F766E',
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerNameDisplay: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  tapChangeHint: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  editToggleBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  formFields: {
    gap: Spacing.three,
  },
  fieldGroup: {
    gap: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  colField: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  switchFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
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
