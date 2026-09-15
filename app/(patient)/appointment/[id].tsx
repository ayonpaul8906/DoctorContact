import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyAppointments } from '../../../hooks/usePatient';
import { useAppointmentRealtime } from '../../../hooks/useAppointmentRealtime';
import {
  GradientCard,
  StatusBadge,
  LiveQueueTracker,
  Icon,
} from '../../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Realtime Socket Listener
  const { isConnected } = useAppointmentRealtime();

  // Appointments Query
  const {
    data: appointments,
    isLoading,
    isRefetching,
    refetch,
  } = useMyAppointments();

  const appointment = appointments?.find((a) => a.id === id);

  const formattedDate = appointment?.date
    ? new Date(appointment.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const formattedTime = appointment?.date
    ? new Date(appointment.date).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const doctorName = appointment?.doctor?.user?.name || 'Healthcare Professional';
  const clinicName = appointment?.clinic?.clinicName || 'Dewasi Healthcare Clinic';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <Text style={styles.headerSubtitle}>
            Live queue tracker & token status
          </Text>
        </View>

        {appointment ? <StatusBadge status={appointment.status} /> : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading appointment details...</Text>
          </View>
        )}

        {/* Not Found State */}
        {!isLoading && !appointment && (
          <View style={styles.notFoundCard}>
            <Icon name="alert-circle" size={32} color={Colors.light.danger} />
            <Text style={styles.notFoundTitle}>Appointment Not Found</Text>
            <Text style={styles.notFoundSubtitle}>
              This appointment could not be retrieved. It may have been removed or updated.
            </Text>
            <TouchableOpacity
              style={styles.backToDashboardBtn}
              onPress={() => router.replace('/(patient)')}
              activeOpacity={0.85}
            >
              <Text style={styles.backToDashboardBtnText}>
                Back to Appointments
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Appointment Content */}
        {!isLoading && appointment && (
          <>
            {/* Live Realtime Queue Tracker */}
            <LiveQueueTracker
              appointment={appointment}
              isConnected={isConnected}
            />

            {/* Doctor & Clinic Card */}
            <GradientCard variant="blue" style={styles.sectionCard}>
              <View style={styles.cardPadding}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconBox}>
                    <Icon name="stethoscope" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>Doctor & Clinic</Text>
                </View>

                <View style={styles.doctorInfoRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{getInitials(doctorName)}</Text>
                  </View>

                  <View style={styles.doctorDetails}>
                    <View style={styles.docNameRow}>
                      <Text style={styles.doctorNameText} numberOfLines={1}>
                        {doctorName}
                      </Text>
                      <Icon name="check-circle" size={14} color={Colors.light.primary} />
                    </View>
                    <Text style={styles.specialtyText}>Specialist Physician</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Clinic Row */}
                <View style={styles.clinicRow}>
                  <View style={styles.clinicIconBox}>
                    <Icon name="building" size={14} color={Colors.light.primary} />
                  </View>
                  <View style={styles.clinicTextGroup}>
                    <Text style={styles.clinicNameText}>{clinicName}</Text>
                    <Text style={styles.clinicAddressText}>
                      Dewasi Group Healthcare Center
                    </Text>
                  </View>
                </View>
              </View>
            </GradientCard>

            {/* Schedule & Information */}
            <GradientCard variant="green" style={styles.sectionCard}>
              <View style={styles.cardPadding}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#059669' }]}>
                    <Icon name="calendar" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>Consultation Schedule</Text>
                </View>

                <View style={styles.scheduleGrid}>
                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Date</Text>
                    <Text style={styles.scheduleValue}>{formattedDate}</Text>
                  </View>

                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Time</Text>
                    <Text style={[styles.scheduleValue, styles.highlightValue]}>
                      {formattedTime}
                    </Text>
                  </View>

                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Queue Mode</Text>
                    <Text style={styles.scheduleValue}>
                      {appointment.queueMode === 'PRIVATE'
                        ? 'Private Queue'
                        : 'Live Digital Queue'}
                    </Text>
                  </View>

                  <View style={styles.scheduleItem}>
                    <Text style={styles.scheduleLabel}>Appointment ID</Text>
                    <Text style={[styles.scheduleValue, styles.codeValue]}>
                      {appointment.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </GradientCard>

            {/* Reception Desk Assistance Notice */}
            <View style={styles.assistanceBox}>
              <Icon name="phone" size={15} color={Colors.light.primary} />
              <Text style={styles.assistanceText}>
                Need assistance? Please present Token #{appointment.token} at the clinic reception desk upon arrival.
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  loadingContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  notFoundCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.six,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  notFoundTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  notFoundSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  backToDashboardBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  backToDashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    marginBottom: 0,
  },
  cardPadding: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorDetails: {
    flex: 1,
    gap: 2,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.surface200,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  clinicIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  clinicTextGroup: {
    flex: 1,
    gap: 2,
  },
  clinicNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  clinicAddressText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  scheduleGrid: {
    gap: Spacing.two,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    maxWidth: '65%',
    textAlign: 'right',
  },
  highlightValue: {
    color: Colors.light.primary,
  },
  codeValue: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Colors.light.ink600,
  },
  assistanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 2,
  },
  assistanceText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
    lineHeight: 15,
  },
});
