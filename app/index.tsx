import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { useAuth } from '../lib/auth-context';
import type { Role } from '../types';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Redirect to the Home Page when app opens
      router.replace('/(main)');
    }
  }, [loading, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Brand Showcase */}
        <View style={styles.brandBox}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/adaptive-icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <Image
            source={require('../assets/LOGO.png')}
            style={styles.logoFull}
            resizeMode="contain"
          />
        </View>

        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.statusText}>Connecting to Doctor Contact Network...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phase 1 • Secure Authentication Gateway</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  brandBox: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logoIcon: {
    width: 48,
    height: 48,
  },
  logoFull: {
    width: 180,
    height: 40,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.ink600,
  },
  footer: {
    paddingBottom: Spacing.two,
  },
  footerText: {
    fontSize: 11,
    color: Colors.light.ink400,
    fontWeight: '500',
  },
});
