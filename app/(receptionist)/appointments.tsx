import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyAssignedDoctors } from '../../hooks/useReceptionist';
import {
  useClinicAppointments,
  useCancelClinicAppointment,
  useUpdateAppointmentStatus,
} from '../../hooks/useClinic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import type { Appointment, AppointmentStatus } from '../../types';

const STATUS_FILTERS: { key: AppointmentStatus | 'ALL'; label: string; color: string; bg: string }[] = [
  { key: 'ALL', label: 'All', color: Colors.light.ink700, bg: Colors.light.surface100 },
  { key: 'WAITING', label: 'Waiting', color: '#B45309', bg: '#FEF3C7' },
  { key: 'CHECKED_IN', label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'IN_CONSULTATION', label: 'In Room', color: '#6D28D9', bg: '#F5F3FF' },
  { key: 'COMPLETED', label: 'Completed', color: '#047857', bg: '#ECFDF5' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'ABSENT', label: 'Absent', color: '#4B5563', bg: '#F3F4F6' },
];

export default function ReceptionistAppointmentsScreen() {
  const { data: doctors = [], isLoading: loadingDoctors } = useMyAssignedDoctors();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter States
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [dateMode, setDateMode] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  const activeDate = useMemo(() => {
    if (dateMode === 'all') return undefined;
    if (dateMode === 'today') return todayStr;
    if (dateMode === 'tomorrow') return tomorrowStr;
    return customDate.trim() || undefined;
  }, [dateMode, todayStr, tomorrowStr, customDate]);

  // Appointments Query scoped to clinic & assigned doctors
  const {
    data: appointments = [],
    isLoading,
    isFetching,
    refetch,
  } = useClinicAppointments({
    doctorId: selectedDoctorId === 'ALL' ? undefined : selectedDoctorId,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    date: activeDate,
  });

  // Action Mutations
  const cancelMutation = useCancelClinicAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  // Search Filter
  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((appt) => {
        const pName = (appt.patient?.user?.name || appt.patient?.name || '').toLowerCase();
        const pPhone = (appt.patient?.user?.phone || '').toLowerCase();
        const docName = (appt.doctor?.user?.name || '').toLowerCase();
        const tok = String(appt.token);
        return pName.includes(q) || pPhone.includes(q) || docName.includes(q) || tok === q;
      });
    }
    return list;
  }, [appointments, searchQuery]);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'CHECKED_IN' });
      Alert.alert('Checked In', 'Patient marked as checked in at reception.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not check in patient.');
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'IN_CONSULTATION' });
      Alert.alert('Called In', 'Patient called into consulting chamber.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update status.');
    }
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'COMPLETED' });
      Alert.alert('Completed', 'Consultation marked completed.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not complete visit.');
    }
  };

  const handleCancel = (appointmentId: string, name: string) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel appointment for ${name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync({
                appointmentId,
                reason: 'Cancelled by front desk reception',
              });
              Alert.alert('Cancelled', 'Appointment has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Could not cancel.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'WAITING':
        return { label: 'Waiting', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
      case 'CHECKED_IN':
        return { label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'IN_CONSULTATION':
        return { label: 'In Room', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'COMPLETED':
        return { label: 'Completed', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
      case 'ABSENT':
        return { label: 'Absent', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
      default:
        return { label: status, color: Colors.light.ink700, bg: Colors.light.surface100, border: Colors.light.surface200 };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Header matching Webapp */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Appointments</Text>
            <Text style={styles.headerSubtitle}>
              Appointments at your clinic for your assigned doctors — filter by doctor, status, or date.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            disabled={isFetching}
          >
            <Icon name="refresh-cw" size={14} color={Colors.light.primary} />
            <Text style={styles.refreshBtnText}>
              {isFetching ? 'Syncing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Section */}
        <View style={styles.filterCard}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <Icon name="search" size={15} color={Colors.light.ink400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by patient name, phone, token..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.ink400}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={14} color={Colors.light.ink400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Selector Row */}
          <View style={styles.dateSelectorRow}>
            {(['today', 'tomorrow', 'all', 'custom'] as const).map((m) => {
              const isSel = dateMode === m;
              const labels = { today: 'Today', tomorrow: 'Tomorrow', all: 'All Dates', custom: 'Pick Date' };
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.datePill, isSel && styles.datePillActive]}
                  onPress={() => setDateMode(m)}
                >
                  <Text style={[styles.datePillText, isSel && styles.datePillTextActive]}>
                    {labels[m]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {dateMode === 'custom' && (
            <View style={styles.customDateRow}>
              <Text style={styles.customDateLabel}>Filter Date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.customDateInput}
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          )}

          {/* Doctor Filter Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, selectedDoctorId === 'ALL' && styles.chipActive]}
              onPress={() => setSelectedDoctorId('ALL')}
            >
              <Text style={[styles.chipText, selectedDoctorId === 'ALL' && styles.chipTextActive]}>
                All Doctors
              </Text>
            </TouchableOpacity>

            {doctors.map((d) => {
              const isSel = selectedDoctorId === d.id;
              const name = d.user?.name || 'Doctor';
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.chip, isSel && styles.chipActive]}
                  onPress={() => setSelectedDoctorId(d.id)}
                >
                  <Icon
                    name="stethoscope"
                    size={12}
                    color={isSel ? '#FFFFFF' : Colors.light.primary}
                  />
                  <Text
                    style={[styles.chipText, isSel && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    Dr. {name.replace(/^dr\.?\s*/i, '')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Status Filter Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {STATUS_FILTERS.map((sf) => {
              const isSel = selectedStatus === sf.key;
              return (
                <TouchableOpacity
                  key={sf.key}
                  style={[
                    styles.statusChip,
                    isSel && styles.statusChipActive,
                    { borderColor: isSel ? Colors.light.primary : '#E2E8F0' },
                  ]}
                  onPress={() => setSelectedStatus(sf.key)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      isSel ? { color: '#FFFFFF' } : { color: sf.color },
                    ]}
                  >
                    {sf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Appointments List */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerBoxText}>Loading appointments...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar-x" size={32} color={Colors.light.ink400} />
            <Text style={styles.emptyTitle}>No appointments match these filters</Text>
            <Text style={styles.emptySubtitle}>
              Try changing doctor, status filter or selecting another date.
            </Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            <Text style={styles.resultsCount}>
              Showing {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? '' : 's'}
            </Text>

            {filteredAppointments.map((appt: Appointment) => {
              const patientName = appt.patient?.user?.name || appt.patient?.name || 'Walk-in Patient';
              const patientPhone = appt.patient?.user?.phone || '';
              const doctorName = appt.doctor?.user?.name || 'Doctor';
              const badge = getStatusBadge(appt.status);

              return (
                <View key={appt.id} style={styles.appointmentCard}>
                  {/* Top Bar: Token & Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.tokenBox}>
                      <Icon name="award" size={13} color={Colors.light.primary} />
                      <Text style={styles.tokenText}>#{appt.token}</Text>
                    </View>

                    <Text style={styles.dateBadgeText}>
                      {new Date(appt.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>

                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Text style={[styles.statusPillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Patient Info */}
                  <View style={styles.patientBox}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    {patientPhone ? (
                      <TouchableOpacity
                        style={styles.phoneRow}
                        onPress={() => Linking.openURL(`tel:${patientPhone}`)}
                      >
                        <Icon name="phone" size={11} color={Colors.light.primary} />
                        <Text style={styles.phoneText}>{patientPhone}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Doctor & Queue Info */}
                  <View style={styles.metaRow}>
                    <View style={styles.docRow}>
                      <Icon name="stethoscope" size={12} color="#0D9488" />
                      <Text style={styles.doctorName}>
                        Dr. {doctorName.replace(/^dr\.?\s*/i, '')}
                      </Text>
                    </View>

                    {appt.queue?.currentToken != null && (
                      <View style={styles.queueServingBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.queueServingText}>
                          Serving #{appt.queue.currentToken}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    {appt.status === 'WAITING' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.checkInBtn]}
                          onPress={() => handleCheckIn(appt.id)}
                        >
                          <Icon name="check-circle" size={12} color="#1D4ED8" />
                          <Text style={styles.checkInBtnText}>Check In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.callBtn]}
                          onPress={() => handleStartConsultation(appt.id)}
                        >
                          <Icon name="activity" size={12} color="#6D28D9" />
                          <Text style={styles.callBtnText}>Call In</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {appt.status === 'CHECKED_IN' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.callBtn]}
                        onPress={() => handleStartConsultation(appt.id)}
                      >
                        <Icon name="activity" size={12} color="#6D28D9" />
                        <Text style={styles.callBtnText}>Start Consultation</Text>
                      </TouchableOpacity>
                    )}

                    {(appt.status === 'CHECKED_IN' || appt.status === 'IN_CONSULTATION') && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.completeBtn]}
                        onPress={() => handleMarkCompleted(appt.id)}
                      >
                        <Icon name="check" size={12} color="#047857" />
                        <Text style={styles.completeBtnText}>Done</Text>
                      </TouchableOpacity>
                    )}

                    {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleCancel(appt.id, patientName)}
                      >
                        <Icon name="x" size={11} color="#DC2626" />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
    gap: Spacing.two,
    ...Shadows.sm,
  },
  headerLeft: {
    gap: 3,
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 2,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  filterCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.ink900,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  datePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  datePillActive: {
    backgroundColor: Colors.light.primary,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  datePillTextActive: {
    color: '#FFFFFF',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDateLabel: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  customDateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  statusChipActive: {
    backgroundColor: Colors.light.primary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  centerBoxText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  emptyCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink800,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  listSection: {
    gap: Spacing.two,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink500,
    paddingHorizontal: 2,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tokenText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  patientBox: {
    gap: 2,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 6,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doctorName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  queueServingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  queueServingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  checkInBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  callBtn: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  completeBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
