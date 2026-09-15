import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, Icon, EmptyState } from '../../components';
import { useAdminUsers } from '../../hooks/useAdmin';
import { Colors, Spacing, Radius, Typography } from '../../theme';

const ROLE_FILTERS = ['All', 'PATIENT', 'DOCTOR', 'CLINIC', 'ADMIN'] as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  PATIENT: { bg: '#EFF6FF', text: '#1D4ED8' },
  DOCTOR: { bg: '#F0FDF4', text: '#15803D' },
  CLINIC: { bg: '#FFF7ED', text: '#EA580C' },
  ADMIN: { bg: '#FDF4FF', text: '#7C3AED' },
  SUPER_ADMIN: { bg: '#FEF2F2', text: '#DC2626' },
};

const AVATAR_COLORS = ['#1D4ED8', '#15803D', '#EA580C', '#7C3AED', '#DC2626', '#0369A1'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const { data: users, isLoading, isError, refetch, isRefetching } = useAdminUsers();

  const filtered = useMemo(() => {
    const list = users ?? [];
    return list.filter((u) => {
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

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
        <ScreenHeader
          title="Users & Accounts"
          subtitle="Manage all registered platform users"
          badgeText="Admin Portal"
        />

        {/* Search */}
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or phone..."
            placeholderTextColor={Colors.light.ink400}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="x" size={16} color={Colors.light.ink400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          <View style={styles.pillsRow}>
            {ROLE_FILTERS.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.pill,
                  roleFilter === role && styles.pillActive,
                ]}
                onPress={() => setRoleFilter(role)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    roleFilter === role && styles.pillTextActive,
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Count */}
        <Text style={styles.countText}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.stateText}>Loading users...</Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-triangle" size={24} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Failed to load users</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Icon name="refresh-cw" size={14} color="#FFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title="No Users Found"
            description={search ? 'Try adjusting your search or filters.' : 'No users registered yet.'}
          />
        )}

        {/* User List */}
        {!isLoading && !isError && filtered.map((user) => {
          const roleStyle = ROLE_COLORS[user.role] ?? { bg: '#F3F4F6', text: '#374151' };
          const avatarColor = getAvatarColor(user.name);
          return (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{user.name}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                      <Text style={[styles.roleText, { color: roleStyle.text }]}>{user.role}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                {user.phone ? (
                  <View style={styles.metaItem}>
                    <Icon name="phone" size={12} color={Colors.light.ink400} />
                    <Text style={styles.metaText}>{user.phone}</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <Icon name="calendar" size={12} color={Colors.light.ink400} />
                  <Text style={styles.metaText}>Joined {formatDate(user.createdAt)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.backgroundSoft },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: 64, gap: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.ink900,
  },
  pillsScroll: { flexGrow: 0 },
  pillsRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  pillActive: { backgroundColor: Colors.light.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pillTextActive: { color: '#FFFFFF' },
  countText: { fontSize: 12, color: Colors.light.ink500, fontWeight: '500' },
  centerState: { alignItems: 'center', gap: 8, paddingVertical: Spacing.five },
  stateText: { fontSize: 13, color: Colors.light.ink500 },
  errorContainer: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.four,
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.danger },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  retryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.light.ink900, flex: 1 },
  roleBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: Radius.full },
  roleText: { fontSize: 10, fontWeight: '700' },
  cardEmail: { fontSize: 12, color: Colors.light.ink500 },
  cardBottom: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.light.ink500 },
});
