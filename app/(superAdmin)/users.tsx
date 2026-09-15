import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSuperAdminUsers } from '../../hooks/useSuperAdmin';
import { ScreenHeader, UserCard, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import type { Role } from '../../types';

const ROLE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Patient', value: 'PATIENT' },
  { label: 'Doctor', value: 'DOCTOR' },
  { label: 'Clinic', value: 'CLINIC' },
  { label: 'Receptionist', value: 'RECEPTIONIST' },
  { label: 'Diagnostics', value: 'DIAGNOSTIC_CENTER' },
  { label: 'Admin', value: 'ADMIN' },
];

export default function SuperAdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { data: users, isLoading, isError, refetch, isRefetching } = useSuperAdminUsers();

  const filtered = (users ?? []).filter((u: any) => {
    const matchesSearch =
      search.trim() === '' ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Platform User Management"
              subtitle="Oversight of all registered roles, accounts & security states"
              badgeText="Super Admin"
            />

            <View style={styles.searchContainer}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search across all users..."
                placeholderTextColor={Colors.light.ink400}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {ROLE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterPill, roleFilter === f.value && styles.filterPillActive]}
                  onPress={() => setRoleFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      roleFilter === f.value && styles.filterPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!isLoading && (
              <Text style={styles.countText}>
                {filtered.length} user{filtered.length !== 1 ? 's' : ''} found
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color="#D97706" />
                <Text style={styles.stateText}>Loading user registry...</Text>
              </View>
            )}
            {!isLoading && isError && (
              <View style={styles.errorState}>
                <Icon name="alert-circle" size={20} color={Colors.light.danger} />
                <Text style={styles.errorText}>Failed to load users</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState
              title="No Users Match"
              description="No registered user accounts found for the current query."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <UserCard
            id={item.id}
            name={item.name}
            email={item.email}
            role={item.role as Role}
            phone={item.phone}
            createdAt={item.createdAt}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFBFC',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.ink900,
    padding: 0,
  },
  filterScroll: {
    marginBottom: Spacing.three,
  },
  filterContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#D97706',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  countText: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginBottom: Spacing.two,
  },
  centerState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.four,
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  errorState: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: Spacing.four,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.danger,
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
