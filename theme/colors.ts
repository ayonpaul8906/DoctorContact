/**
 * Single source of truth for mobile colors.
 * Directly extracted from Web (globals.css) and Shared Theme tokens.
 */

export const Colors = {
  light: {
    // Brand Tokens
    primary: '#1B3A8C',
    primaryDark: '#12295E',
    primaryLight: '#3B82F6',
    secondary: '#22C55E',
    secondaryDark: '#15803D',
    secondaryLight: '#DCFCE7',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSoft: '#F4F7FE',

    // Surfaces
    surfaceWhite: '#FFFFFF',
    surface50: '#F9FAFB',
    surface100: '#F3F4F6',
    surface200: '#E5E7EB',
    surface300: '#D1D5DB',

    // Ink (Text & Icon Hierarchy)
    ink900: '#111827', // Main Headings
    ink800: '#1F2937', // Subheadings / Primary Text
    ink700: '#374151', // Body text
    ink600: '#4B5563', // Secondary text
    ink500: '#6B7280', // Muted / placeholders
    ink400: '#9CA3AF', // Disabled / light icons
    ink300: '#D1D5DB', // Borders / dividers
    ink200: '#E5E7EB', // Subtle borders

    // Semantic Status
    success: '#22C55E',
    successLight: '#DCFCE7',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#EFF6FF',

    // UI Elements
    border: '#E5E7EB',
    card: '#FFFFFF',
    inputBg: '#F9FAFB',
  },
  dark: {
    // Brand Tokens
    primary: '#5B8DEF',
    primaryDark: '#A9C4FF',
    primaryLight: '#93C5FD',
    secondary: '#34D399',
    secondaryDark: '#10B981',
    secondaryLight: '#0D2D1B',

    // Backgrounds
    background: '#080F1D',
    backgroundSoft: '#0C1526',

    // Surfaces
    surfaceWhite: '#111C2E',
    surface50: '#0C1526',
    surface100: '#162238',
    surface200: '#19263D',
    surface300: '#22334F',

    // Ink Hierarchy
    ink900: '#F8FAFC',
    ink800: '#F1F5F9',
    ink700: '#CBD5E1',
    ink600: '#94A3B8',
    ink500: '#7D8FA9',
    ink400: '#64748B',
    ink300: '#475569',
    ink200: '#334155',

    // Semantic Status
    success: '#34D399',
    successLight: '#0D2D1B',
    danger: '#F87171',
    dangerLight: '#450A0A',
    warning: '#FBBF24',
    warningLight: '#451A03',
    info: '#60A5FA',
    infoLight: '#172554',

    // UI Elements
    border: '#19263D',
    card: '#111C2E',
    inputBg: '#162238',
  },
} as const;

export type ThemeColors = typeof Colors.light;
