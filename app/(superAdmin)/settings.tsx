import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
} from '../../hooks/useAdmin';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function SuperAdminSettingsScreen() {
  const { user, logout } = useAuth();
  const { data: settings, isLoading, refetch, isRefetching } = usePlatformSettings();
  const updateSettingsMutation = useUpdatePlatformSettings();

  const [bookingWindow, setBookingWindow] = useState<string>('30');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);

  useEffect(() => {
    if (settings?.bookingWindowMinutes !== undefined) {
      setBookingWindow(String(settings.bookingWindowMinutes));
    }
  }, [settings]);

  const handleSaveBookingWindow = async () => {
    const mins = parseInt(bookingWindow, 10);
    if (isNaN(mins) || mins < 5 || mins > 1440) {
      Alert.alert('Validation Error', 'Please enter a valid booking window between 5 and 1440 minutes.');
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        bookingWindowMinutes: mins,
      });
      Alert.alert('Success', 'Platform booking window updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update platform settings.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Super Admin command center?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Platform Settings</Text>
          <Text style={styles.subtitle}>Super Admin global parameters & gateway policies</Text>
        </View>

        {/* Section 1: Appointment & Booking Window (Real Backend API) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="clock" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Booking Window Policy</Text>
              <Text style={styles.cardSubtitle}>
                Minutes before an appointment slot when online booking closes
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={styles.loaderText}>Loading platform settings...</Text>
            </View>
          ) : (
            <View style={styles.settingBlock}>
              <Text style={styles.label}>Window Cutoff (Minutes)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={bookingWindow}
                  onChangeText={setBookingWindow}
                  placeholder="30"
                />
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveBookingWindow}
                  disabled={updateSettingsMutation.isPending}
                  activeOpacity={0.8}
                >
                  {updateSettingsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Example: 30 minutes prevents patients from booking appointments less than half an hour before the session begins.
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: Gateway & Maintenance Toggles */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="activity" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Gateway & System Flags</Text>
              <Text style={styles.cardSubtitle}>Runtime operational state controls</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Maintenance Mode</Text>
              <Text style={styles.switchDesc}>
                Temporarily pause new online appointments while platform upgrades run
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={maintenanceMode ? '#D97706' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Open Patient Self-Registration</Text>
              <Text style={styles.switchDesc}>
                Allow new patients to register accounts from the mobile app and web portal
              </Text>
            </View>
            <Switch
              value={allowRegistration}
              onValueChange={setAllowRegistration}
              trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
              thumbColor={allowRegistration ? '#16A34A' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Section 3: Super Admin Account Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="shield-check" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Active Super Admin Profile</Text>
              <Text style={styles.cardSubtitle}>Root authorization and credentials</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Signed In As:</Text>
            <Text style={styles.profileValue}>{user?.name || 'Super Administrator'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Email Address:</Text>
            <Text style={styles.profileValue}>{user?.email || 'admin@doctorcontact.in'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Security Role:</Text>
            <View style={styles.superPill}>
              <Text style={styles.superPillText}>SUPER_ADMIN</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="log-out" size={16} color="#DC2626" />
            <Text style={styles.logoutText}>Sign Out of Super Admin</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extrabold,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loaderText: {
    fontSize: 12,
    color: '#D97706',
  },
  settingBlock: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  superPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  superPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
