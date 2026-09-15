import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import { useAuth } from '../../lib/auth-context';

export default function SuperAdminSettingsScreen() {
  const { logout } = useAuth();

  const [platformActive, setPlatformActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Platform Settings"
          subtitle="System flags, environment status & feature toggles"
          badgeText="Super Admin"
        />

        {/* Section 1: System Health & Maintenance */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>System Status</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Live Healthcare Gateway</Text>
              <Text style={styles.settingDesc}>
                Accept incoming patient bookings and doctor queue sync
              </Text>
            </View>
            <Switch
              value={platformActive}
              onValueChange={setPlatformActive}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={platformActive ? '#D97706' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>
                Temporarily pause new registrations for scheduled maintenance
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: '#CBD5E1', true: '#FECACA' }}
              thumbColor={maintenanceMode ? '#DC2626' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Section 2: Registration & Users */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Registrations & Verification</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Open Public Sign-Up</Text>
              <Text style={styles.settingDesc}>
                Allow new patients and clinics to register accounts
              </Text>
            </View>
            <Switch
              value={allowRegistration}
              onValueChange={setAllowRegistration}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={allowRegistration ? '#D97706' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Section 3: Notification Channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Alert Pipelines</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>SMS Token Dispatch</Text>
              <Text style={styles.settingDesc}>
                Send real-time token alerts via Twilio/Fast2SMS
              </Text>
            </View>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={smsNotifications ? '#D97706' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Email Receipts & Digests</Text>
              <Text style={styles.settingDesc}>
                Deliver appointment confirmations and invoices
              </Text>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={emailAlerts ? '#D97706' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Section 4: System Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Deployment Metadata</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>v2.4.0-native</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Environment</Text>
            <Text style={styles.infoValue}>Production (PostgreSQL)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Realtime Gateway</Text>
            <Text style={styles.infoValue}>Socket.IO Operational</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout()}
          activeOpacity={0.8}
        >
          <Icon name="log-out" size={16} color={Colors.light.danger} />
          <Text style={styles.logoutBtnText}>Sign Out of Super Admin Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFBFC',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 80,
    gap: Spacing.three,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.danger,
  },
});
