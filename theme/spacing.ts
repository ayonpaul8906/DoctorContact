/**
 * Spacing, Radius, and Shadow tokens mirroring the Web application.
 */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  none: 0,
  sm: 8,
  md: 12, // Standard buttons & inputs
  lg: 16, // Standard cards & list items
  xl: 24, // Modals, bottom sheets & hero containers
  full: 9999, // Pill badges, avatar rings
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
