import React, { useState, useMemo } from 'react';
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
  useMyAssignedDoctors,
  useSearchPatientByPhone,
  useCreateGuestPatient,
  useBookReceptionAppointment,
  useSearchDiagnosticCenters,
  useCreateReferral,
} from '../../hooks/useReceptionist';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import type { Gender, PatientSearchResult, DiagnosticCenterLookup } from '../../types';

export default function ReceptionistPatientsScreen() {
  const { data: doctors = [] } = useMyAssignedDoctors();

  const searchPatient = useSearchPatientByPhone();
  const createGuest = useCreateGuestPatient();
  const bookAppointment = useBookReceptionAppointment();
  const searchCenters = useSearchDiagnosticCenters();
  const createReferral = useCreateReferral();

  // Search state
  const [phone, setPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundPatient, setFoundPatient] = useState<PatientSearchResult | null>(null);

  // Guest registration inputs
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState<Gender>('MALE');

  // Booking inputs
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Diagnostic Referral inputs
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [centerQuery, setCenterQuery] = useState('');
  const [centerResults, setCenterResults] = useState<DiagnosticCenterLookup[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenterLookup | null>(null);
  const [testNamesInput, setTestNamesInput] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  // Status message states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const handleSearch = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setHasSearched(false);

    const cleanPhone = phone.replace(/\D/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    try {
      const patient = await searchPatient.mutateAsync(cleanPhone);
      setFoundPatient(patient);
      setHasSearched(true);
      if (!patient) {
        setGuestName('');
        setGuestAge('');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to search for patient.');
    }
  };

  const handleCreateGuest = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter the patient full name.');
      return;
    }
    if (!guestAge.trim() || Number(guestAge) <= 0) {
      setErrorMsg('Please enter a valid age.');
      return;
    }

    try {
      const patient = await createGuest.mutateAsync({
        name: guestName.trim(),
        age: Number(guestAge),
        phone: phone.trim() || undefined,
        gender: guestGender,
      });
      setFoundPatient(patient);
      setSuccessMsg('Walk-in guest patient registered successfully.');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to register guest patient.');
    }
  };

  const handleBook = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!foundPatient) {
      setErrorMsg('Please select or register a patient first.');
      return;
    }
    if (!selectedDoctor) {
      setErrorMsg('Please select a consulting doctor.');
      return;
    }
    const clinicId = selectedDoctor.clinic?.id || selectedDoctor.clinicId;
    if (!clinicId) {
      setErrorMsg('Selected doctor has no clinic assigned.');
      return;
    }

    try {
      const res = await bookAppointment.mutateAsync({
        doctorId: selectedDoctor.id,
        clinicId,
        date: bookingDate,
        bookingSource: 'RECEPTION',
        patientId: foundPatient.id,
      });

      const tokenNum = res?.token || 'Confirmed';
      setSuccessMsg(`Appointment booked! Token #${tokenNum} issued with Dr. ${selectedDoctor.user?.name}.`);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to book appointment.');
    }
  };

  const handleSearchCenter = async () => {
    setErrorMsg(null);
    if (!centerQuery.trim()) return;

    try {
      const list = await searchCenters.mutateAsync(centerQuery.trim());
      setCenterResults(list);
      if (list.length === 0) {
        setErrorMsg('No diagnostic centers matched your search query.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to search centers.');
    }
  };

  const handleCreateReferral = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!foundPatient || !selectedCenter) {
      setErrorMsg('Please select both a patient and a diagnostic center.');
      return;
    }

    const testNames = testNamesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (testNames.length === 0) {
      setErrorMsg('Please enter at least one test name (e.g. CBC, Lipid Profile).');
      return;
    }

    try {
      await createReferral.mutateAsync({
        patientId: foundPatient.id,
        diagnosticCenterId: selectedCenter.id,
        testNames,
        notes: referralNotes.trim() || undefined,
      });

      setSuccessMsg(`Referral sent to ${selectedCenter.centerName}.`);
      setShowReferralPanel(false);
      setSelectedCenter(null);
      setTestNamesInput('');
      setReferralNotes('');
      setCenterQuery('');
      setCenterResults([]);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send referral.');
    }
  };

  const resetFlow = () => {
    setPhone('');
    setHasSearched(false);
    setFoundPatient(null);
    setGuestName('');
    setGuestAge('');
    setSelectedDoctorId('');
    setShowReferralPanel(false);
    setSelectedCenter(null);
    setCenterQuery('');
    setCenterResults([]);
    setTestNamesInput('');
    setReferralNotes('');
    setErrorMsg(null);
    setSuccessMsg(null);
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
          <Text style={styles.headerTitle}>Patients Desk</Text>
          <Text style={styles.headerSubtitle}>
            Search a patient by phone, register a walk-in guest, book an appointment, or refer to a diagnostic center.
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
            <TouchableOpacity onPress={resetFlow} style={styles.startOverBtn}>
              <Text style={styles.startOverBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Search Patient by Phone */}
        <View style={styles.sectionCard}>
          <Text style={styles.stepTitle}>1. Search Patient by Phone</Text>
          <View style={styles.searchRow}>
            <View style={styles.phoneInputWrap}>
              <Icon name="phone" size={15} color={Colors.light.ink400} />
              <TextInput
                style={styles.phoneInput}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  setHasSearched(false);
                  setFoundPatient(null);
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              disabled={searchPatient.isPending}
            >
              {searchPatient.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="search" size={13} color="#FFFFFF" />
                  <Text style={styles.searchBtnText}>Search</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: Patient Result or Walk-in Guest Form */}
        {hasSearched && (
          <View style={styles.sectionCard}>
            {foundPatient ? (
              <View style={styles.foundPatientCard}>
                <View style={styles.patientAvatarBox}>
                  <Icon name="user" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.patientMeta}>
                  <Text style={styles.patientName}>{foundPatient.name || 'Patient'}</Text>
                  <Text style={styles.patientPhone}>
                    {foundPatient.phone || phone}
                    {foundPatient.email ? ` • ${foundPatient.email}` : ''}
                  </Text>
                  <Text style={styles.patientDemographics}>
                    {[
                      foundPatient.age ? `${foundPatient.age} yrs` : null,
                      foundPatient.gender || null,
                      foundPatient.isGuest ? 'Walk-in Guest' : 'Registered Member',
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Icon name="check" size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Found</Text>
                </View>
              </View>
            ) : (
              <View style={styles.guestFormWrap}>
                <View style={styles.notFoundHeader}>
                  <Icon name="info" size={15} color="#D97706" />
                  <Text style={styles.notFoundTitle}>
                    No patient found with this number. Register as walk-in:
                  </Text>
                </View>

                <View style={styles.guestForm}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Full Name *"
                    value={guestName}
                    onChangeText={setGuestName}
                  />

                  <View style={styles.formTwoCols}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      placeholder="Age *"
                      keyboardType="numeric"
                      value={guestAge}
                      onChangeText={setGuestAge}
                    />

                    {/* Gender Selector */}
                    <View style={styles.genderRow}>
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderPill,
                            guestGender === g && styles.genderPillActive,
                          ]}
                          onPress={() => setGuestGender(g)}
                        >
                          <Text
                            style={[
                              styles.genderPillText,
                              guestGender === g && styles.genderPillTextActive,
                            ]}
                          >
                            {g === 'MALE' ? 'M' : g === 'FEMALE' ? 'F' : 'O'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.registerGuestBtn}
                    onPress={handleCreateGuest}
                    disabled={createGuest.isPending}
                  >
                    {createGuest.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="user-plus" size={14} color="#FFFFFF" />
                        <Text style={styles.registerGuestBtnText}>Register Walk-in Guest</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Actions for the selected patient */}
        {foundPatient && (
          <>
            {/* Action A: Book Appointment */}
            <View style={styles.sectionCard}>
              <View style={styles.actionHeader}>
                <Icon name="calendar" size={16} color={Colors.light.primary} />
                <Text style={styles.actionTitle}>Book Appointment at Desk</Text>
              </View>

              <Text style={styles.fieldLabel}>Select Consulting Doctor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docSelectScroll}>
                {doctors.map((d) => {
                  const isSel = selectedDoctorId === d.id;
                  const name = d.user?.name || 'Doctor';
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.docSelectChip, isSel && styles.docSelectChipActive]}
                      onPress={() => setSelectedDoctorId(d.id)}
                    >
                      <Icon
                        name="stethoscope"
                        size={12}
                        color={isSel ? '#FFFFFF' : Colors.light.primary}
                      />
                      <Text
                        style={[styles.docSelectChipText, isSel && styles.docSelectChipTextActive]}
                      >
                        Dr. {name.replace(/^dr\.?\s*/i, '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Date of Consultation</Text>
              <TextInput
                style={styles.formInput}
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="YYYY-MM-DD"
              />

              <TouchableOpacity
                style={[
                  styles.bookSubmitBtn,
                  (!selectedDoctorId || bookAppointment.isPending) && styles.btnDisabled,
                ]}
                onPress={handleBook}
                disabled={!selectedDoctorId || bookAppointment.isPending}
              >
                {bookAppointment.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="calendar-clock" size={15} color="#FFFFFF" />
                    <Text style={styles.bookSubmitBtnText}>Issue Token & Book</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Action B: Refer to Diagnostic Center */}
            <View style={styles.sectionCard}>
              <View style={styles.actionHeaderBetween}>
                <View style={styles.actionHeader}>
                  <Icon name="flask" size={16} color="#0E7490" />
                  <Text style={styles.actionTitle}>Refer to Diagnostic Center</Text>
                </View>

                {!showReferralPanel && (
                  <TouchableOpacity
                    style={styles.openReferralBtn}
                    onPress={() => setShowReferralPanel(true)}
                  >
                    <Text style={styles.openReferralBtnText}>+ New Referral</Text>
                  </TouchableOpacity>
                )}
              </View>

              {showReferralPanel && (
                <View style={styles.referralFormWrap}>
                  {/* Center Search */}
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.phoneInput, { flex: 1 }]}
                      placeholder="Search diagnostic center name..."
                      value={centerQuery}
                      onChangeText={setCenterQuery}
                    />
                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={handleSearchCenter}
                      disabled={searchCenters.isPending}
                    >
                      <Text style={styles.searchBtnText}>Search</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Centers Results List */}
                  {centerResults.length > 0 && !selectedCenter && (
                    <View style={styles.centersList}>
                      {centerResults.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.centerItem}
                          onPress={() => setSelectedCenter(c)}
                        >
                          <Icon name="building" size={14} color={Colors.light.primary} />
                          <View style={styles.flex1}>
                            <Text style={styles.centerItemName}>{c.centerName}</Text>
                            {c.city && <Text style={styles.centerItemSub}>{c.city}</Text>}
                          </View>
                          <Icon name="chevron-right" size={13} color={Colors.light.ink400} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Selected Center Pill */}
                  {selectedCenter && (
                    <View style={styles.selectedCenterPill}>
                      <View style={styles.flex1}>
                        <Text style={styles.selectedCenterName}>{selectedCenter.centerName}</Text>
                        {selectedCenter.city && (
                          <Text style={styles.selectedCenterCity}>{selectedCenter.city}</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => setSelectedCenter(null)}>
                        <Text style={styles.changeCenterText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Test Names & Notes */}
                  <TextInput
                    style={styles.formInput}
                    placeholder="Test names (e.g. CBC, Lipid Profile, X-Ray)"
                    value={testNamesInput}
                    onChangeText={setTestNamesInput}
                  />

                  <TextInput
                    style={[styles.formInput, { height: 60 }]}
                    placeholder="Notes (optional)"
                    multiline
                    value={referralNotes}
                    onChangeText={setReferralNotes}
                  />

                  <TouchableOpacity
                    style={[
                      styles.sendReferralBtn,
                      (!selectedCenter || createReferral.isPending) && styles.btnDisabled,
                    ]}
                    onPress={handleCreateReferral}
                    disabled={!selectedCenter || createReferral.isPending}
                  >
                    {createReferral.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="flask" size={14} color="#FFFFFF" />
                        <Text style={styles.sendReferralBtnText}>Send Referral to Lab</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
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
  startOverBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#059669',
  },
  startOverBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  phoneInputWrap: {
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
  phoneInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  searchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  foundPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  patientPhone: {
    fontSize: 11,
    color: Colors.light.ink600,
    marginTop: 1,
  },
  patientDemographics: {
    fontSize: 11,
    color: Colors.light.ink400,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  notFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notFoundTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
    flex: 1,
  },
  guestFormWrap: {
    gap: 8,
  },
  guestForm: {
    gap: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  formTwoCols: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderPill: {
    width: 34,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.light.primary,
  },
  genderPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  genderPillTextActive: {
    color: '#FFFFFF',
  },
  registerGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 11,
    marginTop: 2,
  },
  registerGuestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
    marginTop: 4,
  },
  docSelectScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  docSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  docSelectChipActive: {
    backgroundColor: Colors.light.primary,
  },
  docSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  docSelectChipTextActive: {
    color: '#FFFFFF',
  },
  bookSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 4,
  },
  bookSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  openReferralBtn: {
    backgroundColor: '#ECFEFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  openReferralBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E7490',
  },
  referralFormWrap: {
    gap: 8,
    marginTop: 6,
  },
  centersList: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 4,
    gap: 4,
  },
  centerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
  },
  centerItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  centerItemSub: {
    fontSize: 10,
    color: Colors.light.ink400,
  },
  selectedCenterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    borderRadius: Radius.md,
    padding: 10,
  },
  selectedCenterName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E7490',
  },
  selectedCenterCity: {
    fontSize: 10,
    color: '#155E75',
  },
  changeCenterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E7490',
    textDecorationLine: 'underline',
  },
  sendReferralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0E7490',
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  sendReferralBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
