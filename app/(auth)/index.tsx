import React, { useState } from 'react';
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
import { api, setAccessToken } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import type { Role, AuthUser } from '../../types';

const CLINIC_PHONE = '+919777777777';
const CLINIC_WHATSAPP = '919777777777';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  // Mode: "patient" or "staff" (Doctor / Clinic / Receptionist / Admin / Staff)
  const [mode, setMode] = useState<'patient' | 'staff'>('patient');

  // Form states
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [phoneInput, setPhoneInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

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

    setIsSubmitting(true);
    try {
      const payload = id.includes('@')
        ? { email: id, password }
        : { phone: id, password };

      const response = await api.post('/auth/login', payload);
      const responseData = response.data?.data;

      if (!responseData?.accessToken || !responseData?.user) {
        throw new Error('Invalid authentication response');
      }

      await login(responseData.accessToken, responseData.user as AuthUser);
      navigateForRole(responseData.user.role as Role);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientLogin = async () => {
    setServerError('');
    const inputVal = phoneInput.trim();
    if (!inputVal) {
      setServerError('Please enter your 10-digit mobile number or email');
      return;
    }
    if (!password) {
      setServerError('Please enter your password or PIN');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmail = inputVal.includes('@');
      const cleanDigits = inputVal.replace(/\D/g, '');
      const phonePayload = cleanDigits.startsWith('91') && cleanDigits.length > 10
        ? `+${cleanDigits}`
        : `+91${cleanDigits.slice(-10)}`;

      const payload = isEmail
        ? { email: inputVal, password }
        : { phone: phonePayload, password };

      const response = await api.post('/auth/login', payload);
      const responseData = response.data?.data;

      if (!responseData?.accessToken || !responseData?.user) {
        throw new Error('Invalid response structure');
      }

      await login(responseData.accessToken, responseData.user as AuthUser);
      // Immediately open patient's dashboard (or whichever role they logged in as)
      navigateForRole(responseData.user.role as Role);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not sign in. Please verify your mobile number/password or create an account.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                <Text style={styles.liveText}>Live Portal</Text>
              </View>
            </View>
          </View>

          {/* ================= HERO BRAND BANNER (Web Left Panel on Mobile) ================= */}
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
                <Text style={styles.brandHeroSub}>Smart Healthcare & Queue Ecosystem</Text>
              </View>
            </View>

            <View style={styles.heroTextGroup}>
              <View style={styles.heroBadge}>
                <Icon name="sparkles" size={12} color="#FDE047" />
                <Text style={styles.heroBadgeText}>Unified Healthcare Portal</Text>
              </View>
              <Text style={styles.heroHeading}>
                Fast, reliable care without waiting room stress.
              </Text>
              <Text style={styles.heroDescription}>
                Book verified specialists, track live token queues in real-time, and manage clinic
                operations effortlessly.
              </Text>
            </View>

            {/* 3 Value Pillars */}
            <View style={styles.pillarsGrid}>
              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                  <Icon name="stethoscope" size={15} color="#34D399" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>Verified Specialists</Text>
                  <Text style={styles.pillarDesc}>Direct booking with certified doctors</Text>
                </View>
              </View>

              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                  <Icon name="clock" size={15} color="#60A5FA" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>Live Queue Tracking</Text>
                  <Text style={styles.pillarDesc}>Track token number before leaving home</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= LOGIN FORM CARD ================= */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Sign In to Account</Text>
            <Text style={styles.formSubtitle}>
              Select your user type to access your personalized portal.
            </Text>

            {/* Patient vs Staff Tab Toggle (Exact Web Design) */}
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
                  Patient Login
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
                  Staff / Clinic / Doctor
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

            {/* Patient Mode Form */}
            {mode === 'patient' ? (
              <View style={styles.formFields}>
                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={Colors.light.ink400}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phoneInput}
                      onChangeText={setPhoneInput}
                    />
                  </View>
                </View>

                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>Password / PIN</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconPrefix}>
                      <Icon name="lock" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your account password"
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
                  style={styles.submitBtn}
                  onPress={handlePatientLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Sign In as Patient</Text>
                      <Icon name="arrow-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Staff Mode Form */
              <View style={styles.formFields}>
                <View style={styles.inputField}>
                  <Text style={styles.fieldLabel}>Email or Phone Number</Text>
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
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconPrefix}>
                      <Icon name="lock" size={16} color={Colors.light.ink400} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter account password"
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
                  style={styles.submitBtn}
                  onPress={handleStaffLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Sign In to Portal</Text>
                      <Icon name="arrow-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Sign Up Redirect */}
            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>Don't have an account yet? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.signUpLinkText}>Sign Up Free</Text>
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
                <Icon name="message-circle" size={13} color="#15803D" />
                <Text style={styles.helpdeskWhatsAppText}>WhatsApp Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FE',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  backHomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
  },

  /* Brand Hero Card */
  brandHeroCard: {
    backgroundColor: '#12295E',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.md,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  brandLogoIcon: {
    width: 28,
    height: 28,
  },
  brandHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandHeroSub: {
    fontSize: 10,
    color: 'rgba(191, 219, 254, 0.8)',
  },
  heroTextGroup: {
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  heroHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  heroDescription: {
    fontSize: 12,
    color: 'rgba(219, 234, 254, 0.8)',
    lineHeight: 17,
  },
  pillarsGrid: {
    gap: 8,
    paddingTop: 4,
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
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signUpPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  signUpPromptText: {
    fontSize: 13,
    color: Colors.light.ink600,
  },
  signUpLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
  },

  /* Helpdesk */
  helpdeskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: Spacing.two,
  },
  helpdeskTitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  helpdeskBtnsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  helpdeskCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  helpdeskCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  helpdeskWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: Radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  helpdeskWhatsAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
});
