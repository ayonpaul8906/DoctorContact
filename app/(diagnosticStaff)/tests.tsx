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

export default function DiagnosticStaffTestsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ReferralStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: tests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useIncomingReferrals(selectedFilter ? { status: selectedFilter } : {});

  const updateStatusMutation = useUpdateReferralStatus();

  // Test action & modal state
  const [selectedTest, setSelectedTest] = useState<Referral | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [resultFindings, setResultFindings] = useState('');

  // Filtered by search
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return tests;
    const term = searchTerm.toLowerCase();
    return tests.filter((t) => {
      const pName = t.patient?.user?.name || t.patient?.name || '';
      const pPhone = t.patient?.phone || t.patient?.user?.phone || '';
      const tNames = t.testNames ? t.testNames.join(' ') : '';
      return (
        pName.toLowerCase().includes(term) ||
        pPhone.includes(term) ||
        tNames.toLowerCase().includes(term)
      );
    });
  }, [tests, searchTerm]);

  const handleStartProcessing = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: 'IN_PROGRESS',
      });
      Alert.alert('Processing Started', 'Test status marked as In Progress.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to start processing.');
    }
  };

  const handleOpenCompleteModal = (test: Referral) => {
    setSelectedTest(test);
    setResultFindings(test.resultNotes || '');
    setCompleteModalOpen(true);
  };

  const handleSaveComplete = async () => {
    if (!selectedTest) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedTest.id,
        status: 'COMPLETED',
        resultNotes: resultFindings.trim() || undefined,
      });
      setCompleteModalOpen(false);
      setSelectedTest(null);
      Alert.alert('Test Completed', 'Diagnostic test results and report saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to complete test.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Assigned Test Queue</Text>
          <Text style={styles.headerSubtitle}>
            Sample collection, diagnostics & recording findings
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          <Icon name="refresh-cw" size={16} color="#2563EB" />
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
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching assigned tests...</Text>
        </View>
      )}

      {/* Test List */}
      {!isLoading && (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => { refetch(); }}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {filteredList.length} test order{filteredList.length !== 1 ? 's' : ''} in queue
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="flask" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Queue Empty</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? 'No test orders match your search keyword.'
                  : selectedFilter
                  ? `No test orders in '${selectedFilter.replace('_', ' ')}' status.`
                  : 'You have completed all pending diagnostic tests!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const patientName = item.patient?.user?.name || item.patient?.name || 'Patient';
            const patientPhone = item.patient?.phone || item.patient?.user?.phone;
            const clinicName = item.referringClinic?.clinicName;
            const isPending = item.status === 'PENDING';
            const isInProgress = item.status === 'IN_PROGRESS';
            const isCompleted = item.status === 'COMPLETED';

            return (
              <View style={styles.card}>
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
                <View style={styles.chipsContainer}>
                  {item.testNames && item.testNames.length > 0 ? (
                    item.testNames.map((tName, i) => (
                      <View key={i} style={styles.testChip}>
                        <Icon name="flask" size={10} color="#2563EB" />
                        <Text style={styles.testChipText}>{tName}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTestText}>Diagnostic Sample Analysis</Text>
                  )}
                </View>

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Prescription Notes:</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                {item.resultNotes ? (
                  <View style={[styles.notesBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <Text style={[styles.notesLabel, { color: '#16A34A' }]}>Recorded Findings:</Text>
                    <Text style={[styles.notesText, { color: '#14532D' }]}>{item.resultNotes}</Text>
                  </View>
                ) : null}

                {/* Workflow Actions */}
                <View style={styles.cardFooter}>
                  <View style={styles.clinicRow}>
                    <Icon name="building" size={12} color="#64748B" />
                    <Text style={styles.clinicText} numberOfLines={1}>
                      {clinicName || 'Clinic Front Desk'}
                    </Text>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    {isPending && (
                      <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => handleStartProcessing(item.id)}
                      >
                        <Icon name="play" size={12} color="#2563EB" />
                        <Text style={styles.startBtnText}>Start Test</Text>
                      </TouchableOpacity>
                    )}

                    {!isCompleted && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleOpenCompleteModal(item)}
                      >
                        <Icon name="check" size={12} color="#FFFFFF" />
                        <Text style={styles.completeBtnText}>
                          {isInProgress ? 'Complete & Report' : 'Complete'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ============================================================
          COMPLETE TEST MODAL (RECORD LAB FINDINGS)
      ============================================================ */}
      <Modal
        visible={completeModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCompleteModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Complete Diagnostic Test</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTest?.patient?.user?.name || selectedTest?.patient?.name} •{' '}
                  {selectedTest?.testNames?.join(', ')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCompleteModalOpen(false)}>
                <Icon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Diagnostic Findings / Values *</Text>
              <TextInput
                style={styles.findingsInput}
                placeholder="e.g. Haemoglobin: 13.8 g/dL, Platelets: 240,000 /uL. Test within normal reference range."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={resultFindings}
                onChangeText={setResultFindings}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  updateStatusMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleSaveComplete}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Mark Completed & Finalize Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
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
  card: {
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
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
    paddingTop: 8,
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
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  startBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  completeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
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
    maxHeight: '80%',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalBody: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  findingsInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
