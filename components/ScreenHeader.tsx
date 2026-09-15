import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  badgeText = 'Dashboard',
  actionLabel,
  onActionPress,
}: ScreenHeaderProps) {
  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={styles.iconBox}>
              <Icon name="activity" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>

        <Text style={styles.titleText}>{title}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}

        {actionLabel && onActionPress ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onActionPress}
            activeOpacity={0.85}
          >
            <Icon name="stethoscope" size={16} color="#FFFFFF" />
            <Text style={styles.ctaText}>{actionLabel}</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  content: {
    padding: Spacing.four,
  },
  topRow: {
    marginBottom: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#1E40AF',
  },
  titleText: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.ink500,
    marginTop: 4,
    lineHeight: Typography.lineHeights.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 9,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
