import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { Icon } from './Icon';
import { RoleBadge } from './RoleBadge';
import { useAuth } from '../lib/auth-context';
import type { Role } from '../types';

interface AuthenticatedPlaceholderProps {
  portalTitle: string;
  portalSubtitle: string;
  expectedRole: Role;
  iconName?: 'user' | 'stethoscope' | 'building' | 'shield' | 'pulse';
}

export function AuthenticatedPlaceholder({
  portalTitle,
  portalSubtitle,
  expectedRole,
  iconName = 'user',
}: AuthenticatedPlaceholderProps) {
  const router = useRouter();
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)');
    } catch {
      router.replace('/(auth)');
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Verifying session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/logo-icon.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>Dewasi Group</Text>
              <Text style={styles.brandSubtitle}>Healthcare Management</Text>
            </View>
          </View>
          <View style={styles.verifiedPill}>
            <Icon name="check-circle" size={13} color="#059669" />
            <Text style={styles.verifiedText}>Auth Verified</Text>
          </View>
        </View>

        {/* Portal Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.portalIconBox}>
              <Icon name={iconName} size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.portalTitle}>{portalTitle}</Text>
              <Text style={styles.portalSubtitle}>{portalSubtitle}</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.roleRow}>
            <Text style={styles.roleLabel}>Assigned Role:</Text>
            <RoleBadge role={user.role} size="md" />
          </View>
        </View>

        {/* User Profile Summary Card */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionHeading}>Authenticated User Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{user.name || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user.email || 'N/A'}</Text>
          </View>

          {user.phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{user.phone}</Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User ID</Text>
            <Text style={[styles.detailValue, styles.monospace]}>{user.id || 'N/A'}</Text>
          </View>
        </View>

        {/* Phase Verification Notice */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Icon name="shield-check" size={18} color="#2563EB" />
            <Text style={styles.noticeTitle}>Phase 1 Milestone Complete</Text>
          </View>
          <Text style={styles.noticeBody}>
            Authentication, session persistence via SecureStore, token auto-refresh, and role-based routing have been verified for this account.
          </Text>
          <Text style={styles.noticeFootnote}>
            Feature dashboards and operational modules will be constructed in Phase 2.
          </Text>
        </View>

        {/* Sign Out Action Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <View style={styles.logoutContent}>
              <ActivityIndicator size="small" color="#DC2626" />
              <Text style={styles.logoutText}>Signing out...</Text>
            </View>
          ) : (
            <View style={styles.logoutContent}>
              <Icon name="log-out" size={18} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out of Session</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSoft,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  heroCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  portalIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroTitleGroup: {
    flex: 1,
  },
  portalTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  portalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.light.surface200,
    marginVertical: Spacing.three,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.ink600,
  },
  profileCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  monospace: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.light.ink600,
  },
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  noticeBody: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  noticeFootnote: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});
