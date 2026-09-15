import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useClinicDoctors,
  useClinicReceptionists,
  useAddReceptionist,
  useAssignDoctorsToReceptionist,
  useChangeStaffPassword,
} from '../../hooks/useClinic';
import {
  GradientCard,
  ClinicDoctorCard,
  AddDoctorModal,
  EditDoctorModal,
  Icon,
} from '../../components';
import type { ClinicDoctor, ClinicReceptionist } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

export default function ClinicOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'doctors' | 'receptionists'>('doctors');

  useEffect(() => {
    if (params.tab === 'receptionists') {
      setActiveTab('receptionists');
    } else if (params.tab === 'doctors') {
      setActiveTab('doctors');
    }
  }, [params.tab]);

  // Queries
  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
    isRefetching: refetchingDoctors,
  } = useClinicDoctors();

  const {
    data: receptionists = [],
    isLoading: loadingReceptionists,
    refetch: refetchReceptionists,
    isRefetching: refetchingReceptionists,
  } = useClinicReceptionists();

  // Mutations
  const addReceptionistMutation = useAddReceptionist();
  const assignDoctorsMutation = useAssignDoctorsToReceptionist();
  const changePasswordMutation = useChangeStaffPassword();

  // Doctor state
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<ClinicDoctor | null>(null);

  // Receptionist state
  const [receptionistSearch, setReceptionistSearch] = useState('');
  const [showAddReceptionistModal, setShowAddReceptionistModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPhone, setAddPhone] = useState('');

  // Assign doctors modal
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<ClinicReceptionist | null>(null);
  const [assignedDoctorIds, setAssignedDoctorIds] = useState<string[]>([]);

  // Password reset modal
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState<ClinicReceptionist | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');

  const handleRefreshAll = () => {
    refetchDoctors();
    refetchReceptionists();
  };

  // Filtered lists
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return doctors;
    const q = doctorSearch.toLowerCase().trim();
    return doctors.filter(
      (d) =>
        d.user?.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.qualification?.toLowerCase().includes(q) ||
        d.user?.email?.toLowerCase().includes(q)
    );
  }, [doctors, doctorSearch]);

  const filteredReceptionists = useMemo(() => {
    if (!receptionistSearch.trim()) return receptionists;
    const q = receptionistSearch.toLowerCase().trim();
    return receptionists.filter(
      (r) =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.user?.phone?.toLowerCase().includes(q)
    );
  }, [receptionists, receptionistSearch]);

  const handleAddReceptionist = async () => {
    if (!addName.trim()) {
      Alert.alert('Required', 'Please enter staff full name.');
      return;
    }
    if (!addEmail.trim() || !addEmail.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email.');
      return;
    }
    if (!addPassword.trim() || addPassword.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await addReceptionistMutation.mutateAsync({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        phone: addPhone.trim() || undefined,
      });

      setShowAddReceptionistModal(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddPhone('');
      Alert.alert('Success', 'Front desk staff account created.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to register receptionist.');
    }
  };

  const handleOpenAssignModal = (staff: ClinicReceptionist) => {
    setSelectedStaffForAssign(staff);
    const currentDocIds = (staff.assignedDoctors || [])
      .map((ad) => {
        const found = doctors.find((d) => d.user?.name === ad.doctor?.user?.name);
        return found?.id || '';
      })
      .filter(Boolean);
    setAssignedDoctorIds(currentDocIds);
  };

  const handleToggleDoctorAssignment = (docId: string) => {
    setAssignedDoctorIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedStaffForAssign) return;
    try {
      await assignDoctorsMutation.mutateAsync({
        receptionistId: selectedStaffForAssign.id,
        doctorIds: assignedDoctorIds,
      });
      setSelectedStaffForAssign(null);
      Alert.alert('Updated', 'Doctor assignments updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update assignments.');
    }
  };

  const handleOpenPasswordModal = (staff: ClinicReceptionist) => {
    setSelectedStaffForPassword(staff);
    setNewStaffPassword('');
  };

  const handleSavePassword = async () => {
    if (!selectedStaffForPassword) return;
    if (!newStaffPassword.trim() || newStaffPassword.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        userId: selectedStaffForPassword.user.id,
        newPassword: newStaffPassword.trim(),
      });
      setSelectedStaffForPassword(null);
      setNewStaffPassword('');
      Alert.alert('Success', 'Staff password reset successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to reset password.');
    }
  };

  const isLoading = activeTab === 'doctors' ? loadingDoctors : loadingReceptionists;
  const isRefetching = refetchingDoctors || refetchingReceptionists;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar with Segmented Controls */}
      <View style={styles.topContainer}>
        {/* Navigation & Segmented Tabs */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'doctors' && styles.tabBtnActive]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <Icon
              name="stethoscope"
              size={15}
              color={activeTab === 'doctors' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'doctors' && styles.tabBtnTextActive,
              ]}
            >
              Doctors ({doctors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'receptionists' && styles.tabBtnActive]}
            onPress={() => setActiveTab('receptionists')}
            activeOpacity={0.8}
          >
            <Icon
              name="users"
              size={15}
              color={activeTab === 'receptionists' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'receptionists' && styles.tabBtnTextActive,
              ]}
            >
              Receptionists ({receptionists.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action & Search Row */}
        {activeTab === 'doctors' ? (
          <View style={styles.actionBannerRow}>
            <View style={styles.searchBox}>
              <Icon name="search" size={15} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={doctorSearch}
                onChangeText={setDoctorSearch}
                placeholder="Search doctors by name, specialty..."
                placeholderTextColor={Colors.light.ink400}
              />
              {doctorSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDoctorSearch('')}>
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.primaryAddBtn}
              onPress={() => setShowAddDoctorModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>Add Doctor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionBannerRow}>
            <View style={styles.searchBox}>
              <Icon name="search" size={15} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={receptionistSearch}
                onChangeText={setReceptionistSearch}
                placeholder="Search staff by name or email..."
                placeholderTextColor={Colors.light.ink400}
              />
              {receptionistSearch.length > 0 && (
                <TouchableOpacity onPress={() => setReceptionistSearch('')}>
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryAddBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => setShowAddReceptionistModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.primaryAddBtnText}>Add Staff</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Main Content List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>
            Loading {activeTab === 'doctors' ? 'practicing doctors' : 'front desk staff'}...
          </Text>
        </View>
      ) : activeTab === 'doctors' ? (
        /* Doctors List */
        filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="stethoscope" size={28} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No Doctors Found</Text>
            <Text style={styles.emptySubtitle}>
              {doctorSearch.trim()
                ? 'No matching doctors match your search query.'
                : 'No practicing doctors associated with this clinic yet.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowAddDoctorModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Add First Doctor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefreshAll}
                tintColor={Colors.light.primary}
                colors={[Colors.light.primary]}
              />
            }
            renderItem={({ item }) => (
              <ClinicDoctorCard
                doctor={item}
                onEdit={(doc) => setSelectedDoctorForEdit(doc)}
                onViewQueue={() => router.push('/(clinic)/management?tab=queue')}
              />
            )}
          />
        )
      ) : (
        /* Receptionists List */
        filteredReceptionists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="users" size={28} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No Receptionists Found</Text>
            <Text style={styles.emptySubtitle}>
              {receptionistSearch.trim()
                ? 'No matching receptionists found.'
                : 'No front desk receptionist accounts registered for this clinic.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => setShowAddReceptionistModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Add First Staff</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredReceptionists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefreshAll}
                tintColor={Colors.light.primary}
                colors={[Colors.light.primary]}
              />
            }
            renderItem={({ item }) => {
              const staffName = item.user?.name || 'Staff';
              const initials = staffName
                .split(/\s+/)
                .map((w) => w.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const avatarUrl =
                item.avatar ||
                item.user?.avatar ||
                item.user?.profilePhoto ||
                (item as any).profilePhoto ||
                null;
              const resolvedAvatar = getImageUrl(avatarUrl);
              const isActive = item.user?.isActive !== false;
              const assignedDocs = item.assignedDoctors || [];

              return (
                <GradientCard variant="purple" style={styles.staffCard}>
                  <View style={styles.staffCardContent}>
                    {/* Header */}
                    <View style={styles.staffHeaderRow}>
                      <View style={styles.staffAvatar}>
                        {resolvedAvatar ? (
                          <Image source={{ uri: resolvedAvatar }} style={styles.staffAvatarImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.staffAvatarText}>{initials}</Text>
                        )}
                      </View>

                      <View style={styles.staffNameCol}>
                        <Text style={styles.staffNameText} numberOfLines={1}>
                          {staffName}
                        </Text>
                        <Text style={styles.staffEmailText} numberOfLines={1}>
                          {item.user?.email || 'N/A'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.activeBadge,
                          {
                            backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
                            borderColor: isActive ? '#A7F3D0' : '#FECDD3',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.activeBadgeText,
                            { color: isActive ? '#047857' : '#DC2626' },
                          ]}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Assigned Doctors */}
                    <View style={styles.assignedSection}>
                      <Text style={styles.assignedLabel}>ASSIGNED DOCTORS ({assignedDocs.length})</Text>
                      {assignedDocs.length === 0 ? (
                        <Text style={styles.noAssignedText}>Not assigned to any doctor</Text>
                      ) : (
                        <View style={styles.docsChipRow}>
                          {assignedDocs.map((ad, idx) => (
                            <View key={`doc-${idx}`} style={styles.docChip}>
                              <Icon name="stethoscope" size={10} color="#7C3AED" />
                              <Text style={styles.docChipText}>
                                Dr. {ad.doctor?.user?.name || 'Doctor'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Action buttons */}
                    <View style={styles.staffActionsRow}>
                      <TouchableOpacity
                        style={styles.staffActionBtn}
                        onPress={() => handleOpenAssignModal(item)}
                        activeOpacity={0.8}
                      >
                        <Icon name="sliders" size={13} color={Colors.light.primary} />
                        <Text style={styles.staffActionBtnText}>Assign Doctors</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.staffActionBtn}
                        onPress={() => handleOpenPasswordModal(item)}
                        activeOpacity={0.8}
                      >
                        <Icon name="lock" size={13} color={Colors.light.ink700} />
                        <Text style={styles.staffActionBtnText}>Reset Password</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </GradientCard>
              );
            }}
          />
        )
      )}

      {/* Modals */}
      <AddDoctorModal
        isOpen={showAddDoctorModal}
        onClose={() => {
          setShowAddDoctorModal(false);
          refetchDoctors();
        }}
      />

      <EditDoctorModal
        doctor={selectedDoctorForEdit}
        onClose={() => {
          setSelectedDoctorForEdit(null);
          refetchDoctors();
        }}
      />

      {/* Add Receptionist Modal */}
      <Modal
        visible={showAddReceptionistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddReceptionistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Front Desk Staff</Text>
              <TouchableOpacity
                onPress={() => setShowAddReceptionistModal(false)}
                style={styles.closeBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Staff Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addName}
                    onChangeText={setAddName}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addEmail}
                    onChangeText={setAddEmail}
                    placeholder="staff@clinic.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Password *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addPassword}
                    onChangeText={setAddPassword}
                    placeholder="Min 6 characters"
                    secureTextEntry
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addPhone}
                    onChangeText={setAddPhone}
                    placeholder="e.g. 9876543210"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#7C3AED' }]}
                  onPress={handleAddReceptionist}
                  disabled={addReceptionistMutation.isPending}
                  activeOpacity={0.85}
                >
                  {addReceptionistMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Receptionist</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Doctors Modal */}
      <Modal
        visible={!!selectedStaffForAssign}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStaffForAssign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Doctors</Text>
              <TouchableOpacity
                onPress={() => setSelectedStaffForAssign(null)}
                style={styles.closeBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <Text style={styles.modalSub}>
                  Select doctors this staff member is authorized to manage:
                </Text>

                {doctors.map((d) => {
                  const isAssigned = assignedDoctorIds.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.docAssignRow, isAssigned && styles.docAssignRowSelected]}
                      onPress={() => handleToggleDoctorAssignment(d.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.docAssignInfo}>
                        <Text style={styles.docAssignName}>
                          Dr. {d.user?.name || 'Doctor'}
                        </Text>
                        <Text style={styles.docAssignSpec}>
                          {d.specialization || 'General Physician'}
                        </Text>
                      </View>
                      <Icon
                        name={isAssigned ? 'check-circle' : 'circle'}
                        size={18}
                        color={isAssigned ? Colors.light.primary : Colors.light.ink400}
                      />
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveAssignments}
                  disabled={assignDoctorsMutation.isPending}
                  activeOpacity={0.85}
                >
                  {assignDoctorsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Assignments</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={!!selectedStaffForPassword}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStaffForPassword(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Staff Password</Text>
              <TouchableOpacity
                onPress={() => setSelectedStaffForPassword(null)}
                style={styles.closeBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newStaffPassword}
                  onChangeText={setNewStaffPassword}
                  placeholder="Min 6 characters"
                  secureTextEntry
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSavePassword}
                disabled={changePasswordMutation.isPending}
                activeOpacity={0.85}
              >
                {changePasswordMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
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
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.two,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  actionBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.ink900,
    padding: 0,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  primaryAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  staffCard: {
    marginBottom: 0,
  },
  staffCardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  staffHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  staffAvatarImage: {
    width: '100%',
    height: '100%',
  },
  staffAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffNameCol: {
    flex: 1,
    gap: 2,
  },
  staffNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  staffEmailText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  activeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  assignedSection: {
    gap: 4,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  assignedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    letterSpacing: 0.5,
  },
  noAssignedText: {
    fontSize: 11,
    color: Colors.light.ink400,
    fontStyle: 'italic',
  },
  docsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  docChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  staffActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingTop: 4,
  },
  staffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surface100,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  staffActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
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
  modalSub: {
    fontSize: 12,
    color: Colors.light.ink600,
    marginBottom: 4,
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
    paddingTop: Spacing.two,
  },
  formGroup: {
    gap: 4,
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
  submitBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docAssignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  docAssignRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  docAssignInfo: {
    gap: 2,
  },
  docAssignName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  docAssignSpec: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
});
