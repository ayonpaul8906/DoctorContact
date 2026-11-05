import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAdminUsers,
  useToggleUserStatus,
  useCreateAdmin,
  type AdminUser,
  type CreateAdminInput,
} from '../../hooks/useAdmin';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const ROLES = ['ALL', 'PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'] as const;

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  PATIENT: { bg: '#EFF6FF', text: '#1D4ED8' },
  DOCTOR: { bg: '#ECFDF5', text: '#059669' },
  CLINIC: { bg: '#FFF7ED', text: '#EA580C' },
  RECEPTIONIST: { bg: '#FDF4FF', text: '#7C3AED' },
  ADMIN: { bg: '#FEF3C7', text: '#92400E' },
  SUPER_ADMIN: { bg: '#FEF2F2', text: '#DC2626' },
};

export default function SuperAdminUsersScreen() {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const [adminForm, setAdminForm] = useState<CreateAdminInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const roleParam = selectedRole === 'ALL' ? undefined : selectedRole;
  const { data, isLoading, isError, refetch, isRefetching } = useAdminUsers({
    role: roleParam,
    limit: 100,
  });

  const toggleStatusMutation = useToggleUserStatus();
  const createAdminMutation = useCreateAdmin();

  const users = data?.users ?? [];

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
    );
  }, [users, search]);

  const handleToggleStatus = (u: AdminUser) => {
    const nextState = !u.isActive;
    const actionWord = nextState ? 'activate' : 'deactivate';

    Alert.alert(
      `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} Account`,
      `Are you sure you want to ${actionWord} the account of "${u.name}" (${u.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextState ? 'Activate' : 'Deactivate',
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await toggleStatusMutation.mutateAsync({
                userId: u.id,
                isActive: nextState,
              });
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };

  const handleCreateAdminSubmit = async () => {
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      Alert.alert('Validation Error', 'Full Name, Email, and Temporary Password are required.');
      return;
    }

    try {
      await createAdminMutation.mutateAsync(adminForm);
      Alert.alert('Success', `Admin account created for ${adminForm.name}!`);
      setShowAddAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', phone: '' });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create admin account.');
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Users & Access Control</Text>
          <Text style={styles.subtitle}>Super Admin user management & privilege assignment</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddAdminModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Tabs */}
      <View style={styles.tabScrollWrap}>
        <FlatList
          horizontal
          data={ROLES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          renderItem={({ item }) => {
            const isActive = selectedRole === item;
            return (
              <TouchableOpacity
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setSelectedRole(item)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item === 'ALL'
                    ? 'All Users'
                    : item === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : item.charAt(0) + item.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={Colors.light.ink400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          placeholderTextColor={Colors.light.ink400}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="x" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={styles.loadingText}>Loading user records...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="users" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try adjusting your search criteria.' : 'No users match this role filter.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const roleStyle = ROLE_STYLES[item.role] || { bg: '#F1F5F9', text: '#475569' };

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: roleStyle.bg }]}>
                  <Text style={[styles.avatarText, { color: roleStyle.text }]}>
                    {item.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.rolePill, { backgroundColor: roleStyle.bg }]}>
                      <Text style={[styles.rolePillText, { color: roleStyle.text }]}>
                        {item.role}
                      </Text>
                    </View>
                  </View>

                  {item.email ? (
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {item.email}
                    </Text>
                  ) : null}

                  {item.phone ? (
                    <View style={styles.phoneRow}>
                      <Icon name="phone" size={11} color={Colors.light.ink500} />
                      <Text style={styles.userPhone}>{item.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  {/* Status Indicator */}
                  <View
                    style={[
                      styles.statusPill,
                      item.isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        item.isActive ? styles.statusDotActive : styles.statusDotInactive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        item.isActive ? styles.statusTextActive : styles.statusTextInactive,
                      ]}
                    >
                      {item.isActive ? 'Active' : 'Deactivated'}
                    </Text>
                  </View>
                  <Text style={styles.joinedText}>Joined {formatDate(item.createdAt)}</Text>
                </View>

                {/* Status Toggle Action */}
                {item.role !== 'SUPER_ADMIN' && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      item.isActive ? styles.deactivateBtn : styles.activateBtn,
                    ]}
                    onPress={() => handleToggleStatus(item)}
                    disabled={toggleStatusMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.isActive ? styles.deactivateBtnText : styles.activateBtnText,
                      ]}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Create Admin Modal */}
      <Modal
        visible={showAddAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddAdminModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create New Admin</Text>
                <Text style={styles.modalSubtitle}>Grant full platform management access</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddAdminModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={20} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Admin Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                value={adminForm.name}
                onChangeText={(v) => setAdminForm({ ...adminForm, name: v })}
              />

              <Text style={styles.inputLabel}>Official Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@doctorcontact.in"
                keyboardType="email-address"
                autoCapitalize="none"
                value={adminForm.email}
                onChangeText={(v) => setAdminForm({ ...adminForm, email: v })}
              />

              <Text style={styles.inputLabel}>Temporary Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                secureTextEntry
                value={adminForm.password}
                onChangeText={(v) => setAdminForm({ ...adminForm, password: v })}
              />

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9830011223"
                keyboardType="phone-pad"
                value={adminForm.phone}
                onChangeText={(v) => setAdminForm({ ...adminForm, phone: v })}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateAdminSubmit}
                disabled={createAdminMutation.isPending}
                activeOpacity={0.8}
              >
                {createAdminMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="shield-check" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Create Admin Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extrabold,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabScrollWrap: {
    maxHeight: 44,
    marginBottom: 6,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItemActive: {
    backgroundColor: '#B45309',
    borderColor: '#B45309',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  joinedText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  deactivateBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  activateBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deactivateBtnText: {
    color: '#DC2626',
  },
  activateBtnText: {
    color: '#15803D',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#D97706',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 32,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
