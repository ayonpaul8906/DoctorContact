import React, { useState } from 'react';
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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSentReferrals,
  useCreateReferral,
  useSearchPatientByPhone,
  useSearchDiagnosticCenters,
} from '../../hooks/useDoctor';
import type { DiagnosticCenterLookup, PatientLookup } from '../../types';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'Blood Glucose Fasting/PP',
  'HbA1c',
  'Chest X-Ray',
  'ECG / EKG',
  'Ultrasound Abdomen',
];

export default function DoctorReferralsScreen() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [searchPhone, setSearchPhone] = useState('');
  const [foundPatient, setFoundPatient] = useState<PatientLookup | null>(null);
  const [centerSearch, setCenterSearch] = useState('');
  const [centerResults, setCenterResults] = useState<DiagnosticCenterLookup[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenterLookup | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');
  const [notes, setNotes] = useState('');

  // Queries & Mutations
  const {
    data: referrals = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSentReferrals();

  const searchPatientMutation = useSearchPatientByPhone();
  const searchCentersMutation = useSearchDiagnosticCenters();
  const createReferralMutation = useCreateReferral();

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) return;
    try {
      const p = await searchPatientMutation.mutateAsync(searchPhone.trim());
      if (p) {
        setFoundPatient(p);
      } else {
        Alert.alert('Patient Not Found', 'No registered patient found with this phone number.');
      }
    } catch {
      Alert.alert('Error', 'Unable to search patient by phone.');
    }
  };

  const handleSearchCenters = async (text: string) => {
    setCenterSearch(text);
    if (text.trim().length >= 2) {
      const results = await searchCentersMutation.mutateAsync(text.trim());
      setCenterResults(results);
    } else {
      setCenterResults([]);
    }
  };

  const handleToggleTest = (testName: string) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests((prev) => prev.filter((t) => t !== testName));
    } else {
      setSelectedTests((prev) => [...prev, testName]);
    }
  };

  const handleAddCustomTest = () => {
    if (!customTest.trim()) return;
    if (!selectedTests.includes(customTest.trim())) {
      setSelectedTests((prev) => [...prev, customTest.trim()]);
    }
    setCustomTest('');
  };

  const handleCreateReferral = async () => {
    if (!foundPatient) {
      Alert.alert('Patient Required', 'Please search and select a patient by phone number.');
      return;
    }
    if (!selectedCenter) {
      Alert.alert('Center Required', 'Please search and select a target Diagnostic Center.');
      return;
    }
    if (selectedTests.length === 0) {
      Alert.alert('Tests Required', 'Please select or add at least one diagnostic test.');
      return;
    }

    try {
      await createReferralMutation.mutateAsync({
        patientId: foundPatient.id,
        diagnosticCenterId: selectedCenter.id,
        testNames: selectedTests,
        notes: notes.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setFoundPatient(null);
      setSearchPhone('');
      setSelectedCenter(null);
      setSelectedTests([]);
      setNotes('');
      Alert.alert('Referral Issued', 'Diagnostic referral requisition created and sent to center.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to issue referral.');
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.topContainer}>
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Diagnostic Referrals</Text>
                <Text style={styles.headerSubtitle}>
                  Issue lab & imaging referrals to partner diagnostic centers
                </Text>
              </View>
              <TouchableOpacity
                style={styles.newReferralBtn}
                onPress={() => setIsCreateModalOpen(true)}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={13} color="#FFFFFF" />
                <Text style={styles.newReferralBtnText}>New Referral</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GradientCard>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading referrals...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={28} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Unable to load referrals</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Please check your connection.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : referrals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="file-text" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Diagnostic Referrals</Text>
          <Text style={styles.emptySubtitle}>
            Issue test requisitions to partner labs and imaging centers for your patients.
          </Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
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
          renderItem={({ item }) => {
            const patientName = item.patient?.name || item.patient?.user?.name || 'Patient';
            const patientPhone = item.patient?.phone || item.patient?.user?.phone;

            return (
              <GradientCard variant="purple" style={styles.referralCard}>
                <View style={styles.referralCardContent}>
                  <View style={styles.referralTopRow}>
                    <View style={styles.patientCol}>
                      <Text style={styles.patientNameText}>{patientName}</Text>
                      {patientPhone && (
                        <Text style={styles.patientPhoneText}>{patientPhone}</Text>
                      )}
                    </View>

                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>

                  {/* Diagnostic Center */}
                  <View style={styles.centerRow}>
                    <Icon name="building" size={13} color={Colors.light.primary} />
                    <Text style={styles.centerNameText}>
                      {item.diagnosticCenter?.centerName || 'Diagnostic Center'}
                    </Text>
                  </View>

                  {/* Tests List Pills */}
                  <View style={styles.testsListWrap}>
                    {(item.testNames || []).map((t, idx) => (
                      <View key={idx} style={styles.testPill}>
                        <Text style={styles.testPillText}>{t}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Notes */}
                  {item.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{item.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </GradientCard>
            );
          }}
        />
      )}

      {/* Issue Referral Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Test Referral</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* 1. Patient Search */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Patient Phone Lookup</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, styles.flex1]}
                      value={searchPhone}
                      onChangeText={setSearchPhone}
                      placeholder="Enter 10-digit phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={handleSearchPatient}
                      disabled={searchPatientMutation.isPending}
                    >
                      {searchPatientMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.searchBtnText}>Lookup</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {foundPatient && (
                    <View style={styles.patientFoundCard}>
                      <Icon name="check-circle" size={14} color="#16A34A" />
                      <Text style={styles.patientFoundName}>{foundPatient.name}</Text>
                      <Text style={styles.patientFoundMeta}>
                        {foundPatient.gender ? `${foundPatient.gender}, ` : ''}
                        {foundPatient.age != null ? `${foundPatient.age} yrs` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 2. Diagnostic Center Search */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Target Diagnostic Center</Text>
                  <TextInput
                    style={styles.formInput}
                    value={centerSearch}
                    onChangeText={handleSearchCenters}
                    placeholder="Search diagnostic center name..."
                    placeholderTextColor={Colors.light.ink400}
                  />

                  {centerResults.length > 0 && (
                    <View style={styles.centerResultsList}>
                      {centerResults.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.centerResultItem}
                          onPress={() => {
                            setSelectedCenter(c);
                            setCenterSearch(c.centerName);
                            setCenterResults([]);
                          }}
                        >
                          <Text style={styles.centerResultName}>{c.centerName}</Text>
                          {c.city && <Text style={styles.centerResultCity}>{c.city}</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedCenter && (
                    <View style={styles.selectedCenterBadge}>
                      <Icon name="building" size={13} color={Colors.light.primary} />
                      <Text style={styles.selectedCenterText}>{selectedCenter.centerName}</Text>
                    </View>
                  )}
                </View>

                {/* 3. Tests Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Select Recommended Tests</Text>
                  <View style={styles.testsGrid}>
                    {COMMON_TESTS.map((testName) => {
                      const isSel = selectedTests.includes(testName);
                      return (
                        <TouchableOpacity
                          key={testName}
                          style={[styles.testSelectChip, isSel && styles.testSelectChipActive]}
                          onPress={() => handleToggleTest(testName)}
                        >
                          <Text style={[styles.testSelectText, isSel && styles.testSelectTextActive]}>
                            {testName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Add Custom Test */}
                  <View style={styles.customTestRow}>
                    <TextInput
                      style={[styles.formInput, styles.flex1]}
                      value={customTest}
                      onChangeText={setCustomTest}
                      placeholder="Add other custom test..."
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity style={styles.addTestBtn} onPress={handleAddCustomTest}>
                      <Text style={styles.addTestBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Clinical Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Clinical Notes & Instructions (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. Fasting sample required, urgent report requested."
                    placeholderTextColor={Colors.light.ink400}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreateReferral}
                  disabled={createReferralMutation.isPending}
                >
                  {createReferralMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Issue Diagnostic Referral</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  newReferralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  newReferralBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  referralCard: {
    marginBottom: Spacing.two,
  },
  referralCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  referralTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientCol: {
    gap: 2,
    flex: 1,
  },
  patientNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  patientPhoneText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  dateBadge: {
    backgroundColor: Colors.light.surface50,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  dateBadgeText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  testsListWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  notesBox: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  notesText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  modalScroll: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  patientFoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  patientFoundName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  patientFoundMeta: {
    fontSize: 11,
    color: '#065F46',
  },
  centerResultsList: {
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    maxHeight: 120,
  },
  centerResultItem: {
    padding: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  centerResultName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  centerResultCity: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  selectedCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  selectedCenterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testSelectChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface100,
  },
  testSelectChipActive: {
    backgroundColor: Colors.light.primary,
  },
  testSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  testSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customTestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addTestBtn: {
    backgroundColor: Colors.light.surface100,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  addTestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  formInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  notesInput: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  flex1: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
