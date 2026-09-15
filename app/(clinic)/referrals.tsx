import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSentReferrals,
  useSearchPatientByPhone,
  useSearchDiagnosticCenters,
  useCreateReferral,
} from '../../hooks/useDoctor';
import {
  GradientCard,
  Icon,
} from '../../components';
import type { PatientLookup, DiagnosticCenterLookup } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'HbA1c / Blood Glucose',
  'Chest X-Ray',
  'ECG / Electrocardiogram',
  'Ultrasound (USG Abdomen)',
];

export default function ClinicReferralsScreen() {
  const router = useRouter();

  const {
    data: referrals = [],
    isLoading: loadingReferrals,
    refetch,
    isRefetching,
  } = useSentReferrals();

  // Create referral modal state
  const [showModal, setShowModal] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [patient, setPatient] = useState<PatientLookup | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);

  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenterLookup | null>(null);

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');
  const [notes, setNotes] = useState('');

  const searchPatientMutation = useSearchPatientByPhone();
  const searchCentersMutation = useSearchDiagnosticCenters();
  const createReferralMutation = useCreateReferral();

  const handlePatientSearch = async () => {
    if (!phoneSearch.trim() || phoneSearch.trim().length < 6) {
      Alert.alert('Search', 'Please enter a valid phone number.');
      return;
    }
    setPatientNotFound(false);
    setPatient(null);

    try {
      const res = await searchPatientMutation.mutateAsync(phoneSearch.trim());
      if (res) {
        setPatient(res);
      } else {
        setPatientNotFound(true);
      }
    } catch {
      setPatientNotFound(true);
    }
  };

  const handleCenterSearch = async () => {
    if (!centerSearchQuery.trim()) return;
    try {
      await searchCentersMutation.mutateAsync(centerSearchQuery.trim());
    } catch {}
  };

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleAddCustomTest = () => {
    const t = customTest.trim();
    if (t && !selectedTests.includes(t)) {
      setSelectedTests((prev) => [...prev, t]);
      setCustomTest('');
    }
  };

  const handleCreateReferral = async () => {
    if (!patient) {
      Alert.alert('Required', 'Please search and select a patient.');
      return;
    }
    if (!selectedCenter) {
      Alert.alert('Required', 'Please select a diagnostic center.');
      return;
    }
    if (selectedTests.length === 0) {
      Alert.alert('Required', 'Please select at least one test to requisition.');
      return;
    }

    try {
      await createReferralMutation.mutateAsync({
        patientId: patient.id,
        diagnosticCenterId: selectedCenter.id,
        testNames: selectedTests,
        notes: notes.trim() || undefined,
      });

      setShowModal(false);
      setPhoneSearch('');
      setPatient(null);
      setSelectedCenter(null);
      setSelectedTests([]);
      setNotes('');
      Alert.alert('Requisition Sent', 'Diagnostic test requisition generated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create referral.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={18} color={Colors.light.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Diagnostic Referrals</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.topContainer}>
        {/* 2. Banner */}
        <GradientCard variant="purple" style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerTitles}>
                <Text style={styles.bannerHeading}>Lab Requisitions</Text>
                <Text style={styles.bannerSub}>
                  {referrals.length} Issued diagnostic requisitions & orders
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowModal(true)}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addBtnText}>New Referral</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GradientCard>
      </View>

      {/* 3. List Content */}
      {loadingReferrals ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading lab requisitions...</Text>
        </View>
      ) : referrals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="activity" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Requisitions Issued</Text>
          <Text style={styles.emptySubtitle}>
            When diagnostic lab tests are ordered for patients, referrals will appear here.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.emptyActionBtnText}>Create First Requisition</Text>
          </TouchableOpacity>
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
            const patientName =
              item.patient?.name || item.patient?.user?.name || 'Patient';
            const patientPhone =
              item.patient?.phone || item.patient?.user?.phone || 'N/A';
            const centerName =
              item.diagnosticCenter?.centerName || 'Diagnostic Lab Center';
            const testsList = item.testNames || [];

            return (
              <GradientCard variant="purple" style={styles.refCard}>
                <View style={styles.refCardContent}>
                  <View style={styles.refHeaderRow}>
                    <View style={styles.patientCol}>
                      <Text style={styles.patientName}>{patientName}</Text>
                      <Text style={styles.patientPhone}>{patientPhone}</Text>
                    </View>

                    <View style={styles.centerPill}>
                      <Icon name="building" size={10} color={Colors.light.primary} />
                      <Text style={styles.centerPillText} numberOfLines={1}>
                        {centerName}
                      </Text>
                    </View>
                  </View>

                  {/* Tests tags */}
                  <View style={styles.testsGrid}>
                    {testsList.map((t, idx) => (
                      <View key={`test-${idx}`} style={styles.testTag}>
                        <Icon name="activity" size={10} color="#7C3AED" />
                        <Text style={styles.testTagText}>{t}</Text>
                      </View>
                    ))}
                  </View>

                  {item.notes ? (
                    <Text style={styles.notesText}>Notes: {item.notes}</Text>
                  ) : null}

                  <Text style={styles.dateText}>
                    Ordered on {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </GradientCard>
            );
          }}
        />
      )}

      {/* New Referral Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Diagnostic Requisition</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* 1. Patient lookup */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>1. Patient Phone Number *</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={phoneSearch}
                      onChangeText={setPhoneSearch}
                      placeholder="e.g. 9876543210"
                      keyboardType="phone-pad"
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity
                      style={styles.inlineSearchBtn}
                      onPress={handlePatientSearch}
                      disabled={searchPatientMutation.isPending}
                    >
                      {searchPatientMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.inlineSearchText}>Find</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {patient && (
                    <View style={styles.patientResultBox}>
                      <Icon name="check-circle" size={16} color="#047857" />
                      <Text style={styles.patientResultName}>
                        {patient.name} ({patient.gender || 'Patient'}, {patient.age || '--'} yrs)
                      </Text>
                    </View>
                  )}
                  {patientNotFound && (
                    <Text style={styles.notFoundText}>No registered patient found with this phone.</Text>
                  )}
                </View>

                {/* 2. Diagnostic Center Search */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>2. Diagnostic Lab Center *</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={centerSearchQuery}
                      onChangeText={setCenterSearchQuery}
                      placeholder="Search lab name or city..."
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity
                      style={styles.inlineSearchBtn}
                      onPress={handleCenterSearch}
                      disabled={searchCentersMutation.isPending}
                    >
                      {searchCentersMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.inlineSearchText}>Search</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Centers results */}
                  {(searchCentersMutation.data || []).length > 0 && (
                    <View style={styles.centersResultList}>
                      {(searchCentersMutation.data || []).slice(0, 4).map((c) => {
                        const isSel = selectedCenter?.id === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.centerOption, isSel && styles.centerOptionActive]}
                            onPress={() => setSelectedCenter(c)}
                          >
                            <Text style={[styles.centerOptionText, isSel && styles.centerOptionTextActive]}>
                              {c.centerName} {c.city ? `(${c.city})` : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  {selectedCenter && (
                    <View style={styles.selectedCenterBox}>
                      <Icon name="check-circle" size={14} color="#047857" />
                      <Text style={styles.selectedCenterText}>
                        Selected: {selectedCenter.centerName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 3. Common Tests Select */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>3. Tests & Pathology *</Text>
                  <View style={styles.testsChipContainer}>
                    {COMMON_TESTS.map((t) => {
                      const isSel = selectedTests.includes(t);
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[styles.testChip, isSel && styles.testChipActive]}
                          onPress={() => toggleTest(t)}
                        >
                          <Text style={[styles.testChipText, isSel && styles.testChipTextActive]}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Test input */}
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={customTest}
                      onChangeText={setCustomTest}
                      placeholder="Add custom diagnostic test..."
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity style={styles.inlineSearchBtn} onPress={handleAddCustomTest}>
                      <Text style={styles.inlineSearchText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Clinical Notes & Instructions</Text>
                  <TextInput
                    style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Fast 12 hours before test, carry previous records..."
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreateReferral}
                  disabled={createReferralMutation.isPending}
                  activeOpacity={0.85}
                >
                  {createReferralMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Issue Lab Requisition</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitles: {
    flex: 1,
    gap: 2,
  },
  bannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  refCard: {
    marginBottom: 0,
  },
  refCardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  refHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientCol: {
    gap: 2,
    flex: 1,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  patientPhone: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  centerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    maxWidth: 140,
  },
  centerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  testTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  testTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  notesText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 10,
    color: Colors.light.ink400,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconCircle: {
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
  emptyActionBtn: {
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
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    maxHeight: '92%',
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
  closeBtn: {
    padding: 4,
  },
  scrollForm: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
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
  searchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  inlineSearchBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  inlineSearchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  patientResultName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  notFoundText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  centersResultList: {
    gap: 4,
    marginTop: 4,
  },
  centerOption: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  centerOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  centerOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  centerOptionTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  selectedCenterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  selectedCenterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  testsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  testChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  testChipActive: {
    backgroundColor: '#7C3AED',
  },
  testChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  testChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
