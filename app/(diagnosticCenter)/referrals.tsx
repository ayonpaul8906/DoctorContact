import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useIncomingReferrals,
  useUpdateReferralStatus,
  type Referral,
  type ReferralStatus,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const FILTERS: { label: string; value?: ReferralStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function StatusBadge({ status }: { status?: string }) {
  const s = status?.toUpperCase() || 'PENDING';
  let bg = '#FEF3C7', text = '#B45309', border = '#FDE68A';
  if (s === 'COMPLETED') {
    bg = '#DCFCE7'; text = '#15803D'; border = '#BBF7D0';
  } else if (s === 'IN_PROGRESS') {
    bg = '#EFF6FF'; text = '#1D4ED8'; border = '#BFDBFE';
  } else if (s === 'CANCELLED') {
    bg = '#FEF2F2'; text = '#DC2626'; border = '#FECACA';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statusBadgeText, { color: text }]}>{s.replace('_', ' ')}</Text>
    </View>
  );
}

export default function DiagnosticCenterReferralsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ReferralStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: referrals = [],
    isLoading,
    refetch,
    isRefetching,
  } = useIncomingReferrals(selectedFilter ? { status: selectedFilter } : {});

  const updateStatusMutation = useUpdateReferralStatus();

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Filter by search term
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return referrals;
    const term = searchTerm.toLowerCase();
    return referrals.filter((r) => {
      const pName = r.patient?.user?.name || r.patient?.name || '';
      const pPhone = r.patient?.phone || r.patient?.user?.phone || '';
      const cName = r.referringClinic?.clinicName || '';
      const tests = r.testNames ? r.testNames.join(' ') : '';
      return (
        pName.toLowerCase().includes(term) ||
        pPhone.includes(term) ||
        cName.toLowerCase().includes(term) ||
        tests.toLowerCase().includes(term)
      );
    });
  }, [referrals, searchTerm]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: ReferralStatus,
    notes?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus,
        resultNotes: notes,
      });
      if (selectedReferral && selectedReferral.id === id) {
        setSelectedReferral((prev) =>
          prev ? { ...prev, status: newStatus, resultNotes: notes || prev.resultNotes } : null
        );
      }
      Alert.alert('Status Updated', `Referral is now marked as ${newStatus.replace('_', ' ')}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update referral status.');
    }
  };

  const openDetailModal = (r: Referral) => {
    setSelectedReferral(r);
    setResultNotes(r.resultNotes || '');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Incoming Referrals</Text>
          <Text style={styles.headerSubtitle}>
            Doctor recommendations & test work orders
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          <Icon name="refresh-cw" size={16} color="#0F766E" />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {FILTERS.map((f) => {
            const isActive = selectedFilter === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedFilter(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name, phone, or test..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            clearButtonMode="while-editing"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Fetching referrals from database...</Text>
        </View>
      )}

      {/* Referrals List */}
      {!isLoading && (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => { refetch(); }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="inbox" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Referrals Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? 'No orders match your search criteria.'
                  : selectedFilter
                  ? `No referrals currently in '${selectedFilter.replace('_', ' ')}' status.`
                  : 'You have no incoming patient test recommendations yet.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const patientName = item.patient?.user?.name || item.patient?.name || 'Patient';
            const patientPhone = item.patient?.phone || item.patient?.user?.phone;
            const clinicName = item.referringClinic?.clinicName;
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <TouchableOpacity
                style={styles.referralCard}
                activeOpacity={0.7}
                onPress={() => openDetailModal(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.patientRow}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>
                        {patientName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.patientNameCol}>
                      <Text style={styles.patientName} numberOfLines={1}>
                        {patientName}
                      </Text>
                      {patientPhone ? (
                        <Text style={styles.patientPhone}>{patientPhone}</Text>
                      ) : null}
                    </View>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                {/* Test Chips */}
                <View style={styles.testChipsContainer}>
                  {item.testNames && item.testNames.length > 0 ? (
                    item.testNames.map((tName, i) => (
                      <View key={i} style={styles.testChip}>
                        <Icon name="flask" size={10} color="#0F766E" />
                        <Text style={styles.testChipText}>{tName}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTestText}>Standard Investigation</Text>
                  )}
                </View>

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.clinicRow}>
                    <Icon name="building" size={12} color="#64748B" />
                    <Text style={styles.clinicText} numberOfLines={1}>
                      {clinicName ? clinicName : 'Direct Patient Referral'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{dateStr}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ============================================================
          REFERRAL DETAIL MODAL (Matching Webapp)
      ============================================================ */}
      <Modal
        visible={!!selectedReferral}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReferral(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order Details</Text>
                <Text style={styles.modalSubtitle}>
                  Order #{selectedReferral?.id.slice(-6).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReferral(null)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedReferral && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Patient summary */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeader}>PATIENT INFORMATION</Text>
                  <Text style={styles.modalPatientName}>
                    {selectedReferral.patient?.user?.name ||
                      selectedReferral.patient?.name ||
                      'Patient'}
                  </Text>
                  {selectedReferral.patient?.phone && (
                    <Text style={styles.modalDetailText}>
                      Phone: {selectedReferral.patient.phone}
                    </Text>
                  )}
                  {selectedReferral.patient?.address && (
                    <Text style={styles.modalDetailText}>
                      Address: {selectedReferral.patient.address}
                    </Text>
                  )}
                </View>

                {/* Requested Tests */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeader}>REQUESTED TESTS</Text>
                  <View style={styles.modalChipsWrap}>
                    {selectedReferral.testNames?.map((t, i) => (
                      <View key={i} style={styles.modalTestChip}>
                        <Icon name="flask" size={12} color="#0F766E" />
                        <Text style={styles.modalTestChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Referral Source */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeader}>REFERRING CLINIC / DOCTOR</Text>
                  <Text style={styles.modalClinicName}>
                    {selectedReferral.referringClinic?.clinicName || 'Direct Booking'}
                  </Text>
                  {selectedReferral.notes && (
                    <Text style={styles.modalDoctorNotes}>
                      Doctor Note: "{selectedReferral.notes}"
                    </Text>
                  )}
                </View>

                {/* Current Status & Result Notes */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeader}>UPDATE STATUS & LAB FINDINGS</Text>
                  <View style={styles.statusDisplayRow}>
                    <Text style={styles.currentStatusLabel}>Current Status:</Text>
                    <StatusBadge status={selectedReferral.status} />
                  </View>

                  <Text style={styles.resultNotesInputLabel}>Lab Result Notes / Findings</Text>
                  <TextInput
                    style={styles.resultNotesInput}
                    placeholder="Enter diagnostic report summary or findings..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={resultNotes}
                    onChangeText={setResultNotes}
                  />

                  <View style={styles.actionButtonsCol}>
                    {selectedReferral.status === 'PENDING' && (
                      <TouchableOpacity
                        style={[styles.statusActionBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() =>
                          handleUpdateStatus(selectedReferral.id, 'IN_PROGRESS', resultNotes)
                        }
                      >
                        <Icon name="clock" size={16} color="#FFFFFF" />
                        <Text style={styles.statusActionBtnText}>Start Processing Test</Text>
                      </TouchableOpacity>
                    )}

                    {selectedReferral.status !== 'COMPLETED' && (
                      <TouchableOpacity
                        style={[styles.statusActionBtn, { backgroundColor: '#16A34A' }]}
                        onPress={() =>
                          handleUpdateStatus(selectedReferral.id, 'COMPLETED', resultNotes)
                        }
                      >
                        <Icon name="check-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.statusActionBtnText}>
                          Complete Test & Save Findings
                        </Text>
                      </TouchableOpacity>
                    )}

                    {selectedReferral.status !== 'CANCELLED' &&
                      selectedReferral.status !== 'COMPLETED' && (
                        <TouchableOpacity
                          style={[styles.statusActionBtn, { backgroundColor: '#FEF2F2' }]}
                          onPress={() =>
                            handleUpdateStatus(selectedReferral.id, 'CANCELLED', resultNotes)
                          }
                        >
                          <Icon name="x" size={16} color="#DC2626" />
                          <Text style={[styles.statusActionBtnText, { color: '#DC2626' }]}>
                            Cancel Referral
                          </Text>
                        </TouchableOpacity>
                      )}

                    {/* Print work order button */}
                    <TouchableOpacity
                      style={styles.printSlipBtn}
                      onPress={() => setSlipModalOpen(true)}
                    >
                      <Icon name="file-text" size={16} color="#0F766E" />
                      <Text style={styles.printSlipBtnText}>Print Work Order Slip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================
          PRINT / PREVIEW WORK ORDER SLIP MODAL
      ============================================================ */}
      <Modal
        visible={slipModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSlipModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diagnostic Lab Work Order</Text>
              <TouchableOpacity onPress={() => setSlipModalOpen(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedReferral && (
              <ScrollView style={styles.slipScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.slipPaper}>
                  <View style={styles.slipHeader}>
                    <Text style={styles.slipLabName}>DEWASI HEALTH NETWORK</Text>
                    <Text style={styles.slipSub}>Diagnostic Laboratory Requisition Slip</Text>
                    <Text style={styles.slipOrderNum}>
                      Order ID: #{selectedReferral.id.slice(-8).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.slipDivider} />

                  <View style={styles.slipRow}>
                    <Text style={styles.slipLabel}>Patient Name:</Text>
                    <Text style={styles.slipVal}>
                      {selectedReferral.patient?.user?.name ||
                        selectedReferral.patient?.name ||
                        'Patient'}
                    </Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={styles.slipLabel}>Phone:</Text>
                    <Text style={styles.slipVal}>
                      {selectedReferral.patient?.phone || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={styles.slipLabel}>Referred By:</Text>
                    <Text style={styles.slipVal}>
                      {selectedReferral.referringClinic?.clinicName || 'Clinic Front Desk'}
                    </Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={styles.slipLabel}>Date:</Text>
                    <Text style={styles.slipVal}>
                      {new Date(selectedReferral.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.slipDivider} />

                  <Text style={styles.slipSectionTitle}>INVESTIGATIONS REQUIRED:</Text>
                  {selectedReferral.testNames?.map((test, index) => (
                    <Text key={index} style={styles.slipTestItem}>
                      • {test}
                    </Text>
                  ))}

                  {selectedReferral.notes ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.slipSectionTitle}>CLINICAL NOTES:</Text>
                      <Text style={styles.slipNotes}>{selectedReferral.notes}</Text>
                    </View>
                  ) : null}

                  <View style={styles.slipSignRow}>
                    <View style={styles.slipSignLine}>
                      <Text style={styles.slipSignText}>Technician Signature</Text>
                    </View>
                    <View style={styles.slipSignLine}>
                      <Text style={styles.slipSignText}>Pathologist Verification</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeSlipBtn}
                  onPress={() => setSlipModalOpen(false)}
                >
                  <Text style={styles.closeSlipBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  filterPillsScroll: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.three,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  patientNameCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  testChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  testChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },
  noTestText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  notesText: {
    fontSize: 11.5,
    color: '#334155',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  clinicText: {
    fontSize: 11,
    color: '#64748B',
  },
  dateText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalScroll: {
    marginTop: Spacing.three,
  },
  modalSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
    gap: 4,
  },
  modalSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalPatientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDetailText: {
    fontSize: 12,
    color: '#475569',
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  modalTestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  modalTestChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  modalClinicName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDoctorNotes: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentStatusLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  resultNotesInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  resultNotesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: Spacing.three,
  },
  actionButtonsCol: {
    gap: Spacing.two,
    marginTop: 4,
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  statusActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  printSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 11,
    borderRadius: Radius.lg,
  },
  printSlipBtnText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700',
  },
  slipScroll: {
    marginTop: Spacing.three,
  },
  slipPaper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  slipHeader: {
    alignItems: 'center',
    gap: 2,
  },
  slipLabName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  slipSub: {
    fontSize: 11,
    color: '#64748B',
  },
  slipOrderNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 4,
  },
  slipDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  slipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  slipLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  slipVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  slipSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginTop: 4,
  },
  slipTestItem: {
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },
  slipNotes: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#475569',
  },
  slipSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 8,
  },
  slipSignLine: {
    borderTopWidth: 1,
    borderTopColor: '#94A3B8',
    width: '45%',
    alignItems: 'center',
    paddingTop: 4,
  },
  slipSignText: {
    fontSize: 9.5,
    color: '#64748B',
  },
  closeSlipBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
  },
  closeSlipBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
