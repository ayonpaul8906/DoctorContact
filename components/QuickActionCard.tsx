import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Icon, type IconName } from './Icon';

interface QuickActionCardProps {
  iconName: IconName;
  label: string;
  description?: string;
  count?: number;
  countVariant?: 'blue' | 'orange' | 'green' | 'red';
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

const COUNT_VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  blue:   { bg: '#EFF6FF', text: '#1D4ED8' },
  orange: { bg: '#FEF3C7', text: '#B45309' },
  green:  { bg: '#DCFCE7', text: '#15803D' },
  red:    { bg: '#FEF2F2', text: '#DC2626' },
};

export function QuickActionCard({
  iconName,
  label,
  description,
  count,
  countVariant = 'blue',
  onPress,
  iconBgColor = '#EFF6FF',
  iconColor = '#1D4ED8',
}: QuickActionCardProps) {
  const countColors = COUNT_VARIANT_COLORS[countVariant];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>

      <View style={styles.textGroup}>
        <Text style={styles.label}>{label}</Text>
        {description && (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>

      <View style={styles.rightGroup}>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: countColors.bg }]}>
            <Text style={[styles.countText, { color: countColors.text }]}>
              {count}
            </Text>
          </View>
        )}
        <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  description: {
    fontSize: 12,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
