import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDiagnosticCenterStaff,
  useAddDiagnosticStaff,
  useChangeDiagnosticStaffPassword,
  type DiagnosticStaffMember,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DiagnosticStaffScreen() {
  const {
    data: staff = [],
    isLoading,
    refetch,
    isRefetching,
  } = useDiagnosticCenterStaff();

  const addStaffMutation = useAddDiagnosticStaff();
  const changePasswordMutation = useChangeDiagnosticStaffPassword();

  // Add staff modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Change password modal state
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<DiagnosticStaffMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAddModalVisible(true);
  };

  const handleAddStaff = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Required', 'Please fill in Full Name, Email, and Temporary Password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      await addStaffMutation.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
      setAddModalVisible(false);
      Alert.alert('Success', 'Diagnostic lab staff registered successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to register staff member.');
    }
  };

  const handleOpenPwdModal = (member: DiagnosticStaffMember) => {
    setSelectedStaff(member);
    setNewPassword('');
    setConfirmPassword('');
    setPwdModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!selectedStaff) return;
    const userId = selectedStaff.userId || selectedStaff.user?.id || selectedStaff.id;

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Required', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        userId,
        newPassword,
      });
      setPwdModalVisible(false);
      setSelectedStaff(null);
      Alert.alert('Success', 'Password has been updated for this staff member.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change staff password.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Laboratory Staff</Text>
          <Text style={styles.headerSubtitle}>
            Technicians, phlebotomists & lab assistants
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Fetching lab team members...</Text>
        </View>
      )}

      {/* Staff List */}
      {!isLoading && (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => { refetch(); }}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {staff.length} team member{staff.length !== 1 ? 's' : ''} active in this center
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="users" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Staff Members Registered</Text>
              <Text style={styles.emptySubtitle}>
                Add lab technicians and sample collection staff to assign tests and process orders.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAddModal}
              >
                <Text style={styles.emptyAddBtnText}>Add First Staff Member</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const displayName = item.user?.name || item.name || 'Staff Member';
            const displayEmail = item.user?.email || item.email || '';
            const displayPhone = item.user?.phone || item.phone;
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {displayEmail}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Icon name="shield-check" size={11} color="#16A34A" />
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>

                {displayPhone ? (
                  <View style={styles.phoneRow}>
                    <Icon name="phone" size={12} color="#64748B" />
                    <Text style={styles.phoneText}>{displayPhone}</Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.roleWrap}>
                    <Icon name="flask" size={12} color="#0F766E" />
                    <Text style={styles.roleText}>Diagnostic Staff</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.changePwdBtn}
                    onPress={() => handleOpenPwdModal(item)}
                  >
                    <Icon name="lock" size={12} color="#2563EB" />
                    <Text style={styles.changePwdBtnText}>Change Password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ============================================================
          ADD STAFF MODAL
      ============================================================ */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register New Lab Staff</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Icon name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Tanmoy Roy"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Email Address (Login ID) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. tanmoy@lab.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +91 98321 00011"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <Text style={styles.inputLabel}>Temporary Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    addStaffMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={handleAddStaff}
                  disabled={addStaffMutation.isPending}
                >
                  {addStaffMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="users" size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Register Staff Member</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============================================================
          CHANGE PASSWORD MODAL
      ============================================================ */}
      <Modal
        visible={pwdModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPwdModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Change Password for {selectedStaff?.user?.name || selectedStaff?.name}
                </Text>
                <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
                  <Icon name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>New Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    changePasswordMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="lock" size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Update Password</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.three,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  email: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  phoneText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 11.5,
    color: '#0F766E',
    fontWeight: '600',
  },
  changePwdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  changePwdBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
