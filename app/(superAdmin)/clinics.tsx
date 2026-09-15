import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSuperAdminClinics, useToggleFeaturedClinic } from '../../hooks/useSuperAdmin';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
];

export default function SuperAdminClinicsScreen() {
  const [filter, setFilter] = useState('all');
  const { data: clinics, isLoading, isError, refetch, isRefetching } = useSuperAdminClinics();
  const { mutateAsync: toggleFeatured } = useToggleFeaturedClinic();

  const filtered = (clinics ?? []).filter((c) => {
    if (filter === 'featured') return c.isFeatured === true;
    if (filter === 'approved') return c.isApproved === true;
    if (filter === 'pending') return c.isApproved === false;
    return true;
  });

  const handleToggleFeatured = async (clinicId: string, current: boolean) => {
    try {
      await toggleFeatured({ clinicId, featured: !current });
    } catch {
      Alert.alert('Error', 'Failed to update featured status.');
    }
  };

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
              title="Clinics Governance"
              subtitle="All registered clinics, verification & featured status"
              badgeText="Super Admin"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
                  onPress={() => setFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filter === f.value && styles.filterPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!isLoading && (
              <Text style={styles.countText}>
                {filtered.length} clinic{filtered.length !== 1 ? 's' : ''} in directory
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color="#D97706" />
                <Text style={styles.stateText}>Loading clinics...</Text>
              </View>
            )}
            {!isLoading && isError && (
              <View style={styles.errorState}>
                <Icon name="alert-circle" size={20} color={Colors.light.danger} />
                <Text style={styles.errorText}>Failed to load clinics</Text>
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
              title="No Clinics Found"
              description="No clinics match the current filter."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.clinicAvatar}>
                <Text style={styles.avatarText}>
                  {item.name?.slice(0, 2).toUpperCase() || 'CL'}
                </Text>
              </View>
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.clinicCity}>{item.city || 'Dubrajpur'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.featuredToggle, item.isFeatured && styles.featuredToggleActive]}
                onPress={() => handleToggleFeatured(item.id, !!item.isFeatured)}
                activeOpacity={0.7}
              >
                <Icon
                  name="star"
                  size={12}
                  color={item.isFeatured ? '#FFFFFF' : '#D97706'}
                />
                <Text
                  style={[
                    styles.featuredToggleText,
                    item.isFeatured && styles.featuredToggleTextActive,
                  ]}
                >
                  {item.isFeatured ? 'Featured' : 'Make Featured'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {item.isApproved ? 'Approved' : 'Pending Review'}
                </Text>
              </View>
              {item.doctorCount !== undefined && (
                <Text style={styles.doctorCountText}>
                  {item.doctorCount} Doctors
                </Text>
              )}
            </View>
          </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clinicAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  clinicCity: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D97706',
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  featuredToggleActive: {
    backgroundColor: '#D97706',
  },
  featuredToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  featuredToggleTextActive: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  doctorCountText: {
    fontSize: 11,
    color: Colors.light.ink500,
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
