// src/constants/theme.ts

export const Colors = {
  // Primary brand — deep navy (SDA blue)
  primary:       '#1a3a5c',
  primaryLight:  '#2d5f8a',
  primaryDark:   '#0f2238',

  // Accent — warm gold (hymnal gold)
  accent:        '#c8922a',
  accentLight:   '#e8b04a',
  accentDark:    '#9a6e1a',

  // Backgrounds
  background:    '#f8f6f0',   // warm parchment
  surface:       '#ffffff',
  surfaceAlt:    '#f0ede4',

  // Dark mode backgrounds
  backgroundDark: '#0f1e2e',
  surfaceDark:    '#1a2e42',
  surfaceAltDark: '#243d54',

  // Text
  text:          '#1a1a1a',
  textSecondary: '#5a5a5a',
  textMuted:     '#9a9a9a',
  textDark:      '#f0ede4',
  textSecondaryDark: '#b8c4cf',

  // Borders
  border:        '#d8d0c0',
  borderDark:    '#2d4a62',

  // Status
  success:       '#2d7a3a',
  warning:       '#c8922a',
  error:         '#c0392b',
  info:          '#2d7ab8',

  // Hymnal edition colors (each edition has its own identity)
  editions: {
    MILLENNIAL1849: '#6b4226',
    SDA1869:        '#4a5568',
    CHRIST1908:     '#744210',
    CHURCH1941:     '#2d4a62',
    SDA1985:        '#1a3a5c',  // primary
  }
};

export const Typography = {
  // Font families (loaded via expo-font)
  fontSans:   'System',
  fontSerif:  'Georgia',   // fallback until custom font loaded
  fontMono:   'Courier',

  // Sizes
  xs:   11,
  sm:   13,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,

  // Weights
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '700' as const,

  // Line heights
  tight:   1.2,
  normal:  1.6,
  relaxed: 1.8,
  lyrics:  2.0,   // extra generous for singing
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
  '3xl': 48,
};

export const BorderRadius = {
  sm:  6,
  md:  10,
  lg:  16,
  xl:  24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
};
