import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  ClinicReportsView,
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

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ClinicServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; action?: string }>();
  const [activeTab, setActiveTab] = useState<'referrals' | 'reports'>('referrals');

  useEffect(() => {
    if (params.tab === 'reports') {
      setActiveTab('reports');
    } else if (params.tab === 'referrals') {
      setActiveTab('referrals');
      if (params.action === 'create') {
        setShowReferralModal(true);
      }
    }
  }, [params.tab, params.action]);

  // 1. Referrals Queries & State
  const {
    data: referrals = [],
    isLoading: loadingReferrals,
    refetch: refetchReferrals,
    isRefetching: refetchingReferrals,
  } = useSentReferrals();

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [patient, setPatient] = useState<PatientLookup | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);

  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenterLookup | null>(null);

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  const searchPatientMutation = useSearchPatientByPhone();
  const searchCentersMutation = useSearchDiagnosticCenters();
  const createReferralMutation = useCreateReferral();

  const handleRefreshAll = () => {
    refetchReferrals();
  };

  // Referral Handlers
  const handlePatientSearch = async () => {
    const cleaned = phoneSearch.trim().replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Search', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setPatientNotFound(false);
    setPatient(null);
    try {
      const res = await searchPatientMutation.mutateAsync(cleaned);
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
      Alert.alert('Required', 'Please lookup and select a patient.');
      return;
    }
    if (!selectedCenter) {
      Alert.alert('Required', 'Please select a diagnostic lab center.');
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
        notes: referralNotes.trim() || undefined,
      });
      setShowReferralModal(false);
      setPhoneSearch('');
      setPatient(null);
      setSelectedCenter(null);
      setSelectedTests([]);
      setReferralNotes('');
      Alert.alert('Success', 'Diagnostic test requisition generated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create referral.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Segmented Control */}
      <View style={styles.topContainer}>
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'referrals' && styles.tabBtnActive]}
            onPress={() => setActiveTab('referrals')}
            activeOpacity={0.8}
          >
            <Icon
              name="activity"
              size={15}
              color={activeTab === 'referrals' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'referrals' && styles.tabBtnTextActive,
              ]}
            >
              Diagnostic Referrals ({referrals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
            onPress={() => setActiveTab('reports')}
            activeOpacity={0.8}
          >
            <Icon
              name="trending-up"
              size={15}
              color={activeTab === 'reports' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'reports' && styles.tabBtnTextActive,
              ]}
            >
              Reports & Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refetchingReferrals}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* ========================================================
            SUB-TAB: REFERRALS (LAB REQUISITIONS)
        ======================================================== */}
        {activeTab === 'referrals' && (
          <View style={styles.tabSection}>
            <GradientCard variant="purple" style={styles.bannerCard}>
              <View style={styles.bannerContent}>
                <View style={styles.headerRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.bannerHeading}>Lab Requisitions</Text>
                    <Text style={styles.bannerSub}>
                      {referrals.length} Issued diagnostic requisitions & orders
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.newReferralBtn}
                    onPress={() => setShowReferralModal(true)}
                    activeOpacity={0.85}
                  >
                    <Icon name="plus" size={14} color="#FFFFFF" />
                    <Text style={styles.newReferralBtnText}>New Referral</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GradientCard>

            {loadingReferrals ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.centerStateText}>Loading requisitions...</Text>
              </View>
            ) : referrals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="activity" size={32} color={Colors.light.ink400} />
                <Text style={styles.emptyTitle}>No Requisitions Issued</Text>
                <Text style={styles.emptySubtitle}>
                  Diagnostic orders issued to partner labs will appear here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setShowReferralModal(true)}
                >
                  <Icon name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>Create Requisition</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.referralList}>
                {referrals.map((item) => {
                  const patName = item.patient?.name || item.patient?.user?.name || 'Patient';
                  const patPhone = item.patient?.phone || item.patient?.user?.phone || 'N/A';
                  const centerName = item.diagnosticCenter?.centerName || 'Diagnostic Lab';

                  return (
                    <GradientCard key={item.id} variant="purple" style={styles.refCard}>
                      <View style={styles.refCardContent}>
                        <View style={styles.headerRow}>
                          <View style={styles.flex1}>
                            <Text style={styles.patientName}>{patName}</Text>
                            <Text style={styles.patientPhone}>{patPhone}</Text>
                          </View>
                          <View style={styles.centerPill}>
                            <Icon name="building" size={10} color={Colors.light.primary} />
                            <Text style={styles.centerPillText} numberOfLines={1}>
                              {centerName}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.testsGrid}>
                          {(item.testNames || []).map((t, idx) => (
                            <View key={`t-${idx}`} style={styles.testTag}>
                              <Icon name="activity" size={10} color="#7C3AED" />
                              <Text style={styles.testTagText}>{t}</Text>
                            </View>
                          ))}
                        </View>

                        {item.notes && <Text style={styles.notesText}>Notes: {item.notes}</Text>}
                        <Text style={styles.dateText}>
                          Ordered on {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </GradientCard>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================
            SUB-TAB: REPORTS & ANALYTICS (Matches webapp reports)
        ======================================================== */}
        {activeTab === 'reports' && (
          <View style={styles.tabSection}>
            <ClinicReportsView />
          </View>
        )}
      </ScrollView>

      {/* New Referral Modal */}
      <Modal
        visible={showReferralModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', flex: 1, justifyContent: 'center' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Issue Diagnostic Requisition</Text>
                <TouchableOpacity onPress={() => setShowReferralModal(false)} style={styles.closeBtn}>
                  <Icon name="x" size={18} color={Colors.light.ink600} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollForm}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 50 }}
              >
              <View style={styles.formContainer}>
                {/* 1. Patient lookup */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>1. Patient Mobile Number *</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={phoneSearch}
                      onChangeText={(t) => setPhoneSearch(t.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      placeholder="10-digit mobile number"
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

                {/* 3. Tests Select */}
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
                      {selectedTests
                        .filter((t) => !COMMON_TESTS.includes(t))
                        .map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.testChip,
                              styles.testChipActive,
                              {
                                backgroundColor: '#4F46E5',
                                borderColor: '#4338CA',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              },
                            ]}
                            onPress={() => toggleTest(t)}
                          >
                            <Text style={[styles.testChipText, styles.testChipTextActive]}>
                              {t}
                            </Text>
                            <Icon name="x" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        ))}
                    </View>

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
                    value={referralNotes}
                    onChangeText={setReferralNotes}
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
          </KeyboardAvoidingView>
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
    backgroundColor: Colors.light.surfaceWhite,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  tabSection: {
    gap: Spacing.three,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
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
  newReferralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  newReferralBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  referralList: {
    gap: Spacing.two,
  },
  refCard: {
    marginBottom: 0,
  },
  refCardContent: {
    padding: Spacing.three,
    gap: Spacing.two,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
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
  periodPillsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  periodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  periodPillActive: {
    backgroundColor: Colors.light.primary,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  periodPillTextActive: {
    color: '#FFFFFF',
  },
  docFilterStrip: {
    flexDirection: 'row',
  },
  docFilterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    marginRight: 6,
  },
  docFilterPillActive: {
    backgroundColor: Colors.light.primary,
  },
  docFilterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  docFilterPillTextActive: {
    color: '#FFFFFF',
  },
  revenueVal: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  statusVal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  docRevenueList: {
    gap: Spacing.two,
  },
  docRevCard: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    gap: 4,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  docSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  docRevVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.surface200,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: Radius.full,
  },
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 9,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    marginTop: 6,
  },
  emptyActionBtnText: {
    fontSize: 12,
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
