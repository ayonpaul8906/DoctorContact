import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClinicDoctors } from '../../hooks/useClinic';
import {
  GradientCard,
  ClinicDoctorCard,
  AddDoctorModal,
  EditDoctorModal,
  Icon,
} from '../../components';
import type { ClinicDoctor } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function ClinicDoctorsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<ClinicDoctor | null>(null);

  const {
    data: doctors = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useClinicDoctors();

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase().trim();
    return doctors.filter(
      (d) =>
        d.user?.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.qualification?.toLowerCase().includes(q) ||
        d.user?.email?.toLowerCase().includes(q)
    );
  }, [doctors, searchQuery]);

  const activeCount = doctors.filter((d) => d.user?.isActive !== false).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topContainer}>
        {/* 1. Header Card */}
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitles}>
                <Text style={styles.headerTitle}>Clinic Doctors</Text>
                <Text style={styles.headerSubtitle}>
                  {doctors.length} Registered • {activeCount} Active Practicing
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addDoctorBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addDoctorBtnText}>Add Doctor</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by doctor name or specialty..."
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

      {/* 2. Content List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading affiliated doctors...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={28} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Unable to load doctors</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Please check connection.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="stethoscope" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching Doctors Found' : 'No Doctors Added Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try refining your search keyword.'
              : 'Register doctors to manage their consultation queues and schedules.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.addDoctorEmptyBtn}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addDoctorEmptyBtnText}>Register First Doctor</Text>
            </TouchableOpacity>
          )}
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
              onRefresh={refetch}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => (
            <ClinicDoctorCard
              doctor={item}
              onEdit={(doc) => setSelectedDoctorForEdit(doc)}
              onViewQueue={() => router.push('/(clinic)/queue')}
            />
          )}
        />
      )}

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Doctor Modal */}
      <EditDoctorModal
        doctor={selectedDoctorForEdit}
        onClose={() => setSelectedDoctorForEdit(null)}
      />
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
  },
  headerCard: {
    marginBottom: 0,
  },
  headerContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  addDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addDoctorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    padding: 0,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconBox: {
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
  addDoctorEmptyBtn: {
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
  addDoctorEmptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
