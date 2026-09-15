import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDoctorPatients, useSearchClinics } from '../../hooks/useDoctor';
import {
  GradientCard,
  DoctorPatientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DoctorPatientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Fetch Clinics for filter
  const { data: clinics = [] } = useSearchClinics();

  // Fetch Patients
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorPatients({
    search: searchQuery || undefined,
    clinicId: selectedClinicId !== 'ALL' ? selectedClinicId : undefined,
    page,
    limit: 20,
  });

  const patientsList = apiResponse?.patients ?? [];
  const totalCount = apiResponse?.total ?? patientsList.length;

  const filteredPatients = useMemo(() => {
    return patientsList.filter((p) => {
      if (selectedClinicId !== 'ALL' && p.clinicId && p.clinicId !== selectedClinicId) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesEmail = p.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }
      return true;
    });
  }, [patientsList, selectedClinicId, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClinicId('ALL');
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Card with Search & Filters */}
      <View style={styles.topContainer}>
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Patient Directory</Text>
                <Text style={styles.headerSubtitle}>
                  Search patient history and records across clinics
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{totalCount} Patients</Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setPage(1);
                }}
                placeholder="Search by name, phone or email..."
                placeholderTextColor={Colors.light.ink400}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Clinic Filter Chips */}
            {clinics.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedClinicId === 'ALL' && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedClinicId('ALL');
                    setPage(1);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedClinicId === 'ALL' && styles.filterChipTextActive,
                    ]}
                  >
                    All Clinics
                  </Text>
                </TouchableOpacity>

                {clinics.map((clinic) => {
                  const isSelected = selectedClinicId === clinic.id;
                  return (
                    <TouchableOpacity
                      key={clinic.id}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        setSelectedClinicId(clinic.id);
                        setPage(1);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {clinic.clinicName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </GradientCard>
      </View>

      {/* 2. Content List */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading patient records...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={28} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Unable to load patient directory</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="users" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Patients Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedClinicId !== 'ALL'
              ? 'No patient records matched your active search filters.'
              : 'Patients who complete appointments with you will appear here.'}
          </Text>
          {(searchQuery || selectedClinicId !== 'ALL') && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.clearBtnText}>Clear Search Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item, idx) => item.id || item.patientId || `patient-${idx}`}
          renderItem={({ item }) => <DoctorPatientCard patient={item} />}
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
        />
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
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
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginTop: Spacing.two,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    marginBottom: 4,
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
    lineHeight: 16,
    maxWidth: 280,
  },
  clearBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 9,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
