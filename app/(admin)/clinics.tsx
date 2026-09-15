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
import { useAdminClinics, useApproveClinic } from '../../hooks/useAdmin';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
];

function ClinicCard({ clinic, onApprove, isApproving }: {
  clinic: any;
  onApprove: () => void;
  isApproving: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.clinicAvatar}>
          <Text style={styles.clinicAvatarText}>
            {clinic.name?.charAt(0)?.toUpperCase() ?? 'C'}
          </Text>
        </View>
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName} numberOfLines={1}>{clinic.name}</Text>
          <View style={styles.cityRow}>
            <Icon name="map-pin" size={12} color={Colors.light.ink500} />
            <Text style={styles.clinicCity}>{clinic.city || 'Unknown City'}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            clinic.isApproved ? styles.statusApproved : styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              clinic.isApproved ? styles.statusTextApproved : styles.statusTextPending,
            ]}
          >
            {clinic.isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        {clinic.phone && (
          <View style={styles.metaItem}>
            <Icon name="phone" size={12} color={Colors.light.ink500} />
            <Text style={styles.metaText}>{clinic.phone}</Text>
          </View>
        )}
        {clinic.doctorCount !== undefined && (
          <View style={styles.metaItem}>
            <Icon name="stethoscope" size={12} color={Colors.light.ink500} />
            <Text style={styles.metaText}>{clinic.doctorCount} doctor{clinic.doctorCount !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {!clinic.isApproved && (
        <TouchableOpacity
          style={[styles.approveBtn, isApproving && styles.approveBtnDisabled]}
          onPress={onApprove}
          activeOpacity={0.8}
          disabled={isApproving}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="check-circle" size={14} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve Clinic</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AdminClinicsScreen() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: clinics, isLoading, isError, refetch, isRefetching } = useAdminClinics();
  const { mutateAsync: approveClinic } = useApproveClinic();

  const filtered = (clinics ?? []).filter((c) => {
    if (statusFilter === 'approved') return c.isApproved === true;
    if (statusFilter === 'pending') return c.isApproved === false;
    return true;
  });

  const handleApprove = async (clinicId: string) => {
    Alert.alert('Approve Clinic', 'Are you sure you want to approve this clinic?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setApprovingId(clinicId);
            await approveClinic(clinicId);
          } catch {
            Alert.alert('Error', 'Failed to approve clinic. Please try again.');
          } finally {
            setApprovingId(null);
          }
        },
      },
    ]);
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
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Clinics Directory"
              subtitle="Review and approve clinic registrations"
              badgeText="Admin"
            />

            {/* Status Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.filterPill,
                    statusFilter === f.value && styles.filterPillActive,
                  ]}
                  onPress={() => setStatusFilter(f.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      statusFilter === f.value && styles.filterPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!isLoading && (
              <Text style={styles.countText}>
                {filtered.length} clinic{filtered.length !== 1 ? 's' : ''}
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
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
          <ClinicCard
            clinic={item}
            onApprove={() => handleApprove(item.id)}
            isApproving={approvingId === item.id}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
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
    paddingRight: 4,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
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
    fontWeight: '500',
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clinicAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  clinicAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clinicCity: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#15803D',
  },
  statusTextPending: {
    color: '#B45309',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.surface100,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  approveBtnDisabled: {
    opacity: 0.7,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.three,
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  errorState: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.four,
    gap: 8,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.danger,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
