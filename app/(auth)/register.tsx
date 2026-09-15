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

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleRegister = async () => {
    setServerError('');

    if (!name.trim()) {
      setServerError('Please enter your full name');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setServerError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password) {
      setServerError('Please create a password for your account');
      return;
    }

    if (password.length < 6) {
      setServerError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = cleanPhone.startsWith('91')
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;

      // Call registration endpoint
      const response = await api.post('/auth/register', {
        name: name.trim(),
        phone: formattedPhone,
        ...(email.trim() ? { email: email.trim() } : {}),
        password,
        role: 'PATIENT',
      });

      const responseData = response.data?.data;
      if (responseData?.accessToken && responseData?.user) {
        await login(responseData.accessToken, responseData.user as AuthUser);
        router.replace('/(patient)' as any);
      } else {
        router.replace('/(auth)' as any);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to register account. Please check your details.';
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
                <Text style={styles.liveText}>Join Free</Text>
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
                <Text style={styles.brandHeroSub}>Smart Healthcare & Queue Ecosystem</Text>
              </View>
            </View>

            <View style={styles.heroTextGroup}>
              <View style={styles.heroBadge}>
                <Icon name="sparkles" size={12} color="#FDE047" />
                <Text style={styles.heroBadgeText}>Patient Account Registration</Text>
              </View>
              <Text style={styles.heroHeading}>
                Begin your seamless healthcare journey.
              </Text>
              <Text style={styles.heroDescription}>
                Create your account in seconds to reserve doctor consultations, track live token
                queues, and manage medical visits.
              </Text>
            </View>

            {/* Feature Highlights */}
            <View style={styles.pillarsGrid}>
              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                  <Icon name="calendar" size={14} color="#34D399" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>Instant Slot Booking</Text>
                  <Text style={styles.pillarDesc}>Pick dates & slots online in seconds</Text>
                </View>
              </View>

              <View style={styles.pillarItem}>
                <View style={[styles.pillarIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                  <Icon name="clock" size={14} color="#60A5FA" />
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle}>Live Token Updates</Text>
                  <Text style={styles.pillarDesc}>Real-time queue tracking on your phone</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= REGISTRATION FORM CARD ================= */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Create Free Account</Text>
            <Text style={styles.formSubtitle}>
              Fill in your details below to create your patient profile.
            </Text>

            {/* Error Alert */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={16} color={Colors.light.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            <View style={styles.formFields}>
              {/* Full Name */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Icon name="user" size={16} color={Colors.light.ink400} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={Colors.light.ink400}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Mobile Number *</Text>
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
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Email Address (Optional) */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Icon name="mail" size={16} color={Colors.light.ink400} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.light.ink400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Create Password *</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Icon name="lock" size={16} color={Colors.light.ink400} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
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

              {/* Confirm Password */}
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Confirm Password *</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Icon name="lock" size={16} color={Colors.light.ink400} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor={Colors.light.ink400}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              {/* Terms notice */}
              <Text style={styles.termsNotice}>
                By signing up, you agree to our Terms of Service & Privacy Policy. Your medical data
                is stored with enterprise-grade encryption.
              </Text>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRegister}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Create Free Account</Text>
                    <Icon name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to Login Prompt */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)')}>
                <Text style={styles.loginLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= HELPDESK FOOTER ================= */}
          <View style={styles.helpdeskCard}>
            <Text style={styles.helpdeskTitle}>Need help registering?</Text>
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
  termsNotice: {
    fontSize: 11,
    color: Colors.light.ink500,
    lineHeight: 16,
    marginTop: 2,
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
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  loginPromptText: {
    fontSize: 13,
    color: Colors.light.ink600,
  },
  loginLinkText: {
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
