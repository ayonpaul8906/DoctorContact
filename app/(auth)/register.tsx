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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { Icon } from '../../components/Icon';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { OtpInput } from '../../components/OtpInput';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { getDashboardRouteForRole } from '../../lib/auth-utils';
import type { Role, AuthUser } from '../../types';

const CLINIC_PHONE = '+919777777777';
const CLINIC_WHATSAPP = '919777777777';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const { user, isAuthenticated, loading, login } = useAuth();
  const { t } = useLanguage();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.replace(getDashboardRouteForRole(user.role) as any);
    }
  }, [loading, isAuthenticated, user, router]);

  const prefilledPhone = (params.phone || '').trim().replace(/\D/g, '');

  const [phoneInput, setPhoneInput] = useState(prefilledPhone);
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  // If redirected from login where send-otp was already triggered
  const [isOtpSent, setIsOtpSent] = useState(Boolean(prefilledPhone));
  const [timer, setTimer] = useState(prefilledPhone ? 300 : 0);

  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // 5-minute countdown timer for OTP cooldown
  useEffect(() => {
    let interval: any;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpSent, timer]);

  // Request OTP if phone was not prefilled
  const handleRequestOtp = async () => {
    setServerError('');
    const clean = phoneInput.trim().replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setServerError(
        t('auth.validPhoneRequired', 'Please enter a valid 10-digit mobile number')
      );
      return;
    }

    setIsLoadingOtp(true);
    try {
      const formatted = clean.startsWith('91') && clean.length > 10
        ? `+${clean}`
        : `+91${clean.slice(-10)}`;

      await api.post('/auth/send-otp', { phone: formatted });
      setIsOtpSent(true);
      setTimer(300);
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

  // Verify OTP and create patient account
  const handleRegister = async () => {
    setServerError('');

    if (!name.trim() || name.trim().length < 2) {
      setServerError('Please enter your full name (at least 2 characters)');
      return;
    }

    const clean = phoneInput.trim().replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setServerError(
        t('auth.validPhoneRequired', 'Please enter a valid 10-digit mobile number')
      );
      return;
    }

    if (!otp.trim() || otp.trim().length < 6) {
      setServerError(
        t('auth.enterCompleteOtp', 'Please enter complete 6-digit OTP')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formatted = clean.startsWith('91') && clean.length > 10
        ? `+${clean}`
        : `+91${clean.slice(-10)}`;

      const response = await api.post('/auth/verify-otp', {
        phone: formatted,
        otp: otp.trim(),
        name: name.trim(),
      });

      const responseData = response.data?.data;
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

      // Successfully registered patient -> Go directly to patient overview
      router.replace('/(patient)' as any);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired OTP. Could not complete registration.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        extraHeight={140}
      >
        {/* Top Bar: Back to Home + Language Switcher + Join Free Badge */}
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
                <Text style={styles.liveText}>{t('auth.joinFree', 'Join Free')}</Text>
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
                  {t('auth.patientRegistration', 'Patient Account Registration')}
                </Text>
              </View>
              <Text style={styles.heroHeading}>
                {t('auth.heroHeadingAuth', 'Begin your seamless healthcare journey.')}
              </Text>
              <Text style={styles.heroDescription}>
                {t(
                  'auth.heroDescAuth',
                  'Create your account in seconds to reserve doctor consultations, track live token queues, and manage medical visits.'
                )}
              </Text>
            </View>

            {/* Feature Highlights */}
            <View style={styles.pillarsGrid}>
              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                  <Icon name="calendar" size={14} color="#34D399" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>
                    {t('auth.instantSlotBooking', 'Instant Slot Booking')}
                  </Text>
                  <Text style={styles.pillarDesc}>
                    {t('auth.instantSlotDesc', 'Pick dates & slots online in seconds')}
                  </Text>
                </View>
              </View>

              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                  <Icon name="clock" size={14} color="#60A5FA" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>
                    {t('auth.liveTokenUpdates', 'Live Token Updates')}
                  </Text>
                  <Text style={styles.pillarDesc}>
                    {t('auth.liveTokenDesc', 'Real-time queue tracking on your phone')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= REGISTRATION FORM CARD ================= */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>
              {t('auth.createFreeAccount', 'Create Free Account')}
            </Text>
            <Text style={styles.formSubtitle}>
              {t('auth.fillDetails', 'Fill in your details below to create your patient profile.')}
            </Text>

            {/* Error Alert */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={16} color={Colors.light.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            <View style={styles.formFields}>
              {/* Phone Status / Input */}
              {isOtpSent ? (
                <View style={styles.phoneSummaryCard}>
                  <View style={styles.phoneSummaryLeft}>
                    <Text style={styles.phoneSummaryLabel}>
                      {t('auth.newAccountSetup', 'New Account Setup')}
                    </Text>
                    <Text style={styles.phoneSummaryNumber}>
                      +91 {phoneInput}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.phoneChangeBtn}
                    onPress={() => {
                      setIsOtpSent(false);
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
              ) : (
                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.mobileNumber', 'Mobile Number')} *
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
              )}

              {/* Full Name */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>
                  {t('auth.fullName', 'Full Name')} *
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Icon name="user" size={16} color={Colors.light.ink400} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('auth.enterFullName', 'e.g. Soumya Chatterjee')}
                    placeholderTextColor={Colors.light.ink400}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* OTP Entry */}
              {isOtpSent ? (
                <>
                  <View style={styles.inputField}>
                    <Text
                      style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 4 }]}
                    >
                      {t('auth.enter6DigitOtp', 'Enter 6-digit OTP sent to your phone')}
                    </Text>
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </View>

                  {/* Verify & Create Account Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (isSubmitting || otp.length < 6 || name.trim().length < 2) &&
                        styles.submitBtnDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={isSubmitting || otp.length < 6 || name.trim().length < 2}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>
                          {t('auth.verifyAndCreate', 'Verify & Create Account')}
                        </Text>
                        <Icon name="arrow-right" size={16} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Resend OTP Button */}
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleRequestOtp}
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
              ) : (
                /* Send OTP Button */
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (isLoadingOtp || phoneInput.length < 10) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleRequestOtp}
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
              )}
            </View>

            {/* Login Link */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                {t('auth.haveAccount', 'Already have an account?')}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)')}>
                <Text style={styles.loginLinkText}>
                  {t('common.login', 'Login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Helpdesk Footer */}
          <View style={styles.helpdeskCard}>
            <Text style={styles.helpdeskTitle}>Need assistance with registration?</Text>
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

  /* Top Navigation */
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
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
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

  /* OTP Summary Card */
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
    fontWeight: '700',
    color: Colors.light.primary,
  },
  phoneSummaryNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
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

  /* Login Link Prompt */
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.two,
  },
  loginPromptText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  loginLinkText: {
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
