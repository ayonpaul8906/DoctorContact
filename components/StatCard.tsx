import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GradientCard, GradientVariant } from './GradientCard';
import { Icon, IconName } from './Icon';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface StatCardProps {
  label: string;
  value: number | string;
  iconName: IconName;
  variant: GradientVariant;
  subtitle?: string;
  onPress?: () => void;
}

const ICON_BG: Record<GradientVariant, { bg: string; iconColor: string }> = {
  blue: { bg: '#1E3A8A', iconColor: '#FFFFFF' },
  blueLight: { bg: '#2563EB', iconColor: '#FFFFFF' },
  indigo: { bg: '#4F46E5', iconColor: '#FFFFFF' },
  purple: { bg: '#7C3AED', iconColor: '#FFFFFF' },
  green: { bg: '#059669', iconColor: '#FFFFFF' },
  pink: { bg: '#EC4899', iconColor: '#FFFFFF' },
  cyan: { bg: '#0891B2', iconColor: '#FFFFFF' },
  teal: { bg: '#0D9488', iconColor: '#FFFFFF' },
  amber: { bg: '#D97706', iconColor: '#FFFFFF' },
  orange: { bg: '#EA580C', iconColor: '#FFFFFF' },
};

export function StatCard({
  label,
  value,
  iconName,
  variant,
  subtitle,
  onPress,
}: StatCardProps) {
  const iconTheme = ICON_BG[variant] || ICON_BG.blue;

  const card = (
    <GradientCard variant={variant} contentStyle={styles.cardContent}>
      <View style={styles.topRow}>
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconBox, { backgroundColor: iconTheme.bg }]}>
          <Icon name={iconName} size={16} color={iconTheme.iconColor} />
        </View>
      </View>
      <Text style={styles.valueText}>{value}</Text>
      {subtitle ? (
        <Text style={styles.subtitleText} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </GradientCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {card}
      </TouchableOpacity>
    );
  }

  return <View style={styles.gridItem}>{card}</View>;
}

const styles = StyleSheet.create({
  gridItem: {
    flex: 1,
    minWidth: '47%',
  },
  cardContent: {
    padding: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  valueText: {
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.light.ink600,
    flex: 1,
    marginRight: 6,
  },
  subtitleText: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 3,
    fontWeight: '500',
  },
});
