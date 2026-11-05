import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { getImageUrl } from '../../utils/image';
import {
  useClinicProfile,
  useClinicDoctors,
  useClinicReceptionists,
  useDailyDashboard,
  useWorkingHours,
  useHolidays,
  useClinicReceivedRequests,
  useClinicUnreadNotificationCount,
} from '../../hooks/useClinic';
import { useSentReferrals } from '../../hooks/useDoctor';
import {
  GradientCard,
  StatCard,
  Icon,
  IconName,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const DAYS_ORDER = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export default function ClinicDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: unreadNotifications = 0 } = useClinicUnreadNotificationCount();

  const {
    data: clinic,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useClinicProfile();

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
  } = useClinicDoctors();

  const {
    data: receptionists = [],
    isLoading: loadingReceptionists,
    refetch: refetchReceptionists,
  } = useClinicReceptionists();

  const {
    data: dailyDashboard,
    isLoading: loadingDashboard,
    refetch: refetchDashboard,
    isRefetching: refetchingDashboard,
  } = useDailyDashboard();

  const {
    data: workingHours = [],
    isLoading: loadingHours,
    refetch: refetchHours,
  } = useWorkingHours();

  const {
    data: holidays = [],
    isLoading: loadingHolidays,
    refetch: refetchHolidays,
  } = useHolidays();

  const {
    data: requests = [],
    isLoading: loadingRequests,
    refetch: refetchRequests,
  } = useClinicReceivedRequests();

  const {
    data: referrals = [],
    isLoading: loadingReferrals,
    refetch: refetchReferrals,
  } = useSentReferrals();

  const handleRefreshAll = () => {
    refetchProfile();
    refetchDoctors();
    refetchReceptionists();
    refetchDashboard();
    refetchHours();
    refetchHolidays();
    refetchRequests();
    refetchReferrals();
  };

  const isLoading =
    loadingProfile ||
    loadingDoctors ||
    loadingReceptionists ||
    loadingDashboard ||
    loadingHours ||
    loadingHolidays ||
    loadingRequests ||
    loadingReferrals;

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const clinicDisplayName = clinic?.clinicName || user?.name || 'Clinic Admin';

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status?.toUpperCase() === 'PENDING');
  }, [requests]);

  const activeDoctorsCount = doctors.filter((d) => d.user?.isActive !== false).length;
  const activeReceptionistsCount = receptionists.filter((r) => r.user?.isActive !== false).length;

  const totalPatients = dailyDashboard?.totalPatients ?? 0;
  const totalAppointments = dailyDashboard?.totalAppointments ?? 0;
  const newPatients = dailyDashboard?.newPatients ?? 0;
  const statusBreakdown = dailyDashboard?.statusBreakdown ?? {};
  const queueSummary = dailyDashboard?.queueSummary || [];

  const waitingCount = useMemo(() => {
    if (statusBreakdown.WAITING != null) {
      return statusBreakdown.WAITING;
    }
    return queueSummary.reduce((acc, curr) => {
      return acc + Math.max(0, (curr.lastTokenIssued || 0) - (curr.currentToken || 0));
    }, 0);
  }, [statusBreakdown, queueSummary]);

  const completedCount = statusBreakdown.COMPLETED ?? 0;
  const checkedInCount = statusBreakdown.CHECKED_IN ?? 0;
  const cancelledCount = statusBreakdown.CANCELLED ?? 0;
  const absentCount = statusBreakdown.ABSENT ?? 0;
  const upcomingCount = checkedInCount + waitingCount;

  // Today's schedule
  const todayDayName = DAYS_ORDER[new Date().getDay()];
  const todaySchedule = workingHours.find((wh) => wh.dayOfWeek === todayDayName);

  // Next holiday
  const nextHoliday = useMemo(() => {
    if (!holidays || holidays.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return holidays
      .filter((h) => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [holidays]);

  // Appointment distribution calculation
  const totalForDistribution = completedCount + upcomingCount + pendingRequests.length + cancelledCount;
  const completedPct = totalForDistribution > 0 ? (completedCount / totalForDistribution) * 100 : 0;
  const upcomingPct = totalForDistribution > 0 ? (upcomingCount / totalForDistribution) * 100 : 0;
  const pendingPct = totalForDistribution > 0 ? (pendingRequests.length / totalForDistribution) * 100 : 0;
  const cancelledPct = totalForDistribution > 0 ? (cancelledCount / totalForDistribution) * 100 : 0;

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refetchingDashboard}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* =======================================================
            1. HEADER / WELCOME CARD - Gradient Blue
        ======================================================== */}
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View style={styles.greetingCol}>
                <View style={styles.portalTagRow}>
                  <View style={styles.clinicLogoBox}>
                    {clinic?.logo ? (
                      <Image
                        source={{ uri: getImageUrl(clinic.logo) }}
                        style={styles.clinicLogoImg}
                      />
                    ) : (
                      <Icon name="building" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.portalTagText}>CLINIC PORTAL</Text>

                  {clinic?.isApproved !== false ? (
                    <View style={styles.verifiedBadge}>
                      <Icon name="check-circle" size={11} color="#047857" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Icon name="clock" size={11} color="#B45309" />
                      <Text style={styles.pendingText}>Pending Approval</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.greetingHeading} numberOfLines={1}>
                  {greeting}, {clinicDisplayName}
                </Text>
                <Text style={styles.greetingSubtitle} numberOfLines={1}>
                  {clinic?.clinicName ? `${clinic.clinicName} · ` : ''}
                  Clinic Operations & Daily Activity Overview
                </Text>
              </View>

              <View style={styles.headerActionsCol}>
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => router.push('/(clinic)/notifications')}
                  activeOpacity={0.8}
                >
                  <Icon name="bell" size={18} color={Colors.light.ink800} />
                  {unreadNotifications > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.datePill}>
                  <Icon name="calendar" size={12} color={Colors.light.primary} />
                  <Text style={styles.datePillText}>{todayFormatted}</Text>
                </View>
              </View>
            </View>
          </View>
        </GradientCard>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Synchronizing clinic ecosystem...</Text>
          </View>
        ) : (
          <>
            {/* =======================================================
                2. 2x2 PRIMARY KPI CARDS - Multi-stop Gradients
            ======================================================== */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiRow}>
                <StatCard
                  variant="blueLight"
                  label="Today's Appointments"
                  value={totalAppointments}
                  subtitle={`${waitingCount} waiting in queue`}
                  iconName="calendar"
                  onPress={() => router.push('/(clinic)/services?tab=reports')}
                />
                <StatCard
                  variant="indigo"
                  label="Active Doctors"
                  value={doctors.length}
                  subtitle={`${activeDoctorsCount} active & available`}
                  iconName="stethoscope"
                  onPress={() => router.push('/(clinic)/management?tab=queue')}
                />
              </View>

              <View style={styles.kpiRow}>
                <StatCard
                  variant="purple"
                  label="Reception Staff"
                  value={receptionists.length}
                  subtitle={`${activeReceptionistsCount} front desk`}
                  iconName="users"
                  onPress={() => router.push('/(clinic)/overview?tab=receptionists')}
                />
                <StatCard
                  variant="green"
                  label="Total Patients"
                  value={totalPatients}
                  subtitle={`+${newPatients} new today`}
                  iconName="user-check"
                />
              </View>
            </View>

            {/* =======================================================
                3. TODAY'S APPOINTMENTS QUEUE SUMMARY - Gradient Blue
            ======================================================== */}
            <GradientCard variant="blue" style={styles.sectionCard}>
              <View style={styles.sectionPadding}>
                {/* Header */}
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionCardTitle}>Today's Appointments</Text>
                    <Text style={styles.sectionCardSubtitle}>
                      Queue Overview
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(clinic)/management?tab=requests')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewAllBtnText}>View All</Text>
                    <Icon name="arrow-right" size={13} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>

                {/* 5-Status Strip */}
                <View style={styles.statusStrip}>
                  <StatusPill
                    label="Waiting"
                    count={waitingCount}
                    icon="clock"
                    color="#B45309"
                    bgColor="#FEF3C7"
                    borderColor="#FDE68A"
                  />
                  <StatusPill
                    label="Checked In"
                    count={checkedInCount}
                    icon="user-check"
                    color="#1D4ED8"
                    bgColor="#EFF6FF"
                    borderColor="#BFDBFE"
                  />
                  <StatusPill
                    label="Completed"
                    count={completedCount}
                    icon="check-circle"
                    color="#047857"
                    bgColor="#ECFDF5"
                    borderColor="#A7F3D0"
                  />
                  <StatusPill
                    label="Cancelled"
                    count={cancelledCount}
                    icon="x-circle"
                    color="#BE123C"
                    bgColor="#FFF1F2"
                    borderColor="#FECDD3"
                  />
                  <StatusPill
                    label="Absent"
                    count={absentCount}
                    icon="user-x"
                    color="#4B5563"
                    bgColor="#F3F4F6"
                    borderColor="#E5E7EB"
                  />
                </View>

                {/* Queue Summary Rows */}
                {queueSummary.length === 0 ? (
                  <View style={styles.emptyQueueBox}>
                    <Icon name="list-ordered" size={24} color={Colors.light.ink400} />
                    <Text style={styles.emptyQueueText}>
                      No active appointments queued for today.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyQueueBtn}
                      onPress={() => router.push('/(clinic)/management?tab=requests')}
                      activeOpacity={0.85}
                    >
                      <Icon name="plus" size={13} color="#FFFFFF" />
                      <Text style={styles.emptyQueueBtnText}>View Requests</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.queueList}>
                    {queueSummary.slice(0, 3).map((item, index) => (
                      <View key={item.doctorId || index} style={styles.queueItemRow}>
                        <View style={styles.queueItemLeft}>
                          <View style={styles.tokenBox}>
                            <Text style={styles.tokenBoxText}>#{item.currentToken || 0}</Text>
                          </View>
                          <View style={styles.queueItemDoctorInfo}>
                            <Text style={styles.queueItemDoctorName} numberOfLines={1}>
                              Dr. {item.doctorName}
                            </Text>
                            <Text style={styles.queueItemTokenMeta}>
                              Token #{item.currentToken || 0} of {item.lastTokenIssued || 0}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.queueStatusBadge}>
                          <Text style={styles.queueStatusBadgeText}>
                            {item.status || 'Active'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GradientCard>

            {/* =======================================================
                4. APPOINTMENT OVERVIEW & DISTRIBUTION - Gradient Cyan
            ======================================================== */}
            <GradientCard variant="cyan" style={styles.sectionCard}>
              <View style={styles.sectionPadding}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionCardTitle}>Appointment Overview</Text>
                    <Text style={styles.sectionCardSubtitle}>
                      Status breakdown of appointments today
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(clinic)/services?tab=reports')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewAllBtnText}>View Reports</Text>
                    <Icon name="arrow-right" size={13} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>

                {totalForDistribution === 0 ? (
                  <View style={styles.emptyDistBox}>
                    <Icon name="pie-chart" size={24} color={Colors.light.ink400} />
                    <Text style={styles.emptyQueueText}>
                      No appointment data today
                    </Text>
                    <Text style={styles.emptyDistSub}>
                      Appointments scheduled today will appear here automatically.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.distributionContainer}>
                    {/* Proportional Segment Bar */}
                    <View style={styles.segmentBar}>
                      {completedPct > 0 && (
                        <View
                          style={[
                            styles.segmentSlice,
                            { width: `${completedPct}%`, backgroundColor: '#10B981' },
                          ]}
                        />
                      )}
                      {upcomingPct > 0 && (
                        <View
                          style={[
                            styles.segmentSlice,
                            { width: `${upcomingPct}%`, backgroundColor: '#2563EB' },
                          ]}
                        />
                      )}
                      {pendingPct > 0 && (
                        <View
                          style={[
                            styles.segmentSlice,
                            { width: `${pendingPct}%`, backgroundColor: '#F59E0B' },
                          ]}
                        />
                      )}
                      {cancelledPct > 0 && (
                        <View
                          style={[
                            styles.segmentSlice,
                            { width: `${cancelledPct}%`, backgroundColor: '#E11D48' },
                          ]}
                        />
                      )}
                    </View>

                    {/* Breakdown Badges Grid */}
                    <View style={styles.distLegendGrid}>
                      <View style={styles.distLegendItem}>
                        <View style={[styles.distDot, { backgroundColor: '#10B981' }]} />
                        <View style={styles.distTextGroup}>
                          <Text style={styles.distLabel}>Completed</Text>
                          <Text style={styles.distValue}>
                            {completedCount}{' '}
                            <Text style={styles.distPct}>({completedPct.toFixed(1)}%)</Text>
                          </Text>
                        </View>
                      </View>

                      <View style={styles.distLegendItem}>
                        <View style={[styles.distDot, { backgroundColor: '#2563EB' }]} />
                        <View style={styles.distTextGroup}>
                          <Text style={styles.distLabel}>Upcoming</Text>
                          <Text style={styles.distValue}>
                            {upcomingCount}{' '}
                            <Text style={styles.distPct}>({upcomingPct.toFixed(1)}%)</Text>
                          </Text>
                        </View>
                      </View>

                      <View style={styles.distLegendItem}>
                        <View style={[styles.distDot, { backgroundColor: '#F59E0B' }]} />
                        <View style={styles.distTextGroup}>
                          <Text style={styles.distLabel}>Pending</Text>
                          <Text style={styles.distValue}>
                            {pendingRequests.length}{' '}
                            <Text style={styles.distPct}>({pendingPct.toFixed(1)}%)</Text>
                          </Text>
                        </View>
                      </View>

                      <View style={styles.distLegendItem}>
                        <View style={[styles.distDot, { backgroundColor: '#E11D48' }]} />
                        <View style={styles.distTextGroup}>
                          <Text style={styles.distLabel}>Cancelled</Text>
                          <Text style={styles.distValue}>
                            {cancelledCount}{' '}
                            <Text style={styles.distPct}>({cancelledPct.toFixed(1)}%)</Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </GradientCard>

            {/* =======================================================
                5. DIRECT MANAGEMENT SHORTCUTS - Gradient Pink
            ======================================================== */}
            <GradientCard variant="pink" style={styles.sectionCard}>
              <View style={styles.sectionPadding}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionCardTitle}>Quick Actions</Text>
                    <Text style={styles.sectionCardSubtitle}>
                      Direct management shortcuts
                    </Text>
                  </View>
                </View>

                <View style={styles.shortcutsList}>
                  <ShortcutItem
                    title="View Requests"
                    subtitle="Doctor association requests awaiting approval"
                    iconName="inbox"
                    iconBg="#EFF6FF"
                    iconColor="#2563EB"
                    badge={pendingRequests.length > 0 ? 'Requests' : undefined}
                    onPress={() => router.push('/(clinic)/management?tab=requests')}
                  />
                  <ShortcutItem
                    title="Add Doctor"
                    subtitle="Add new physician and initial schedule"
                    iconName="stethoscope"
                    iconBg="#FAF5FF"
                    iconColor="#7C3AED"
                    onPress={() =>
                      router.push({
                        pathname: '/(clinic)/overview',
                        params: { tab: 'doctors', action: 'add' },
                      })
                    }
                  />
                  <ShortcutItem
                    title="Add Receptionist"
                    subtitle="Register front desk staff account"
                    iconName="users"
                    iconBg="#F0FDF4"
                    iconColor="#16A34A"
                    onPress={() =>
                      router.push({
                        pathname: '/(clinic)/overview',
                        params: { tab: 'receptionists', action: 'add' },
                      })
                    }
                  />
                  <ShortcutItem
                    title="Create Referral"
                    subtitle="Order diagnostic lab test for patients"
                    iconName="flask"
                    iconBg="#FFF1F2"
                    iconColor="#E11D48"
                    onPress={() =>
                      router.push({
                        pathname: '/(clinic)/services',
                        params: { tab: 'referrals', action: 'create' },
                      })
                    }
                  />
                  <ShortcutItem
                    title="Manage Schedule"
                    subtitle="Weekly operating hours & holidays"
                    iconName="calendar-days"
                    iconBg="#FFFBEB"
                    iconColor="#D97706"
                    onPress={() => router.push('/(clinic)/management?tab=schedule')}
                  />
                  <ShortcutItem
                    title="View Reports"
                    subtitle="Doctor & clinic revenue and volume reports"
                    iconName="bar-chart-2"
                    iconBg="#ECFDF5"
                    iconColor="#059669"
                    onPress={() => router.push('/(clinic)/services?tab=reports')}
                  />
                  <ShortcutItem
                    title="Analytics Snapshot"
                    subtitle="Clinic activity and performance overview"
                    iconName="building"
                    iconBg="#EFF6FF"
                    iconColor="#1B3A8C"
                    onPress={() => router.push('/(clinic)')}
                  />
                </View>
              </View>
            </GradientCard>

            {/* =======================================================
                6. OPERATING STATUS & SCHEDULE SNAPSHOT - Gradient Teal
            ======================================================== */}
            <GradientCard variant="teal" style={styles.sectionCard}>
              <View style={styles.sectionPadding}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionCardTitle}>Operating Hours</Text>
                    <Text style={styles.sectionCardSubtitle}>
                      Today's Status & Next Holiday
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(clinic)/management?tab=schedule')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewAllBtnText}>Edit Hours</Text>
                    <Icon name="arrow-right" size={13} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.scheduleRowContainer}>
                  {/* Today status */}
                  <View style={styles.scheduleBox}>
                    <View style={styles.scheduleBoxTop}>
                      <Text style={styles.scheduleBoxTitle}>Today's Status</Text>
                      <View
                        style={[
                          styles.openClosedBadge,
                          {
                            backgroundColor:
                              todaySchedule && !todaySchedule.isClosed ? '#ECFDF5' : '#FEF2F2',
                            borderColor:
                              todaySchedule && !todaySchedule.isClosed ? '#A7F3D0' : '#FECDD3',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.openClosedBadgeText,
                            {
                              color:
                                todaySchedule && !todaySchedule.isClosed ? '#047857' : '#DC2626',
                            },
                          ]}
                        >
                          {todaySchedule && !todaySchedule.isClosed ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.scheduleTimeText}>
                      {todaySchedule && !todaySchedule.isClosed
                        ? `Hours: ${todaySchedule.openTime || '09:00'} - ${todaySchedule.closeTime || '18:00'}`
                        : 'Practice closed today'}
                    </Text>
                  </View>

                  {/* Next holiday */}
                  <View style={styles.scheduleBox}>
                    <Text style={styles.scheduleBoxTitle}>Next Holiday</Text>
                    {nextHoliday ? (
                      <View style={styles.holidayInfoRow}>
                        <Text style={styles.holidayDateText}>{nextHoliday.date}</Text>
                        <Text style={styles.holidayReasonText} numberOfLines={1}>
                          {nextHoliday.reason || 'Closure'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noHolidayText}>No upcoming holidays scheduled.</Text>
                    )}
                  </View>
                </View>
              </View>
            </GradientCard>

            {/* =======================================================
                7. PENDING ACTIONS & ALERTS - Gradient Amber
            ======================================================== */}
            <GradientCard variant="amber" style={styles.sectionCard}>
              <View style={styles.sectionPadding}>
                <View style={styles.alertHeaderRow}>
                  <Icon name="alert-circle" size={18} color="#D97706" />
                  <Text style={styles.alertHeaderTitle}>Pending Actions & Alerts</Text>
                </View>

                {pendingRequests.length === 0 && referrals.length === 0 ? (
                  <View style={styles.allDoneRow}>
                    <Icon name="check-circle" size={16} color="#059669" />
                    <Text style={styles.allDoneText}>
                      No pending actions or critical alerts requiring attention.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.alertsList}>
                    {pendingRequests.length > 0 && (
                      <View style={styles.alertCardAmber}>
                        <View style={styles.alertCardLeft}>
                          <Text style={styles.alertCardAmberTitle}>
                            {pendingRequests.length} Pending Requests
                          </Text>
                          <Text style={styles.alertCardAmberSub}>
                            Doctor association requests awaiting approval
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.alertAmberBtn}
                          onPress={() => router.push('/(clinic)/management?tab=requests')}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.alertAmberBtnText}>View Requests</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {referrals.length > 0 && (
                      <View style={styles.alertCardBlue}>
                        <View style={styles.alertCardLeft}>
                          <Text style={styles.alertCardBlueTitle}>
                            {referrals.length} Sent Referrals
                          </Text>
                          <Text style={styles.alertCardBlueSub}>
                            Referrals sent to diagnostic centers & labs
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.alertBlueBtn}
                          onPress={() => router.push('/(clinic)/services?tab=referrals')}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.alertBlueBtnText}>View Referrals</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </GradientCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatusPill({
  label,
  count,
  icon,
  color,
  bgColor,
  borderColor,
}: {
  label: string;
  count: number;
  icon: IconName;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.statusPillBox,
        { backgroundColor: bgColor, borderColor: borderColor },
      ]}
    >
      <Icon name={icon} size={13} color={color} />
      <Text style={[styles.statusPillCount, { color }]}>{count}</Text>
      <Text style={[styles.statusPillLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ShortcutItem({
  title,
  subtitle,
  iconName,
  iconBg,
  iconColor,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  iconName: IconName;
  iconBg: string;
  iconColor: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.shortcutRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.shortcutIconWrap, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={17} color={iconColor} />
      </View>

      <View style={styles.shortcutTextGroup}>
        <Text style={styles.shortcutRowTitle}>{title}</Text>
        <Text style={styles.shortcutRowSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {badge ? (
        <View style={styles.shortcutBadge}>
          <Text style={styles.shortcutBadgeText}>{badge}</Text>
        </View>
      ) : (
        <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
      )}
    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================

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
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerContent: {
    padding: Spacing.four,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  greetingCol: {
    flex: 1,
    gap: 3,
  },
  portalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clinicLogoBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  clinicLogoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: Colors.light.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  greetingHeading: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  headerActionsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    position: 'relative',
    ...Shadows.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  datePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink700,
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
  kpiGrid: {
    gap: Spacing.three,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionPadding: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  sectionCardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  sectionCardSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statusStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  statusPillBox: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  statusPillCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyQueueBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderStyle: 'dashed',
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyQueueText: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  emptyQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  emptyQueueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueList: {
    gap: Spacing.two,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  tokenBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenBoxText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  queueItemDoctorInfo: {
    flex: 1,
    gap: 1,
  },
  queueItemDoctorName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  queueItemTokenMeta: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  queueStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  queueStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  emptyDistBox: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: 6,
  },
  emptyDistSub: {
    fontSize: 11,
    color: Colors.light.ink400,
    textAlign: 'center',
  },
  distributionContainer: {
    gap: Spacing.three,
  },
  segmentBar: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface200,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentSlice: {
    height: '100%',
  },
  distLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  distLegendItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distTextGroup: {
    flex: 1,
  },
  distLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  distValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  distPct: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.ink500,
  },
  shortcutsList: {
    gap: 6,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  shortcutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shortcutTextGroup: {
    flex: 1,
    gap: 1,
  },
  shortcutRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  shortcutRowSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  shortcutBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shortcutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  scheduleRowContainer: {
    gap: Spacing.two,
  },
  scheduleBox: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 4,
  },
  scheduleBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  openClosedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  openClosedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  holidayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  holidayDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  holidayReasonText: {
    fontSize: 11,
    color: Colors.light.ink600,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  noHolidayText: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  alertHeaderTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
  },
  allDoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  alertsList: {
    gap: Spacing.two,
  },
  alertCardAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertCardAmberTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  alertCardAmberSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  alertAmberBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  alertAmberBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertCardBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  alertCardBlueTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  alertCardBlueSub: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 1,
  },
  alertBlueBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  alertBlueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertCardLeft: {
    flex: 1,
    marginRight: 8,
  },
});
