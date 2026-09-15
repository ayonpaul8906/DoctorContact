import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../lib/language-context';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface AppHeaderProps {
  badgeText?: string;
  showHomeButton?: boolean;
  onHomePress?: () => void;
  rightElement?: React.ReactNode;
}

const BADGE_KEYS: Record<string, string> = {
  Patient: 'nav.patient',
  Doctor: 'nav.doctor',
  Clinic: 'nav.clinic',
  Receptionist: 'nav.receptionist',
  Diagnostic: 'nav.diagnostic',
  Staff: 'nav.staff',
  Admin: 'nav.admin',
  'Super Admin': 'nav.superAdmin',
};

export function AppHeader({
  badgeText,
  showHomeButton = true,
  onHomePress,
  rightElement,
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const localizedBadge = badgeText
    ? BADGE_KEYS[badgeText]
      ? t(BADGE_KEYS[badgeText], badgeText)
      : badgeText
    : undefined;

  const handleGoHome = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.push('/(main)');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top + 6 : Math.max(insets.top, 10),
        },
      ]}
    >
      <View style={styles.innerRow}>
        {/* Brand Group (Logo Icon + Brand Logo Text) */}
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.75}
          style={styles.brandTouchable}
        >
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/logo-icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/LOGO.png')}
              style={styles.logoFull}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        {/* Right Section: Language Switcher, Badge & Home Button */}
        <View style={styles.rightSection}>
          <LanguageSwitcher compact />

          {localizedBadge ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{localizedBadge}</Text>
            </View>
          ) : null}

          {rightElement}

          {showHomeButton && (
            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <View style={styles.homeIconBox}>
                <Icon name="home" size={13} color={Colors.light.primary} />
              </View>
              <Text style={styles.homeButtonText}>
                {t('common.home', 'Home')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 10,
    paddingHorizontal: 10,
    ...Shadows.sm,
    zIndex: 50,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  brandTouchable: {
    paddingVertical: 2,
    paddingRight: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 28,
    height: 28,
  },
  logoFull: {
    width: 98,
    height: 24,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgePill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
  },
  homeIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
