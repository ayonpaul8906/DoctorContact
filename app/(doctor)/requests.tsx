import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDoctorReceivedRequests,
  useDoctorSentRequests,
  useRespondDoctorRequest,
  useDoctorSendClinicRequest,
  useCancelAssociation,
  useSearchClinics,
} from '../../hooks/useDoctor';
import type { DoctorRequest, DayOfWeek } from '../../types';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function DoctorRequestsScreen() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [formClinicId, setFormClinicId] = useState('');
  const [formDay, setFormDay] = useState<DayOfWeek>('MONDAY');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formFee, setFormFee] = useState('500');

  // Queries
  const { data: clinics = [] } = useSearchClinics();

  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
    isRefetching: isRefetchingReceived,
  } = useDoctorReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
    isRefetching: isRefetchingSent,
  } = useDoctorSentRequests();

  const isRefreshing = isRefetchingReceived || isRefetchingSent;
  const isInitialLoading = loadingReceived || loadingSent;

  // Mutations
  const respondMutation = useRespondDoctorRequest();
  const sendRequestMutation = useDoctorSendClinicRequest();
  const cancelMutation = useCancelAssociation();

  const filteredReceived = useMemo(() => {
    if (statusFilter === 'ALL') return receivedRequests;
    return receivedRequests.filter((r) => r.status === statusFilter);
  }, [receivedRequests, statusFilter]);

  const filteredSent = useMemo(() => {
    if (statusFilter === 'ALL') return sentRequests;
    return sentRequests.filter((r) => r.status === statusFilter);
  }, [sentRequests, statusFilter]);

  const pendingReceivedCount = useMemo(() => {
    return receivedRequests.filter((r) => r.status === 'PENDING').length;
  }, [receivedRequests]);

  const handleRefreshAll = () => {
    refetchReceived();
    refetchSent();
  };

  const handleRespond = (request: DoctorRequest, action: 'ACCEPT' | 'REJECT') => {
    Alert.alert(
      `${action === 'ACCEPT' ? 'Accept' : 'Decline'} Association`,
      `Are you sure you want to ${action.toLowerCase()} connection request from ${request.clinic?.clinicName || 'this clinic'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'ACCEPT' ? 'Accept' : 'Decline',
          style: action === 'ACCEPT' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await respondMutation.mutateAsync({
                associationId: request.id,
                action,
              });
              Alert.alert('Success', `Request ${action.toLowerCase()}ed.`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = (request: DoctorRequest) => {
    Alert.alert(
      'Cancel Request',
      `Cancel your pending connection request to ${request.clinic?.clinicName || 'this clinic'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(request.id);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
            }
          },
        },
      ]
    );
  };

  const handleSendClinicRequest = async () => {
    if (!formClinicId) {
      Alert.alert('Required', 'Please select a clinic.');
      return;
    }
    const feeNum = formFee ? parseInt(formFee, 10) : undefined;

    try {
      await sendRequestMutation.mutateAsync({
        clinicId: formClinicId,
        dayOfWeek: formDay,
        startTime: formStartTime,
        endTime: formEndTime,
        fee: feeNum,
      });
      setIsSendModalOpen(false);
      Alert.alert('Request Sent', 'Your association request has been sent to the clinic.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to send request.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { bg: '#ECFDF5', color: '#047857', label: 'Accepted' };
      case 'PENDING':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Pending' };
      case 'REJECTED':
        return { bg: '#FEF2F2', color: '#BE123C', label: 'Declined' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563', label: status };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.topContainer}>
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Clinic Requests</Text>
                <Text style={styles.headerSubtitle}>
                  Manage incoming and outgoing practice connections
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sendRequestBtn}
                onPress={() => {
                  if (clinics.length > 0 && !formClinicId) {
                    setFormClinicId(clinics[0].id);
                  }
                  setIsSendModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.sendRequestBtnText}>Connect Clinic</Text>
              </TouchableOpacity>
            </View>

            {/* Tab switch: Received vs Sent */}
            <View style={styles.tabSwitchRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'received' && styles.tabBtnActive]}
                onPress={() => setActiveTab('received')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'received' && styles.tabBtnTextActive]}>
                  Received ({receivedRequests.length})
                </Text>
                {pendingReceivedCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{pendingReceivedCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'sent' && styles.tabBtnActive]}
                onPress={() => setActiveTab('sent')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'sent' && styles.tabBtnTextActive]}>
                  Sent ({sentRequests.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter Chips */}
            <View style={styles.filterChipsRow}>
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((st) => {
                const isSel = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, isSel && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                      {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GradientCard>
      </View>

      {/* Content List */}
      {isInitialLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading connection requests...</Text>
        </View>
      ) : (activeTab === 'received' ? filteredReceived : filteredSent).length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="inbox" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'received'
              ? 'No incoming clinic requests match the active filter.'
              : 'You have not sent any pending connection requests.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'received' ? filteredReceived : filteredSent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefreshAll}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const isPending = item.status === 'PENDING';

            return (
              <GradientCard variant="purple" style={styles.requestCard}>
                <View style={styles.requestCardContent}>
                  <View style={styles.requestTopRow}>
                    <View style={styles.clinicInfoCol}>
                      <Text style={styles.clinicNameText}>
                        {item.clinic?.clinicName || 'Clinic Partner'}
                      </Text>
                      {item.clinic?.city && (
                        <Text style={styles.clinicLocationText}>
                          <Icon name="map-pin" size={11} color={Colors.light.ink500} />{' '}
                          {item.clinic.city}
                        </Text>
                      )}
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Consultation Terms */}
                  <View style={styles.termsBox}>
                    <View style={styles.termItem}>
                      <Text style={styles.termLabel}>Schedule Day</Text>
                      <Text style={styles.termVal}>{item.dayOfWeek || 'All Days'}</Text>
                    </View>
                    <View style={styles.termItem}>
                      <Text style={styles.termLabel}>Working Hours</Text>
                      <Text style={styles.termVal}>
                        {item.startTime} - {item.endTime}
                      </Text>
                    </View>
                    <View style={styles.termItem}>
                      <Text style={styles.termLabel}>Consultation Fee</Text>
                      <Text style={styles.termVal}>
                        {item.fee != null ? `₹${item.fee}` : 'Standard'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons for Received / Sent */}
                  {activeTab === 'received' && isPending && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleRespond(item, 'REJECT')}
                        disabled={respondMutation.isPending}
                      >
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleRespond(item, 'ACCEPT')}
                        disabled={respondMutation.isPending}
                      >
                        <Text style={styles.acceptBtnText}>Accept Connection</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'sent' && isPending && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.cancelRequestBtn}
                        onPress={() => handleCancelRequest(item)}
                        disabled={cancelMutation.isPending}
                      >
                        <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </GradientCard>
            );
          }}
        />
      )}

      {/* Send Clinic Request Modal */}
      <Modal
        visible={isSendModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSendModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect with Clinic</Text>
              <TouchableOpacity onPress={() => setIsSendModalOpen(false)}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                {/* Clinic selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Select Target Clinic</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.clinicSelectChips}
                  >
                    {clinics.map((c) => {
                      const isSel = formClinicId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.clinicChip, isSel && styles.clinicChipActive]}
                          onPress={() => setFormClinicId(c.id)}
                        >
                          <Text style={[styles.clinicChipText, isSel && styles.clinicChipTextActive]}>
                            {c.clinicName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Day of Week */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Day of Practice</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.clinicSelectChips}
                  >
                    {DAYS_OF_WEEK.map((d) => {
                      const isSel = formDay === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          style={[styles.clinicChip, isSel && styles.clinicChipActive]}
                          onPress={() => setFormDay(d)}
                        >
                          <Text style={[styles.clinicChipText, isSel && styles.clinicChipTextActive]}>
                            {d.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Timings */}
                <View style={styles.timingRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.formLabel}>Start Time</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formStartTime}
                      onChangeText={setFormStartTime}
                      placeholder="09:00"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.formLabel}>End Time</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formEndTime}
                      onChangeText={setFormEndTime}
                      placeholder="17:00"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>
                </View>

                {/* Fee */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Proposed Fee (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formFee}
                    onChangeText={setFormFee}
                    keyboardType="numeric"
                    placeholder="500"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitConnectBtn}
                  onPress={handleSendClinicRequest}
                  disabled={sendRequestMutation.isPending}
                >
                  {sendRequestMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitConnectBtnText}>Send Connection Request</Text>
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
  sendRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  sendRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabSwitchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.surfaceWhite,
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  tabBtnTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 4,
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
  requestCard: {
    marginBottom: Spacing.two,
  },
  requestCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clinicInfoCol: {
    gap: 2,
    flex: 1,
  },
  clinicNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  clinicLocationText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  termsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  termItem: {
    flex: 1,
    gap: 2,
  },
  termLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  termVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.two,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  acceptBtn: {
    flex: 1.5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  cancelRequestBtn: {
    flex: 1,
    backgroundColor: Colors.light.surface100,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancelRequestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
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
    maxHeight: '85%',
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
  modalForm: {
    gap: Spacing.three,
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
  clinicSelectChips: {
    flexDirection: 'row',
    gap: 6,
  },
  clinicChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  clinicChipActive: {
    backgroundColor: Colors.light.primary,
  },
  clinicChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  clinicChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timingRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
    gap: 6,
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
  submitConnectBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitConnectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
