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
import { useAdminDoctors, useVerifyDoctor } from '../../hooks/useAdmin';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
];

function DoctorCard({ doctor, onVerify, isVerifying }: {
  doctor: any;
  onVerify: () => void;
  isVerifying: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {doctor.name?.charAt(0)?.toUpperCase() ?? 'D'}
          </Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
          {doctor.specialization && (
            <View style={styles.specPill}>
              <Text style={styles.specText}>{doctor.specialization}</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            doctor.isVerified ? styles.verified : styles.unverified,
          ]}
        >
          {doctor.isVerified ? (
            <Icon name="check-circle" size={10} color="#15803D" />
          ) : (
            <Icon name="clock" size={10} color="#B45309" />
          )}
          <Text
            style={[
              styles.statusText,
              doctor.isVerified ? styles.statusVerified : styles.statusUnverified,
            ]}
          >
            {doctor.isVerified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      {doctor.clinicName && (
        <View style={styles.clinicRow}>
          <Icon name="building" size={12} color={Colors.light.ink500} />
          <Text style={styles.clinicText}>{doctor.clinicName}</Text>
        </View>
      )}

      {!doctor.isVerified && (
        <TouchableOpacity
          style={[styles.verifyBtn, isVerifying && styles.verifyBtnDisabled]}
          onPress={onVerify}
          activeOpacity={0.8}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="shield-check" size={14} color="#FFFFFF" />
              <Text style={styles.verifyBtnText}>Verify Doctor</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AdminDoctorsScreen() {
  const [filter, setFilter] = useState('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data: doctors, isLoading, isError, refetch, isRefetching } = useAdminDoctors();
  const { mutateAsync: verifyDoctor } = useVerifyDoctor();

  const filtered = (doctors ?? []).filter((d) => {
    if (filter === 'verified') return d.isVerified === true;
    if (filter === 'unverified') return d.isVerified === false;
    return true;
  });

  const handleVerify = (doctorId: string) => {
    Alert.alert('Verify Doctor', 'Verify this doctor\'s credentials?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: async () => {
          try {
            setVerifyingId(doctorId);
            await verifyDoctor(doctorId);
          } catch {
            Alert.alert('Error', 'Failed to verify doctor. Please try again.');
          } finally {
            setVerifyingId(null);
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
              title="Doctors Directory"
              subtitle="Verify and manage doctor profiles"
              badgeText="Admin"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map((f) => (
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
                {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.stateText}>Loading doctors...</Text>
              </View>
            )}
            {!isLoading && isError && (
              <View style={styles.errorState}>
                <Icon name="alert-circle" size={20} color={Colors.light.danger} />
                <Text style={styles.errorText}>Failed to load doctors</Text>
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
              title="No Doctors Found"
              description="No doctors match the current filter."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <DoctorCard
            doctor={item}
            onVerify={() => handleVerify(item.id)}
            isVerifying={verifyingId === item.id}
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  doctorInfo: {
    flex: 1,
    gap: 4,
  },
  doctorName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  specPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  verified: {
    backgroundColor: '#DCFCE7',
  },
  unverified: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusVerified: {
    color: '#15803D',
  },
  statusUnverified: {
    color: '#B45309',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  verifyBtn: {
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
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
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
