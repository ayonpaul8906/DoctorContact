import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Icon, type IconName } from './Icon';

type ColorScheme = 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'teal' | 'amber' | 'emerald' | 'cyan' | 'indigo';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  iconName: IconName;
  colorScheme?: ColorScheme;
  badgeText?: string;
  badgeVariant?: 'healthy' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
  progress?: number; // 0–100
}

const SCHEME_COLORS: Record<ColorScheme, { bg: string; icon: string; border: string }> = {
  blue:    { bg: '#EFF6FF', icon: '#1D4ED8', border: '#1B3A8C' },
  green:   { bg: '#DCFCE7', icon: '#15803D', border: '#22C55E' },
  orange:  { bg: '#FEF3C7', icon: '#B45309', border: '#F59E0B' },
  pink:    { bg: '#FDF2F8', icon: '#BE185D', border: '#EC4899' },
  purple:  { bg: '#F5F3FF', icon: '#7C3AED', border: '#8B5CF6' },
  teal:    { bg: '#F0FDFA', icon: '#0F766E', border: '#14B8A6' },
  amber:   { bg: '#FFFBEB', icon: '#D97706', border: '#F59E0B' },
  emerald: { bg: '#ECFDF5', icon: '#059669', border: '#10B981' },
  cyan:    { bg: '#ECFEFF', icon: '#0E7490', border: '#06B6D4' },
  indigo:  { bg: '#EEF2FF', icon: '#4338CA', border: '#6366F1' },
};

const BADGE_COLORS: Record<'healthy' | 'warning' | 'danger' | 'info', { bg: string; text: string }> = {
  healthy: { bg: '#DCFCE7', text: '#15803D' },
  warning: { bg: '#FEF3C7', text: '#B45309' },
  danger:  { bg: '#FEF2F2', text: '#DC2626' },
  info:    { bg: '#EFF6FF', text: '#1D4ED8' },
};

export function AdminStatCard({
  title,
  value,
  subtitle,
  iconName,
  colorScheme = 'blue',
  badgeText,
  badgeVariant = 'info',
  onPress,
  progress,
}: AdminStatCardProps) {
  const scheme = SCHEME_COLORS[colorScheme];
  const badgeColor = BADGE_COLORS[badgeVariant];

  const Content = (
    <View style={[styles.card, { borderLeftColor: scheme.border }]}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={[styles.iconBox, { backgroundColor: scheme.bg }]}>
          <Icon name={iconName} size={16} color={scheme.icon} />
        </View>
      </View>

      <Text style={styles.value}>{value}</Text>

      {badgeText && (
        <View style={[styles.badge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[styles.badgeText, { color: badgeColor.text }]}>{badgeText}</Text>
        </View>
      )}

      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%` as any, backgroundColor: scheme.border },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}

      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
        {Content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{Content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 4,
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
    color: Colors.light.ink500,
    flex: 1,
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.ink900,
    letterSpacing: -0.5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.surface100,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
    minWidth: 28,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
    lineHeight: 16,
  },
});
