import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { Icon } from '../../components/Icon';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { OtpInput } from '../../components/OtpInput';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { api, setAccessToken } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { getDashboardRouteForRole } from '../../lib/auth-utils';
import type { Role, AuthUser } from '../../types';

const CLINIC_PHONE = '+91 86170 63697';
const CLINIC_WHATSAPP = '919777777777';

export default function LoginScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const { t } = useLanguage();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.replace(getDashboardRouteForRole(user.role) as any);
    }
  }, [loading, isAuthenticated, user, router]);

  // Mode: "patient" (Phone + OTP) or "staff" (Doctor / Clinic / Receptionist / Admin / Staff with Password)
  const [mode, setMode] = useState<'patient' | 'staff'>('patient');

  // Patient OTP login states
  const [patientStep, setPatientStep] = useState<'enter-phone' | 'enter-otp'>('enter-phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Staff login states
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Common error alert
  const [serverError, setServerError] = useState('');

  // 5-minute countdown timer for OTP resend cooldown
  useEffect(() => {
    let interval: any;
    if (patientStep === 'enter-otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [patientStep, timer]);

  const navigateForRole = (role: Role) => {
    switch (role) {
      case 'PATIENT':
        router.replace('/(patient)' as any);
        break;
      case 'DOCTOR':
        router.replace('/(doctor)' as any);
        break;
      case 'CLINIC':
        router.replace('/(clinic)' as any);
        break;
      case 'RECEPTIONIST':
        router.replace('/(receptionist)' as any);
        break;
      case 'DIAGNOSTIC_CENTER':
        router.replace('/(diagnosticCenter)' as any);
        break;
      case 'DIAGNOSTIC_STAFF':
        router.replace('/(diagnosticStaff)' as any);
        break;
      case 'SUPER_ADMIN':
        router.replace('/(superAdmin)' as any);
        break;
      case 'ADMIN':
        router.replace('/(admin)' as any);
        break;
      default:
        router.replace('/(main)' as any);
        break;
    }
  };

  // ================= 1. PATIENT: Send OTP =================
  const handleSendOtp = async () => {
    setServerError('');
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setServerError(
        t('auth.validPhoneRequired', 'Please enter a valid 10-digit mobile number')
      );
      return;
    }

    setIsLoadingOtp(true);
    try {
      const formatted = cleanPhone.startsWith('91') && cleanPhone.length > 10
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;

      const res = await api.post('/auth/send-otp', { phone: formatted });

      if (res.data?.data?.isNewUser) {
        // New user! Seamlessly direct to Register screen with phone prefilled
        router.push({
          pathname: '/(auth)/register',
          params: { phone: cleanPhone.slice(-10) },
        });
        return;
      }

      // Existing user -> Move to OTP entry step
      setPatientStep('enter-otp');
      setTimer(300); // 5-minute cooldown matching backend
      setOtp('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send OTP. Please try again.';
      setServerError(msg);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  // ================= 2. PATIENT: Verify OTP & Login =================
  const handleVerifyOtp = async () => {
    setServerError('');
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    if (otp.length < 6) {
      setServerError(
        t('auth.enterCompleteOtp', 'Please enter complete 6-digit OTP')
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const formatted = cleanPhone.startsWith('91') && cleanPhone.length > 10
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;

      const res = await api.post('/auth/verify-otp', {
        phone: formatted,
        otp: otp.trim(),
      });

      const responseData = res.data?.data;
      if (!responseData?.accessToken || !responseData?.user) {
        throw new Error('Invalid verification response');
      }

      await login(
        {
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
        },
        responseData.user as AuthUser
      );

      navigateForRole(responseData.user.role as Role);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired OTP. Please try again.';
      setServerError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ================= 3. STAFF: Email/Phone + Password Login =================
  const handleStaffLogin = async () => {
    setServerError('');
    const id = identifier.trim();
    if (!id) {
      setServerError('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setServerError('Please enter your password');
      return;
    }

    setIsSubmittingStaff(true);
    try {
      const payload = id.includes('@')
        ? { email: id, password }
        : { phone: id, password };

      const response = await api.post('/auth/login', payload);
      const responseData = response.data?.data;

      if (!responseData?.accessToken || !responseData?.user) {
        throw new Error('Invalid authentication response');
      }

      await login(
        {
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
        },
        responseData.user as AuthUser
      );
      navigateForRole(responseData.user.role as Role);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  if (!loading && isAuthenticated && user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.alreadyLoggedInContainer}>
          <View style={styles.alreadyLoggedInCard}>
            <View style={styles.alreadyLoggedInAvatar}>
              <Text style={styles.alreadyLoggedInAvatarText}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.alreadyLoggedInTitle}>Already Signed In</Text>
            <Text style={styles.alreadyLoggedInSub}>
              You are signed in as{' '}
              <Text style={{ fontWeight: '700', color: Colors.light.ink900 }}>
                {user.name || user.email || user.phone}
              </Text>{' '}
              ({user.role})
            </Text>

            <TouchableOpacity
              style={styles.alreadyLoggedInDashboardBtn}
              onPress={() => router.replace(getDashboardRouteForRole(user.role) as any)}
              activeOpacity={0.85}
            >
              <Icon name="layout-dashboard" size={16} color="#FFFFFF" />
              <Text style={styles.alreadyLoggedInDashboardText}>
                Go to {user.role} Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alreadyLoggedInSignoutBtn}
              onPress={async () => {
                await logout();
              }}
              activeOpacity={0.8}
            >
              <Icon name="log-out" size={15} color="#DC2626" />
              <Text style={styles.alreadyLoggedInSignoutText}>
                Sign Out / Switch Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alreadyLoggedInHomeBtn}
              onPress={() => router.replace('/(main)')}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={14} color={Colors.light.ink600} />
              <Text style={styles.alreadyLoggedInHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        extraHeight={140}
      >
        {/* Top Bar: Back to Home + Language Switcher + Live Portal Badge */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(main)')}
            activeOpacity={0.7}
          >
              <Icon name="arrow-left" size={16} color={Colors.light.ink700} />
              <Text style={styles.backHomeText}>{t('common.home', 'Home')}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LanguageSwitcher compact />
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('auth.livePortal', 'Live Portal')}</Text>
              </View>
            </View>
          </View>

          {/* ================= HERO BRAND BANNER ================= */}
          <View style={styles.brandHeroCard}>
            <View style={styles.brandTopRow}>
              <View style={styles.brandIconBox}>
                <Image
                  source={require('../../assets/logo-icon.png')}
                  style={styles.brandLogoIcon}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.brandHeroTitle}>Doctor Contact</Text>
                <Text style={styles.brandHeroSub}>
                  {t('footer.tagline', 'Smart Healthcare & Queue Ecosystem')}
                </Text>
              </View>
            </View>

            <View style={styles.heroTextGroup}>
              <View style={styles.heroBadge}>
                <Icon name="sparkles" size={12} color="#FDE047" />
                <Text style={styles.heroBadgeText}>
                  {mode === 'patient'
                    ? t('auth.patientPortal', 'Patient Portal')
                    : t('auth.staffPortal', 'Staff Portal')}
                </Text>
              </View>
              <Text style={styles.heroHeading}>
                {t('auth.heroHeadingAuth', 'Fast, reliable care without waiting room stress.')}
              </Text>
              <Text style={styles.heroDescription}>
                {t(
                  'auth.heroDescAuth',
                  'Book verified specialists, track live token queues in real-time, and manage clinic operations effortlessly.'
                )}
              </Text>
            </View>

            {/* 2 Value Pillars */}
            <View style={styles.pillarsGrid}>
              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                  <Icon name="stethoscope" size={15} color="#34D399" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>
                    {t('auth.instantSlotBooking', 'Verified Specialists')}
                  </Text>
                  <Text style={styles.pillarDesc}>
                    {t('auth.instantSlotDesc', 'Direct booking with certified doctors')}
                  </Text>
                </View>
              </View>

              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                  <Icon name="clock" size={15} color="#60A5FA" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>
                    {t('auth.liveTokenUpdates', 'Live Queue Tracking')}
                  </Text>
                  <Text style={styles.pillarDesc}>
                    {t('auth.liveTokenDesc', 'Track token number before leaving home')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= LOGIN FORM CARD ================= */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>
              {mode === 'patient'
                ? t('auth.patientPortal', 'Patient Portal')
                : t('auth.staffPortal', 'Staff Portal')}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'patient'
                ? t('auth.selectUserType', 'Login or register instantly with your phone number.')
                : t('auth.selectUserType', 'Secure access for doctors, clinics, and admins.')}
            </Text>

            {/* Patient vs Staff Tab Toggle */}
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'patient' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('patient');
                  setServerError('');
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name="user"
                  size={14}
                  color={mode === 'patient' ? Colors.light.primary : Colors.light.ink500}
                />
                <Text style={[styles.tabBtnText, mode === 'patient' && styles.tabBtnTextActive]}>
                  {t('auth.patientLogin', 'Patient')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === 'staff' && styles.tabBtnActive]}
                onPress={() => {
                  setMode('staff');
                  setServerError('');
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name="building"
                  size={14}
                  color={mode === 'staff' ? Colors.light.primary : Colors.light.ink500}
                />
                <Text style={[styles.tabBtnText, mode === 'staff' && styles.tabBtnTextActive]}>
                  {t('auth.staffLogin', 'Clinic / Staff')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Server Error Alert */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={16} color={Colors.light.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            {/* ================= PATIENT MODE (PHONE OTP) ================= */}
            {mode === 'patient' ? (
              <View style={styles.formFields}>
                {patientStep === 'enter-phone' ? (
                  // Step 1: Enter Phone Number
                  <>
                    <View style={styles.inputField}>
                      <Text style={styles.fieldLabel}>
                        {t('auth.mobileNumber', 'Mobile Number')}
                      </Text>
                      <View style={styles.inputContainer}>
                        <View style={styles.countryCodeBox}>
                          <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('auth.enterMobile', '10-digit mobile number')}
                          placeholderTextColor={Colors.light.ink400}
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={phoneInput}
                          onChangeText={(txt) => setPhoneInput(txt.replace(/\D/g, ''))}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        (isLoadingOtp || phoneInput.length < 10) && styles.submitBtnDisabled,
                      ]}
                      onPress={handleSendOtp}
                      disabled={isLoadingOtp || phoneInput.length < 10}
                      activeOpacity={0.85}
                    >
                      {isLoadingOtp ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>
                            {t('auth.getOtp', 'Get Secure OTP')}
                          </Text>
                          <Icon name="arrow-right" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  // Step 2: Enter OTP
                  <>
                    {/* Sent To Summary Card with Change Button */}
                    <View style={styles.phoneSummaryCard}>
                      <View style={styles.phoneSummaryLeft}>
                        <Text style={styles.phoneSummaryLabel}>
                          {t('auth.otpSentSecurelyTo', 'OTP sent securely to')}
                        </Text>
                        <Text style={styles.phoneSummaryNumber}>+91 {phoneInput}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.phoneChangeBtn}
                        onPress={() => {
                          setPatientStep('enter-phone');
                          setOtp('');
                          setServerError('');
                        }}
                        activeOpacity={0.75}
                      >
                        <Icon name="edit" size={13} color={Colors.light.ink700} />
                        <Text style={styles.phoneChangeBtnText}>
                          {t('common.change', 'Change')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 6-Digit OtpInput */}
                    <View style={styles.inputField}>
                      <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 4 }]}>
                        {t('auth.enter6DigitOtp', 'Enter 6-digit verification code')}
                      </Text>
                      <OtpInput
                        value={otp}
                        onChange={setOtp}
                        disabled={isVerifyingOtp}
                        autoFocus
                      />
                    </View>

                    {/* Verify & Login Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        (isVerifyingOtp || otp.length < 6) && styles.submitBtnDisabled,
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={isVerifyingOtp || otp.length < 6}
                      activeOpacity={0.85}
                    >
                      {isVerifyingOtp ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>
                            {t('auth.verifyLogin', 'Verify & Login')}
                          </Text>
                          <Icon name="check-circle" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Resend OTP Cooldown Button */}
                    <TouchableOpacity
                      style={styles.resendBtn}
                      onPress={handleSendOtp}
                      disabled={timer > 0 || isLoadingOtp}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="refresh-cw"
                        size={14}
                        color={timer > 0 ? Colors.light.ink400 : Colors.light.primary}
                      />
                      <Text
                        style={[
                          styles.resendBtnText,
                          timer > 0 && styles.resendBtnTextDisabled,
                        ]}
                      >
                        {timer > 0
                          ? `${t('auth.resendOtpIn', 'Resend OTP in')} ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                          : t('auth.resendOtp', 'Resend OTP')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              /* ================= STAFF MODE (EMAIL/PHONE + PASSWORD) ================= */
              <View style={styles.formFields}>
                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.emailOrPhone', 'Email or Phone Number')}
                  </Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconPrefix}>
                      <Icon name="mail" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="doctor@dewasi.com or phone"
                      placeholderTextColor={Colors.light.ink400}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={identifier}
                      onChangeText={setIdentifier}
                    />
                  </View>
                </View>

                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.password', 'Password')}
                  </Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconPrefix}>
                      <Icon name="lock" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder={t('auth.enterPassword', 'Enter account password')}
                      placeholderTextColor={Colors.light.ink400}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={16}
                        color={Colors.light.ink500}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmittingStaff && styles.submitBtnDisabled]}
                  onPress={handleStaffLogin}
                  disabled={isSubmittingStaff}
                  activeOpacity={0.85}
                >
                  {isSubmittingStaff ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>
                        {t('auth.signInAsStaff', 'Sign In to Portal')}
                      </Text>
                      <Icon name="arrow-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Sign Up Redirect */}
            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>
                {t('auth.noAccount', "Don't have an account yet?")}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.signUpLinkText}>
                  {t('auth.createFreeAccount', 'Sign Up Free')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= HELPDESK FOOTER ================= */}
          <View style={styles.helpdeskCard}>
            <Text style={styles.helpdeskTitle}>Facing trouble signing in?</Text>
            <View style={styles.helpdeskBtnsRow}>
              <TouchableOpacity
                style={styles.helpdeskCallBtn}
                onPress={() => Linking.openURL(`tel:${CLINIC_PHONE}`).catch(() => {})}
                activeOpacity={0.8}
              >
                <Icon name="phone" size={13} color={Colors.light.ink700} />
                <Text style={styles.helpdeskCallText}>Call Helpdesk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpdeskWhatsAppBtn}
                onPress={() => Linking.openURL(`https://wa.me/${CLINIC_WHATSAPP}`).catch(() => {})}
                activeOpacity={0.8}
              >
                <Icon name="message-circle" size={13} color="#059669" />
                <Text style={styles.helpdeskWhatsAppText}>WhatsApp Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  alreadyLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: '#F8FAFC',
  },
  alreadyLoggedInCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
    gap: 12,
  },
  alreadyLoggedInAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  alreadyLoggedInAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  alreadyLoggedInTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  alreadyLoggedInSub: {
    fontSize: 13,
    color: Colors.light.ink600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  alreadyLoggedInDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: Colors.light.primary,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  alreadyLoggedInDashboardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alreadyLoggedInSignoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 11,
    borderRadius: Radius.lg,
  },
  alreadyLoggedInSignoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  alreadyLoggedInHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  alreadyLoggedInHomeText: {
    color: Colors.light.ink600,
    fontSize: 13,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },

  /* Top Navigation Bar */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  backHomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
    textTransform: 'uppercase',
  },

  /* Brand Hero Banner */
  brandHeroCard: {
    backgroundColor: '#12295E',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    ...Shadows.md,
    gap: Spacing.three,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoIcon: {
    width: 26,
    height: 26,
  },
  brandHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandHeroSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  heroTextGroup: {
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
    borderColor: 'rgba(253, 224, 71, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE047',
    textTransform: 'uppercase',
  },
  heroHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  heroDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  pillarsGrid: {
    gap: 8,
    marginTop: 2,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillarIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarTextGroup: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pillarDesc: {
    fontSize: 10,
    color: 'rgba(219, 234, 254, 0.7)',
  },

  /* Form Card */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    gap: Spacing.three,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F1B33',
  },
  formSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginTop: -4,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.lg,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  tabBtnTextActive: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.danger,
    fontWeight: '600',
  },
  formFields: {
    gap: Spacing.three,
  },
  inputField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  countryCodeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink800,
  },
  inputIconPrefix: {
    paddingLeft: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: 4,
    ...Shadows.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* OTP Sent Summary Card */
  phoneSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phoneSummaryLeft: {
    gap: 2,
  },
  phoneSummaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  phoneSummaryNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  phoneChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  phoneChangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  resendBtnTextDisabled: {
    color: Colors.light.ink400,
    fontWeight: '600',
  },

  /* Sign Up Redirect Prompt */
  signUpPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.two,
  },
  signUpPromptText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  signUpLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.primary,
  },

  /* Helpdesk Footer */
  helpdeskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 10,
  },
  helpdeskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  helpdeskBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  helpdeskCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpdeskCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  helpdeskWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  helpdeskWhatsAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
});
