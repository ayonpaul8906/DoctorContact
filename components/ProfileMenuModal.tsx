import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { useLanguage, SUPPORTED_LOCALES, SupportedLanguage } from '../lib/language-context';
import { getDashboardRouteForRole, getRoleDisplayName } from '../lib/auth-utils';
import { Icon } from './Icon';
import { Colors } from '../theme';

export interface ProfileMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileMenuModal({ visible, onClose }: ProfileMenuModalProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('auth.logoutConfirmTitle', 'Sign Out'),
      t('auth.logoutConfirmMsg', 'Are you sure you want to sign out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('auth.logout', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            onClose();
            try {
              await logout();
            } catch {
              // Ignore network issues on logout
            }
          },
        },
      ]
    );
  };

  const handleGoToDashboard = () => {
    onClose();
    if (user) {
      router.push(getDashboardRouteForRole(user.role) as any);
    }
  };

  const handleGoToLogin = () => {
    onClose();
    router.push('/(auth)');
  };

  const handleGoToRegister = () => {
    onClose();
    router.push('/(auth)?tab=register' as any);
  };

  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              {/* Header with Close */}
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>
                  {isAuthenticated ? t('common.profile', 'Account') : t('common.welcome', 'Welcome')}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close"
                >
                  <Icon name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* User Info or Guest Prompt */}
              {isAuthenticated && user ? (
                <View style={styles.userInfoBox}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userInitial}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name || 'User'}
                      </Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {getRoleDisplayName(user.role)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.userSub} numberOfLines={1}>
                      {user.email || user.phone || ''}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.guestInfoBox}>
                  <View style={styles.guestAvatar}>
                    <Icon name="user" size={20} color="#1B3A8C" />
                  </View>
                  <View style={styles.guestDetails}>
                    <Text style={styles.guestTitle}>Doctor Contact</Text>
                    <Text style={styles.guestSub}>
                      {t('auth.guestSub', 'Sign in to access your appointments and live token status')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons: Dashboard (if logged in) or Login/Register (if guest) */}
              {isAuthenticated && user ? (
                <TouchableOpacity
                  style={styles.dashboardActionBtn}
                  onPress={handleGoToDashboard}
                  activeOpacity={0.85}
                >
                  <View style={styles.dashboardIconWrap}>
                    <Icon name="layout-dashboard" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.dashboardTextWrap}>
                    <Text style={styles.dashboardActionText}>
                      {t('common.dashboard', 'Go to Dashboard')}
                    </Text>
                    <Text style={styles.dashboardActionSub}>
                      {t('auth.accessPortal', 'Access role portal & controls')}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <View style={styles.authRow}>
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleGoToLogin}
                    activeOpacity={0.85}
                  >
                    <Icon name="log-in" size={14} color="#FFFFFF" />
                    <Text style={styles.loginBtnText}>{t('common.login', 'Login')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={handleGoToRegister}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.registerBtnText}>{t('common.register', 'Sign Up')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.divider} />

              {/* Language Selection */}
              <View style={styles.languageSection}>
                <View style={styles.languageSectionTitleRow}>
                  <Icon name="globe" size={15} color={Colors.light.primary} />
                  <Text style={styles.languageSectionTitle}>
                    {t('common.language', 'Language')} / ভাষা / भाषा
                  </Text>
                </View>

                <View style={styles.languageGrid}>
                  {SUPPORTED_LOCALES.map((loc) => {
                    const isActive = language === loc.code;
                    return (
                      <TouchableOpacity
                        key={loc.code}
                        style={[
                          styles.languageItem,
                          isActive && styles.languageItemActive,
                        ]}
                        onPress={() => setLanguage(loc.code as SupportedLanguage)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.languageItemText,
                            isActive && styles.languageItemTextActive,
                          ]}
                        >
                          {loc.nativeName}
                        </Text>
                        {isActive && (
                          <View style={styles.activeCheck}>
                            <Icon name="check" size={11} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Logout Button (if authenticated) */}
              {isAuthenticated && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                  >
                    <Icon name="log-out" size={16} color="#DC2626" />
                    <Text style={styles.logoutBtnText}>
                      {t('common.logout', 'Sign Out')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingRight: 14,
    paddingLeft: 14,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  userInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1B3A8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  userSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  guestInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    marginBottom: 12,
  },
  guestAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  guestDetails: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  guestSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  dashboardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dashboardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1B3A8C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dashboardTextWrap: {
    flex: 1,
  },
  dashboardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dashboardActionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  authRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1B3A8C',
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  languageSection: {
    paddingTop: 2,
  },
  languageSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  languageSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  languageGrid: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
  },
  languageItemActive: {
    backgroundColor: '#1B3A8C',
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  languageItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  languageItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeCheck: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
