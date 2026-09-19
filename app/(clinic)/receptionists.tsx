import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useClinicReceptionists,
  useAddReceptionist,
  useClinicDoctors,
  useAssignDoctorsToReceptionist,
  useChangeStaffPassword,
} from '../../hooks/useClinic';
import {
  GradientCard,
  Icon,
} from '../../components';
import type { ClinicReceptionist } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function ClinicReceptionistsScreen() {
  const router = useRouter();

  const {
    data: receptionists = [],
    isLoading: loadingReceptionists,
    refetch: refetchReceptionists,
    isRefetching: refetchingReceptionists,
  } = useClinicReceptionists();

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
  } = useClinicDoctors();

  const addReceptionistMutation = useAddReceptionist();
  const assignDoctorsMutation = useAssignDoctorsToReceptionist();
  const changePasswordMutation = useChangeStaffPassword();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
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

  const filteredReceptionists = useMemo(() => {
    if (!searchQuery.trim()) return receptionists;
    const q = searchQuery.toLowerCase().trim();
    return receptionists.filter(
      (r) =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.user?.phone?.toLowerCase().includes(q)
    );
  }, [receptionists, searchQuery]);

  const handleRefresh = () => {
    refetchReceptionists();
    refetchDoctors();
  };

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

      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddPhone('');
      Alert.alert('Staff Added', 'Receptionist account created successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to add receptionist.');
    }
  };

  const openAssignModal = (staff: ClinicReceptionist) => {
    setSelectedStaffForAssign(staff);
    // Determine existing assigned doc IDs if possible
    setAssignedDoctorIds([]);
  };

  const toggleDoctorSelection = (docId: string) => {
    setAssignedDoctorIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSaveAssignedDoctors = async () => {
    if (!selectedStaffForAssign) return;

    try {
      await assignDoctorsMutation.mutateAsync({
        receptionistId: selectedStaffForAssign.id,
        doctorIds: assignedDoctorIds,
      });

      setSelectedStaffForAssign(null);
      Alert.alert('Updated', 'Doctor assignments updated for receptionist.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update assignments.');
    }
  };

  const handleSavePassword = async () => {
    if (!selectedStaffForPassword || !newStaffPassword.trim() || newStaffPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        userId: selectedStaffForPassword.user.id,
        newPassword: newStaffPassword.trim(),
      });

      setSelectedStaffForPassword(null);
      setNewStaffPassword('');
      Alert.alert('Password Changed', 'Staff account password has been updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  const isLoading = loadingReceptionists || loadingDoctors;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={18} color={Colors.light.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Receptionists & Staff</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.topContainer}>
        {/* 2. Banner */}
        <GradientCard variant="green" style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerTitles}>
                <Text style={styles.bannerHeading}>Front Desk Management</Text>
                <Text style={styles.bannerSub}>
                  {receptionists.length} Active front desk staff accounts
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addStaffBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addStaffBtnText}>Add Staff</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search staff by name, email, or phone..."
                placeholderTextColor={Colors.light.ink400}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GradientCard>
      </View>

      {/* 3. List Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading receptionist accounts...</Text>
        </View>
      ) : filteredReceptionists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="users" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching Staff Found' : 'No Receptionists Registered'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try refining your search keyword.'
              : 'Create receptionist accounts to manage token issuance and front-desk check-ins.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.addEmptyBtn}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.addEmptyBtnText}>Add First Staff Account</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredReceptionists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refetchingReceptionists}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => {
            const staffName = item.user?.name || 'Staff Member';
            const initials = staffName
              .trim()
              .split(/\s+/)
              .map((w) => w.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'ST';
            const assignedList = item.assignedDoctors || [];

            return (
              <GradientCard variant="blue" style={styles.staffCard}>
                <View style={styles.staffCardContent}>
                  <View style={styles.staffHeader}>
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staffName}</Text>
                      <Text style={styles.staffEmail}>{item.user?.email}</Text>
                      {item.user?.phone ? (
                        <Text style={styles.staffPhone}>{item.user.phone}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Assigned Doctors */}
                  <View style={styles.assignedSection}>
                    <Text style={styles.assignedLabel}>Assigned Doctors:</Text>
                    {assignedList.length === 0 ? (
                      <Text style={styles.noAssignedText}>All doctors accessible</Text>
                    ) : (
                      <View style={styles.doctorChipsRow}>
                        {assignedList.map((ad, idx) => (
                          <View key={`doc-${idx}`} style={styles.docChip}>
                            <Text style={styles.docChipText}>
                              Dr. {ad.doctor?.user?.name || 'Doctor'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openAssignModal(item)}
                      activeOpacity={0.8}
                    >
                      <Icon name="stethoscope" size={12} color={Colors.light.primary} />
                      <Text style={styles.actionBtnText}>Assign Doctors</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setSelectedStaffForPassword(item)}
                      activeOpacity={0.8}
                    >
                      <Icon name="lock" size={12} color={Colors.light.primary} />
                      <Text style={styles.actionBtnText}>Reset Password</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GradientCard>
            );
          }}
        />
      )}

      {/* Add Receptionist Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Front Desk Receptionist</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                  <Icon name="x" size={18} color={Colors.light.ink600} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Staff Full Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addName}
                    onChangeText={setAddName}
                    placeholder="e.g. Priya Sharma"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addEmail}
                    onChangeText={setAddEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="priya@clinic.com"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Temporary Password *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addPassword}
                    onChangeText={setAddPassword}
                    secureTextEntry
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addPhone}
                    onChangeText={setAddPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 98765 43210"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAddReceptionist}
                  disabled={addReceptionistMutation.isPending}
                  activeOpacity={0.85}
                >
                  {addReceptionistMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Staff Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Assign Doctors Modal */}
      <Modal
        visible={Boolean(selectedStaffForAssign)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStaffForAssign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Doctors</Text>
                <Text style={styles.modalSub}>{selectedStaffForAssign?.user?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedStaffForAssign(null)}
                style={styles.closeBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Select Permitted Doctors:</Text>
              <View style={styles.doctorSelectList}>
                {doctors.map((doc) => {
                  const isChecked = assignedDoctorIds.includes(doc.id);
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.docSelectItem, isChecked && styles.docSelectItemActive]}
                      onPress={() => toggleDoctorSelection(doc.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Icon name="check" size={12} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.docSelectName}>
                        Dr. {doc.user?.name} ({doc.specialization || 'General'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveAssignedDoctors}
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
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={Boolean(selectedStaffForPassword)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStaffForPassword(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reset Staff Password</Text>
                <Text style={styles.modalSub}>{selectedStaffForPassword?.user?.name}</Text>
              </View>
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
                  secureTextEntry
                  placeholder="Minimum 6 characters"
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitles: {
    flex: 1,
    gap: 2,
  },
  bannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addStaffBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
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
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  staffCard: {
    marginBottom: 0,
  },
  staffCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  staffAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffInfo: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  staffEmail: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  staffPhone: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  assignedSection: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    gap: 4,
  },
  assignedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
    textTransform: 'uppercase',
  },
  noAssignedText: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontStyle: 'italic',
  },
  doctorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  docChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  docChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
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
  addEmptyBtn: {
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
  addEmptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 11,
    color: Colors.light.ink500,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingBottom: Spacing.six,
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
  doctorSelectList: {
    gap: 6,
    maxHeight: 200,
  },
  docSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  docSelectItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.light.ink400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  docSelectName: {
    fontSize: 12,
    fontWeight: '600',
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
});
