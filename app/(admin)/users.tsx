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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAdminUsers,
  useToggleUserStatus,
  type AdminUser,
} from '../../hooks/useAdmin';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const ROLES = ['ALL', 'PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST', 'ADMIN'] as const;

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  PATIENT: { bg: '#EFF6FF', text: '#1D4ED8' },
  DOCTOR: { bg: '#ECFDF5', text: '#059669' },
  CLINIC: { bg: '#FFF7ED', text: '#EA580C' },
  RECEPTIONIST: { bg: '#FDF4FF', text: '#7C3AED' },
  ADMIN: { bg: '#F1F5F9', text: '#334155' },
  SUPER_ADMIN: { bg: '#FEF2F2', text: '#DC2626' },
};

export default function AdminUsersScreen() {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const roleParam = selectedRole === 'ALL' ? undefined : selectedRole;
  const { data, isLoading, isError, refetch, isRefetching } = useAdminUsers({
    role: roleParam,
    limit: 100,
  });

  const toggleStatusMutation = useToggleUserStatus();

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
        <View>
          <Text style={styles.title}>User Directory</Text>
          <Text style={styles.subtitle}>Patient, provider, and administrative accounts</Text>
        </View>
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
                  {item === 'ALL' ? 'All Roles' : item.charAt(0) + item.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search Input */}
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
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading user registry...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Icon name="users" size={36} color={Colors.light.ink300} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try adjusting your search criteria.' : 'No users registered under this role.'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
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
    color: Colors.light.ink500,
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
});
