/**
 * Professional Design System for Sahool Platform
 * نظام تصميم احترافي لمنصة سَهول
 */

/**
 * Color Palette - Professional Agricultural Theme
 * لوحة ألوان احترافية بطابع زراعي
 */
export const colors = {
  // Primary Colors - John Deere Inspired
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#367C2B', // John Deere Green
    600: '#2d6824',
    700: '#24531d',
    800: '#1b3e16',
    900: '#122910',
  },

  // Secondary Colors - Farmonaut Teal
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#00BFA5', // Farmonaut Teal
    600: '#00a38a',
    700: '#00876f',
    800: '#006b54',
    900: '#004f39',
  },

  // Accent Colors - Yellow
  accent: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#FFDE00', // John Deere Yellow
    600: '#d9bc00',
    700: '#b39a00',
    800: '#8d7800',
    900: '#675600',
  },

  // Neutral Colors - Professional Gray Scale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Status Colors for Equipment
  status: {
    active: '#10b981',
    idle: '#f59e0b',
    maintenance: '#ef4444',
    offline: '#6b7280',
  },
};

/**
 * Typography System
 * نظام الطباعة
 */
export const typography = {
  // Font Families
  fontFamily: {
    sans: 'Cairo, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace',
    display: 'Tajawal, sans-serif',
  },

  // Font Sizes - Type Scale
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

/**
 * Spacing System - 8px Base
 * نظام المسافات
 */
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
};

/**
 * Border Radius
 * نصف قطر الحواف
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

/**
 * Shadows - Soft and Professional
 * الظلال
 */
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',

  // Colored Shadows for Cards
  primary: '0 10px 30px -5px rgba(54, 124, 43, 0.3)',
  secondary: '0 10px 30px -5px rgba(0, 191, 165, 0.3)',
  accent: '0 10px 30px -5px rgba(255, 222, 0, 0.3)',
};

/**
 * Transitions and Animations
 * الانتقالات والحركات
 */
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * Breakpoints for Responsive Design
 * نقاط التوقف للتصميم المتجاوب
 */
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Z-Index Scale
 * مقياس الطبقات
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
};

/**
 * Component Variants
 * متغيرات المكونات
 */
export const variants = {
  button: {
    primary: {
      bg: colors.primary[500],
      color: 'white',
      hover: colors.primary[600],
      shadow: shadows.sm,
    },
    secondary: {
      bg: colors.secondary[500],
      color: 'white',
      hover: colors.secondary[600],
      shadow: shadows.sm,
    },
    outline: {
      bg: 'transparent',
      color: colors.primary[500],
      border: colors.primary[500],
      hover: colors.primary[50],
    },
    ghost: {
      bg: 'transparent',
      color: colors.neutral[700],
      hover: colors.neutral[100],
    },
  },

  card: {
    default: {
      bg: 'white',
      border: colors.neutral[200],
      shadow: shadows.sm,
      radius: borderRadius.lg,
    },
    elevated: {
      bg: 'white',
      border: 'transparent',
      shadow: shadows.md,
      radius: borderRadius.xl,
    },
    interactive: {
      bg: 'white',
      border: colors.neutral[200],
      shadow: shadows.sm,
      hoverShadow: shadows.lg,
      radius: borderRadius.lg,
    },
  },

  input: {
    default: {
      bg: 'white',
      border: colors.neutral[300],
      focus: colors.primary[500],
      radius: borderRadius.md,
      shadow: shadows.xs,
    },
    error: {
      bg: 'white',
      border: colors.error,
      focus: colors.error,
      radius: borderRadius.md,
    },
  },
};

/**
 * Icon Sizes
 * أحجام الأيقونات
 */
export const iconSizes = {
  xs: '1rem',    // 16px
  sm: '1.25rem', // 20px
  base: '1.5rem', // 24px
  lg: '2rem',    // 32px
  xl: '2.5rem',  // 40px
  '2xl': '3rem', // 48px
};

/**
 * Export all design tokens
 */
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  variants,
  iconSizes,
};

export default designSystem;
