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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDoctorPrescriptions,
  useCreateDoctorPrescription,
  useSearchClinics,
  useDoctorPatients,
} from '../../hooks/useDoctor';
import type { DoctorPrescription, PrescriptionItem } from '../../types';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DoctorPrescriptionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('ALL');

  // Modals
  const [detailsPrescription, setDetailsPrescription] = useState<DoctorPrescription | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Prescription Form state
  const [formPatientId, setFormPatientId] = useState('');
  const [formClinicId, setFormClinicId] = useState('');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
  ]);

  // Queries
  const { data: clinics = [] } = useSearchClinics();
  const { data: patientsData } = useDoctorPatients({ limit: 50 });
  const patientsList = patientsData?.patients ?? [];

  const {
    data: prescriptions = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorPrescriptions({
    clinicId: selectedClinicId !== 'ALL' ? selectedClinicId : undefined,
  });

  const createPrescriptionMutation = useCreateDoctorPrescription();

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      if (selectedClinicId !== 'ALL' && rx.clinicId && rx.clinicId !== selectedClinicId) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPatient = rx.patientName?.toLowerCase().includes(q);
        const matchesDiagnosis = rx.diagnosis?.toLowerCase().includes(q);
        const matchesClinic = rx.clinicName?.toLowerCase().includes(q);
        const matchesMedicines = (rx.items || []).some((item) =>
          item.medicineName?.toLowerCase().includes(q)
        );
        if (!matchesPatient && !matchesDiagnosis && !matchesClinic && !matchesMedicines) {
          return false;
        }
      }
      return true;
    });
  }, [prescriptions, selectedClinicId, searchQuery]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItem, val: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleCreatePrescription = async () => {
    if (!formPatientId.trim()) {
      Alert.alert('Required', 'Please select or enter a Patient ID.');
      return;
    }
    if (!formClinicId.trim()) {
      Alert.alert('Required', 'Please select a clinic for this prescription.');
      return;
    }
    if (!formDiagnosis.trim()) {
      Alert.alert('Required', 'Please enter a medical diagnosis.');
      return;
    }
    const validItems = items.filter((i) => i.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      Alert.alert('Required', 'Please add at least one valid medicine.');
      return;
    }

    try {
      await createPrescriptionMutation.mutateAsync({
        patientId: formPatientId.trim(),
        clinicId: formClinicId.trim(),
        diagnosis: formDiagnosis.trim(),
        items: validItems,
        notes: formNotes.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setFormPatientId('');
      setFormDiagnosis('');
      setFormNotes('');
      setItems([
        { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' },
      ]);
      Alert.alert('Prescription Issued', 'The digital prescription has been created successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to create prescription.');
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
      {/* Header & Filter Card */}
      <View style={styles.topContainer}>
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Digital Prescriptions</Text>
                <Text style={styles.headerSubtitle}>
                  Issue, view, and manage medical prescriptions
                </Text>
              </View>
              <TouchableOpacity
                style={styles.newPrescriptionBtn}
                onPress={() => {
                  if (clinics.length > 0 && !formClinicId) {
                    setFormClinicId(clinics[0].id);
                  }
                  setIsCreateModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <Icon name="file-text" size={14} color="#FFFFFF" />
                <Text style={styles.newPrescriptionBtnText}>+ Issue Rx</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.light.ink400} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by patient, diagnosis, medicine..."
                placeholderTextColor={Colors.light.ink400}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="x" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Clinic Filter Tabs */}
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
                  onPress={() => setSelectedClinicId('ALL')}
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
                      onPress={() => setSelectedClinicId(clinic.id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
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

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading prescriptions...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={28} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Unable to load prescriptions</Text>
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
      ) : filteredPrescriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="file-text" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedClinicId !== 'ALL'
              ? 'No prescriptions matched your active search filters.'
              : 'Issue your first digital prescription for a patient.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrescriptions}
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
            <GradientCard variant="purple" style={styles.rxCard}>
              <TouchableOpacity
                style={styles.rxCardContent}
                onPress={() => setDetailsPrescription(item)}
                activeOpacity={0.8}
              >
                <View style={styles.rxCardTop}>
                  <View style={styles.rxPatientInfo}>
                    <Text style={styles.rxPatientName}>{item.patientName}</Text>
                    <Text style={styles.rxClinicName}>
                      <Icon name="building" size={11} color={Colors.light.ink500} />{' '}
                      {item.clinicName}
                    </Text>
                  </View>
                  <View style={styles.rxDateBadge}>
                    <Text style={styles.rxDateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.rxDiagnosisRow}>
                  <Text style={styles.rxDiagnosisLabel}>Diagnosis:</Text>
                  <Text style={styles.rxDiagnosisValue}>{item.diagnosis}</Text>
                </View>

                <View style={styles.rxFooterRow}>
                  <View style={styles.rxMedicinesPill}>
                    <Icon name="activity" size={12} color="#7C3AED" />
                    <Text style={styles.rxMedicinesCount}>
                      {item.items?.length ?? 0} {item.items?.length === 1 ? 'Medicine' : 'Medicines'}
                    </Text>
                  </View>
                  <Text style={styles.viewDetailsLink}>View Details →</Text>
                </View>
              </TouchableOpacity>
            </GradientCard>
          )}
        />
      )}

      {/* Prescription Details Modal */}
      <Modal
        visible={Boolean(detailsPrescription)}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsPrescription(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalCard}>
            <View style={styles.detailsModalHeader}>
              <View>
                <Text style={styles.detailsModalTitle}>Prescription Details</Text>
                <Text style={styles.detailsModalDate}>
                  {detailsPrescription ? formatDate(detailsPrescription.createdAt) : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailsPrescription(null)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
              {detailsPrescription && (
                <View style={styles.detailsContent}>
                  <View style={styles.detailsInfoRow}>
                    <Text style={styles.detailsInfoLabel}>Patient:</Text>
                    <Text style={styles.detailsInfoValue}>{detailsPrescription.patientName}</Text>
                  </View>
                  <View style={styles.detailsInfoRow}>
                    <Text style={styles.detailsInfoLabel}>Clinic Center:</Text>
                    <Text style={styles.detailsInfoValue}>{detailsPrescription.clinicName}</Text>
                  </View>
                  <View style={styles.detailsInfoRow}>
                    <Text style={styles.detailsInfoLabel}>Diagnosis:</Text>
                    <Text style={styles.detailsInfoValue}>{detailsPrescription.diagnosis}</Text>
                  </View>

                  <Text style={styles.detailsSectionHeading}>Prescribed Medicines</Text>
                  <View style={styles.medicinesList}>
                    {detailsPrescription.items?.map((med, idx) => (
                      <View key={idx} style={styles.medCard}>
                        <Text style={styles.medNameText}>
                          {idx + 1}. {med.medicineName}
                        </Text>
                        <View style={styles.medMetaRow}>
                          <Text style={styles.medMetaItem}>Dosage: {med.dosage}</Text>
                          <Text style={styles.medMetaItem}>Freq: {med.frequency}</Text>
                          <Text style={styles.medMetaItem}>Duration: {med.duration}</Text>
                        </View>
                        {med.instructions ? (
                          <Text style={styles.medInstructions}>Note: {med.instructions}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {detailsPrescription.notes ? (
                    <View style={styles.rxNotesBox}>
                      <Text style={styles.rxNotesLabel}>Doctor Advice / Instructions:</Text>
                      <Text style={styles.rxNotesText}>{detailsPrescription.notes}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Issue Prescription Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Issue Digital Prescription</Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.createFormContent}>
                {/* Patient selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Patient ID / Select Patient</Text>
                  {patientsList.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.patientChipsRow}
                    >
                      {patientsList.slice(0, 8).map((p) => {
                        const isSel = formPatientId === (p.patientId || p.id);
                        return (
                          <TouchableOpacity
                            key={p.id || p.patientId}
                            style={[styles.patientChip, isSel && styles.patientChipActive]}
                            onPress={() => setFormPatientId(p.patientId || p.id)}
                          >
                            <Text style={[styles.patientChipText, isSel && styles.patientChipTextActive]}>
                              {p.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  <TextInput
                    style={styles.formInput}
                    value={formPatientId}
                    onChangeText={setFormPatientId}
                    placeholder="Enter Patient UUID or select above"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                {/* Clinic selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Clinic Center</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.patientChipsRow}
                  >
                    {clinics.map((c) => {
                      const isSel = formClinicId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.patientChip, isSel && styles.patientChipActive]}
                          onPress={() => setFormClinicId(c.id)}
                        >
                          <Text style={[styles.patientChipText, isSel && styles.patientChipTextActive]}>
                            {c.clinicName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Diagnosis */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Medical Diagnosis</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formDiagnosis}
                    onChangeText={setFormDiagnosis}
                    placeholder="e.g. Acute Bronchitis / Seasonal Allergy"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                {/* Medicine Items Builder */}
                <View style={styles.formGroup}>
                  <View style={styles.flexRowBetween}>
                    <Text style={styles.formLabel}>Medicines List</Text>
                    <TouchableOpacity onPress={handleAddItem} style={styles.addMedBtn}>
                      <Text style={styles.addMedBtnText}>+ Add Medicine</Text>
                    </TouchableOpacity>
                  </View>

                  {items.map((item, idx) => (
                    <View key={idx} style={styles.builderItemCard}>
                      <View style={styles.flexRowBetween}>
                        <Text style={styles.builderMedNumber}>Medicine #{idx + 1}</Text>
                        {items.length > 1 && (
                          <TouchableOpacity onPress={() => handleRemoveItem(idx)}>
                            <Icon name="trash-2" size={14} color={Colors.light.danger} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <TextInput
                        style={styles.formInput}
                        value={item.medicineName}
                        onChangeText={(val) => handleUpdateItem(idx, 'medicineName', val)}
                        placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                        placeholderTextColor={Colors.light.ink400}
                      />

                      <View style={styles.builderRow}>
                        <TextInput
                          style={[styles.formInput, styles.flex1]}
                          value={item.dosage}
                          onChangeText={(val) => handleUpdateItem(idx, 'dosage', val)}
                          placeholder="Dosage (1 tab)"
                          placeholderTextColor={Colors.light.ink400}
                        />
                        <TextInput
                          style={[styles.formInput, styles.flex1]}
                          value={item.frequency}
                          onChangeText={(val) => handleUpdateItem(idx, 'frequency', val)}
                          placeholder="Freq (1-0-1)"
                          placeholderTextColor={Colors.light.ink400}
                        />
                        <TextInput
                          style={[styles.formInput, styles.flex1]}
                          value={item.duration}
                          onChangeText={(val) => handleUpdateItem(idx, 'duration', val)}
                          placeholder="Days (5d)"
                          placeholderTextColor={Colors.light.ink400}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Additional Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Advice & Patient Instructions (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.notesInput]}
                    value={formNotes}
                    onChangeText={setFormNotes}
                    placeholder="e.g. Drink plenty of warm water, review in 5 days."
                    placeholderTextColor={Colors.light.ink400}
                    multiline
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={styles.submitRxBtn}
                  onPress={handleCreatePrescription}
                  disabled={createPrescriptionMutation.isPending}
                >
                  {createPrescriptionMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitRxBtnText}>Save & Issue Prescription</Text>
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
    gap: Spacing.three,
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
  newPrescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  newPrescriptionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.ink900,
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
    gap: Spacing.three,
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
    maxWidth: 260,
  },
  rxCard: {
    marginBottom: Spacing.two,
  },
  rxCardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  rxCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rxPatientInfo: {
    gap: 2,
    flex: 1,
  },
  rxPatientName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  rxClinicName: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  rxDateBadge: {
    backgroundColor: Colors.light.surface50,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  rxDateText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  rxDiagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rxDiagnosisLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  rxDiagnosisValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  rxFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.two,
    marginTop: 2,
  },
  rxMedicinesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rxMedicinesCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  viewDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  detailsModalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  detailsModalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  detailsModalDate: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  modalCloseBtn: {
    padding: 4,
  },
  detailsScroll: {
    marginTop: Spacing.three,
  },
  detailsContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsInfoLabel: {
    fontSize: 12,
    color: Colors.light.ink500,
    width: 90,
  },
  detailsInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    flex: 1,
  },
  detailsSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
    marginTop: Spacing.two,
  },
  medicinesList: {
    gap: Spacing.two,
  },
  medCard: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 3,
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  medMetaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  medMetaItem: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  medInstructions: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
    marginTop: 2,
  },
  rxNotesBox: {
    backgroundColor: '#FAF5FF',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 3,
  },
  rxNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B21A8',
  },
  rxNotesText: {
    fontSize: 12,
    color: '#581C87',
  },
  createModalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  createScroll: {
    marginTop: Spacing.two,
  },
  createFormContent: {
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
  patientChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  patientChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  patientChipActive: {
    backgroundColor: Colors.light.primary,
  },
  patientChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  patientChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  flexRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMedBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  addMedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  builderItemCard: {
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 8,
    marginTop: 4,
  },
  builderMedNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  builderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  flex1: {
    flex: 1,
  },
  submitRxBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitRxBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
