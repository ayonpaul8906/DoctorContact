import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadows } from '../theme';

export type GradientVariant =
  | 'blue'
  | 'blueLight'
  | 'indigo'
  | 'purple'
  | 'green'
  | 'pink'
  | 'cyan'
  | 'teal'
  | 'amber'
  | 'orange';

interface GradientCardProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  gradientColors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const GRADIENT_PRESETS: Record<
  GradientVariant,
  { colors: readonly [string, string, ...string[]]; shadow: string }
> = {
  blue: {
    colors: ['#1E3A8A', '#3B82F6', '#8B5CF6'],
    shadow: '#1E3A8A',
  },
  blueLight: {
    colors: ['#1E3A8A', '#3B82F6', '#60A5FA'],
    shadow: '#1E3A8A',
  },
  indigo: {
    colors: ['#4F46E5', '#6366F1', '#818CF8'],
    shadow: '#4338CA',
  },
  purple: {
    colors: ['#7C3AED', '#8B5CF6', '#A78BFA'],
    shadow: '#6D28D9',
  },
  green: {
    colors: ['#059669', '#10B981', '#34D399'],
    shadow: '#047857',
  },
  pink: {
    colors: ['#EC4899', '#F43F5E', '#FB923C'],
    shadow: '#BE123C',
  },
  cyan: {
    colors: ['#0891B2', '#06B6D4', '#3B82F6'],
    shadow: '#0E7490',
  },
  teal: {
    colors: ['#0D9488', '#14B8A6', '#10B981'],
    shadow: '#0F766E',
  },
  amber: {
    colors: ['#F59E0B', '#F97316', '#EF4444'],
    shadow: '#B45309',
  },
  orange: {
    colors: ['#F97316', '#EA580C', '#C2410C'],
    shadow: '#C2410C',
  },
};

export function GradientCard({
  children,
  variant = 'blue',
  gradientColors,
  style,
  contentStyle,
}: GradientCardProps) {
  const preset = GRADIENT_PRESETS[variant] || GRADIENT_PRESETS.blue;
  const colors = gradientColors || preset.colors;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.8 }}
      style={[
        styles.outerContainer,
        {
          shadowColor: preset.shadow,
        },
        style,
      ] as any}
    >
      <View style={[styles.innerContainer, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: Radius.lg,
    padding: 2.5,
    backgroundColor: Colors.light.surfaceWhite,
    ...Shadows.sm,
  },
  innerContainer: {
    borderRadius: Radius.lg - 2,
    backgroundColor: Colors.light.surfaceWhite,
    overflow: 'hidden',
  },
});
