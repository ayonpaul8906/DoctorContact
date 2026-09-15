import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSearchPatientByPhone,
  useSearchDiagnosticCenters,
  useCreateReferral,
  useSentReferrals,
} from '../../hooks/useReceptionist';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import type { PatientSearchResult, DiagnosticCenterLookup, SentReferral } from '../../types';

const COMMON_TEST_SUGGESTIONS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Fasting Blood Sugar (FBS)',
  'HbA1c',
  'Thyroid Profile (T3, T4, TSH)',
  'Chest X-Ray',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'ECG',
  'Urine Routine & Microscopic',
];

export default function ReceptionistTestRecommendationsScreen() {
  const searchPatient = useSearchPatientByPhone();
  const searchCenters = useSearchDiagnosticCenters();
  const createReferral = useCreateReferral();
  const { data: sentReferrals = [], isLoading: sentLoading, refetch: refetchSent } = useSentReferrals();

  // Patient search state
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);

  // Diagnostic Center state
  const [centerQuery, setCenterQuery] = useState('');
  const [centers, setCenters] = useState<DiagnosticCenterLookup[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenterLookup | null>(null);

  // Tests & Notes
  const [testInput, setTestInput] = useState('');
  const [tests, setTests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePatientLookup = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const cleanPhone = phone.replace(/\D/g, '').trim();
    if (cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    try {
      const p = await searchPatient.mutateAsync(cleanPhone);
      if (p) {
        setPatient(p);
        setSuccessMsg(`Patient verified: ${p.name || 'Patient'}`);
      } else {
        setPatient(null);
        setErrorMsg('No patient found. Register them in the Patients tab first.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Patient lookup failed.');
    }
  };

  const handleCenterSearch = async () => {
    setErrorMsg(null);
    if (!centerQuery.trim()) return;

    try {
      const list = await searchCenters.mutateAsync(centerQuery.trim());
      setCenters(list);
      if (list.length === 0) {
        setErrorMsg('No diagnostic centers matched your search.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Center search failed.');
    }
  };

  const addTest = (testName?: string) => {
    const t = (testName || testInput).trim();
    if (!t) return;
    if (!tests.includes(t)) {
      setTests([...tests, t]);
    }
    setTestInput('');
  };

  const removeTest = (indexToRemove: number) => {
    setTests(tests.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!patient) {
      setErrorMsg('Please look up and select a patient first.');
      return;
    }
    if (!selectedCenter) {
      setErrorMsg('Please select a diagnostic center.');
      return;
    }
    if (tests.length === 0) {
      setErrorMsg('Please add at least one test to recommend.');
      return;
    }

    try {
      await createReferral.mutateAsync({
        patientId: patient.id,
        diagnosticCenterId: selectedCenter.id,
        testNames: tests,
        notes: notes.trim() || undefined,
      });

      setSuccessMsg(`Test recommendation sent to ${selectedCenter.centerName}.`);
      setPhone('');
      setPatient(null);
      setSelectedCenter(null);
      setCenters([]);
      setCenterQuery('');
      setTests([]);
      setNotes('');
      refetchSent();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not send test recommendation.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching Webapp */}
        <View style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <Icon name="flask" size={20} color={Colors.light.primary} />
            <Text style={styles.headerTitle}>Test Recommendations</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Recommend diagnostic tests for a patient and send them directly to a partner diagnostic lab.
          </Text>
        </View>

        {/* Error Alert */}
        {errorMsg && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorCardText}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg(null)}>
              <Icon name="x" size={14} color="#991B1B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Success Alert */}
        {successMsg && (
          <View style={styles.successCard}>
            <Icon name="check-circle" size={16} color="#059669" />
            <Text style={styles.successCardText}>{successMsg}</Text>
            <TouchableOpacity onPress={() => setSuccessMsg(null)}>
              <Icon name="x" size={14} color="#065F46" />
            </TouchableOpacity>
          </View>
        )}

        {/* New Recommendation Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>Create Recommendation</Text>

          {/* 1. Patient Lookup */}
          <Text style={styles.fieldLabel}>Patient Phone Number</Text>
          <View style={styles.searchRow}>
            <View style={styles.inputWrap}>
              <Icon name="phone" size={14} color={Colors.light.ink400} />
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  setPatient(null);
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handlePatientLookup}
              disabled={searchPatient.isPending}
            >
              {searchPatient.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="search" size={13} color="#FFFFFF" />
                  <Text style={styles.searchBtnText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {patient && (
            <View style={styles.patientPill}>
              <Icon name="check-circle" size={14} color="#059669" />
              <Text style={styles.patientPillText}>
                {patient.name || 'Patient'} ({patient.phone || phone})
              </Text>
            </View>
          )}

          {/* 2. Diagnostic Center Search */}
          <Text style={styles.fieldLabel}>Diagnostic Center</Text>
          {selectedCenter ? (
            <View style={styles.selectedCenterCard}>
              <View style={styles.centerIconWrap}>
                <Icon name="building" size={16} color="#0E7490" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.selectedCenterTitle}>{selectedCenter.centerName}</Text>
                {selectedCenter.city && (
                  <Text style={styles.selectedCenterSubtitle}>{selectedCenter.city}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedCenter(null)} style={styles.removeCenterBtn}>
                <Icon name="x" size={14} color={Colors.light.ink500} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <View style={styles.inputWrap}>
                  <Icon name="building" size={14} color={Colors.light.ink400} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Search diagnostic center by name..."
                    value={centerQuery}
                    onChangeText={setCenterQuery}
                  />
                </View>
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleCenterSearch}
                  disabled={searchCenters.isPending}
                >
                  {searchCenters.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchBtnText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>

              {centers.length > 0 && (
                <View style={styles.centersDropdown}>
                  {centers.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.centerDropdownItem}
                      onPress={() => {
                        setSelectedCenter(c);
                        setCenters([]);
                      }}
                    >
                      <View style={styles.flex1}>
                        <Text style={styles.centerItemName}>{c.centerName}</Text>
                        {c.city && <Text style={styles.centerItemCity}>{c.city}</Text>}
                      </View>
                      <Icon name="plus" size={14} color={Colors.light.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* 3. Tests Input & Suggestion Chips */}
          <Text style={styles.fieldLabel}>Recommended Tests</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.inputWrap, styles.testTextInput]}
              placeholder="Type test name (e.g. CBC, Lipid Profile)..."
              value={testInput}
              onChangeText={setTestInput}
              onSubmitEditing={() => addTest()}
            />
            <TouchableOpacity style={styles.addTestBtn} onPress={() => addTest()}>
              <Icon name="plus" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Selected Test Chips */}
          {tests.length > 0 && (
            <View style={styles.testsChipContainer}>
              {tests.map((t, idx) => (
                <View key={idx} style={styles.testBadge}>
                  <Text style={styles.testBadgeText}>{t}</Text>
                  <TouchableOpacity onPress={() => removeTest(idx)}>
                    <Icon name="x" size={12} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Quick Suggestions */}
          <Text style={styles.suggestionsTitle}>Common Suggestions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
            {COMMON_TEST_SUGGESTIONS.map((suggestion) => {
              const alreadyAdded = tests.includes(suggestion);
              return (
                <TouchableOpacity
                  key={suggestion}
                  style={[styles.suggestionChip, alreadyAdded && styles.suggestionChipAdded]}
                  onPress={() => !alreadyAdded && addTest(suggestion)}
                  disabled={alreadyAdded}
                >
                  <Text
                    style={[
                      styles.suggestionChipText,
                      alreadyAdded && styles.suggestionChipTextAdded,
                    ]}
                  >
                    {alreadyAdded ? '✓ ' : '+ '}
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4. Notes Input */}
          <Text style={styles.fieldLabel}>Clinical Notes (Optional)</Text>
          <TextInput
            style={[styles.inputWrap, styles.notesInput]}
            placeholder="Special instructions or symptoms for lab technician..."
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          {/* Submit Recommendation Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!patient || !selectedCenter || tests.length === 0 || createReferral.isPending) &&
                styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!patient || !selectedCenter || tests.length === 0 || createReferral.isPending}
            activeOpacity={0.85}
          >
            {createReferral.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="flask" size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Send Recommendation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Recommendations Stream matching Webapp */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Recommendations</Text>
            <TouchableOpacity onPress={() => refetchSent()}>
              <Icon name="refresh-cw" size={13} color={Colors.light.ink500} />
            </TouchableOpacity>
          </View>

          {sentLoading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 16 }} />
          ) : sentReferrals.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Icon name="flask" size={24} color={Colors.light.ink400} />
              <Text style={styles.emptyRecentText}>No recommendations sent yet.</Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {sentReferrals.map((r: SentReferral) => {
                const patientName = r.patient?.user?.name || r.patient?.name || 'Patient';
                const centerName = r.diagnosticCenter?.centerName || 'Diagnostic Center';

                return (
                  <View key={r.id} style={styles.recentCard}>
                    <View style={styles.recentCardTop}>
                      <Text style={styles.recentPatientName}>{patientName}</Text>
                      <Text style={styles.recentDate}>
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>

                    <Text style={styles.recentTestsList} numberOfLines={2}>
                      Tests: {r.testNames.join(', ')}
                    </Text>

                    <View style={styles.recentCenterRow}>
                      <Icon name="building" size={11} color="#0E7490" />
                      <Text style={styles.recentCenterText}>{centerName}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.three,
  },
  headerCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 3,
    ...Shadows.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    lineHeight: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  errorCardText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  successCardText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    marginTop: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  searchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  patientPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  selectedCenterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  centerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#CFFAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  selectedCenterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E7490',
  },
  selectedCenterSubtitle: {
    fontSize: 11,
    color: '#155E75',
  },
  removeCenterBtn: {
    padding: 6,
  },
  centersDropdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 4,
    gap: 4,
  },
  centerDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
  },
  centerItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  centerItemCity: {
    fontSize: 10,
    color: Colors.light.ink400,
  },
  testTextInput: {
    height: 42,
  },
  addTestBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    marginTop: 4,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    marginRight: 6,
  },
  suggestionChipAdded: {
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  suggestionChipTextAdded: {
    color: Colors.light.ink400,
  },
  notesInput: {
    height: 60,
    alignItems: 'flex-start',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    paddingVertical: 13,
    marginTop: 8,
    ...Shadows.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recentSection: {
    gap: Spacing.two,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  emptyRecentCard: {
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 4,
  },
  emptyRecentText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  recentList: {
    gap: Spacing.two,
  },
  recentCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 4,
    ...Shadows.sm,
  },
  recentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentPatientName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  recentDate: {
    fontSize: 11,
    color: Colors.light.ink400,
  },
  recentTestsList: {
    fontSize: 12,
    color: Colors.light.ink700,
    fontWeight: '600',
  },
  recentCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  recentCenterText: {
    fontSize: 11,
    color: '#0E7490',
    fontWeight: '600',
  },
});
