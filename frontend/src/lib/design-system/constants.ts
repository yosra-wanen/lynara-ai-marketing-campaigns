/**
 * Lynara Campaign Design System - Bibliothèque des constantes
 * Style: Moderne, soft, élégant et professionnel
 * Inspiré Orbitly CRM - Police Nunito
 */

// =============================================================================
// COULEURS (Color Palette - Orbitly inspired)
// =============================================================================

export const colors = {
  // Backgrounds
  background: {
    page: '#FFFFFF',
    card: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
    input: '#FFFFFF',
    hover: '#FAFAFA',
    active: '#FEF9C3', // Light yellow/orange tint
    activeGradient: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)',
    subtle: '#FAFAFA',
  },

  // Primary - Black Gradient (Requested)
  primary: {
    main: '#111827',
    light: '#374151',
    dark: '#000000',
    gradient: 'linear-gradient(135deg, #111827 0%, #000000 100%)',
  },

  // Themes Colors
  themes: {
    crm: {
      primary: '#8B5CF6', // Violet
      secondary: '#D946EF', // Fuchsia
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
      light: 'rgba(139, 92, 246, 0.1)',
    },
    catalogue: {
      primary: '#F59E0B', // Amber
      secondary: '#F97316', // Orange
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      light: 'rgba(245, 158, 11, 0.1)',
    },
  },

  // Secondary - Instagram Gradient Colors (for accents only)
  secondary: {
    purple: '#833AB4',
    pink: '#FD1D1D',
    orange: '#F56040',
    yellow: '#FCAF45',
  },

  // Text
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    muted: '#AAAAAA',
    inverse: '#FFFFFF',
  },

  // Semantic
  semantic: {
    success: '#8B5CF6',
    successLight: 'rgba(139, 92, 246, 0.15)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.15)',
  },

  // Accent - Or (badges, icônes)
  accent: {
    gold: '#D4AF37',
  },

  // Social Media Brand Colors
  social: {
    facebook: '#1877F2',
    instagram: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    whatsapp: '#25D366',
    twitter: '#1DA1F2',
  },

  // Borders
  border: {
    light: '#E0E0E0',
    default: '#D1D5DB',
    dark: '#9CA3AF',
  },
} as const;

// =============================================================================
// DÉGRADÉS SUBTILS (Subtle Gradients)
// Différence négligeable entre les couleurs - effet discret
// =============================================================================

// -----------------------------------------------------------------------------
// Dégradé noir raffiné (boutons principaux, CTA sobres)
// Transition douce en 4 stops pour un rendu premium
// -----------------------------------------------------------------------------
export const GRADIENT_BUTTON_BLACK =
  'linear-gradient(135deg, #374151 0%, #1F2937 38%, #111827 70%, #030712 100%)';
export const GRADIENT_BUTTON_BLACK_HOVER =
  'linear-gradient(135deg, #4B5563 0%, #374151 38%, #1F2937 70%, #111827 100%)';

// -----------------------------------------------------------------------------
// Palette dérivée de #a079ff (violet doux)
// Boutons colorés, badges, cercle IA
// -----------------------------------------------------------------------------
export const purplePalette = {
  /** Plus foncé - début dégradé */
  dark: '#6D3FEB',
  /** Foncé */
  '700': '#7C4DFF',
  /** Base */
  '500': '#8B5FF7',
  /** Référence utilisateur */
  base: '#A079FF',
  /** Clair */
  '300': '#B394FF',
  /** Plus clair - fin dégradé */
  light: '#C4A8FF',
  /** Très clair */
  '100': '#D4BDFF',
} as const;

export const GRADIENT_BUTTON_COLORED =
  'linear-gradient(120deg, #6D3FEB 0%, #7C4DFF 25%, #A079FF 50%, #B394FF 75%, #C4A8FF 100%)';
export const GRADIENT_BUTTON_COLORED_HOVER =
  'linear-gradient(120deg, #5B2ED9 0%, #6D3FEB 25%, #8B5FF7 50%, #A079FF 75%, #B394FF 100%)';

/** Couleurs du dégradé coloré (dérivées de #a079ff) */
export const gradientColoredColors = {
  start: '#6D3FEB',
  mid: '#A079FF',
  end: '#C4A8FF',
} as const;

// -----------------------------------------------------------------------------
// Palette dérivée de #dce875 (lime)
// Barres de progression, indicateurs, accents verts
// -----------------------------------------------------------------------------
export const limePalette = {
  /** Plus foncé - début dégradé */
  dark: '#9EB83A',
  /** Foncé */
  '500': '#B5C94A',
  /** Moyen */
  '400': '#C9D95E',
  /** Référence utilisateur */
  base: '#DCE875',
  /** Clair */
  '200': '#E5EF8E',
  /** Plus clair - fin dégradé */
  light: '#EEF49E',
  /** Très clair */
  '100': '#F4F9B8',
} as const;

export const GRADIENT_PROGRESS =
  'linear-gradient(90deg, #9EB83A 0%, #B5C94A 35%, #DCE875 70%, #EEF49E 100%)';

/** Violet plein pour badges / pastilles (dérivé de #a079ff) */
export const COLOR_BADGE_ACCENT = '#8B5FF7';

// -----------------------------------------------------------------------------
// Sémantique UI (alignée capture WorkFlow)
// -----------------------------------------------------------------------------
/** Fond item de nav actif (sidebar) - lime #dce875 */
export const COLOR_NAV_ACTIVE_BG = limePalette.base;
/** Fond onglet actif / case cochée / pastille - violet #a079ff */
export const COLOR_TAB_ACTIVE_BG = purplePalette.base;
/** Logo / marque - violet plein */
export const COLOR_LOGO_ACCENT = purplePalette.base;

export const gradients = {
  /** Page principale - Blanc pur */
  page: '#FFFFFF',
  /** Cartes - Blanc pur */
  card: '#FFFFFF',
  /** Sidebar - Blanc pur */
  sidebar: '#FFFFFF',
  /** Header - Blanc pur */
  header: '#FFFFFF',
  /** État actif nav */
  activeNav: '#F3F4F6',
  /** Bouton primary (défaut) - Dégradé noir */
  buttonPrimary: GRADIENT_BUTTON_BLACK,
  /** Bouton primary hover - Noir */
  buttonPrimaryHover: GRADIENT_BUTTON_BLACK_HOVER,
  /** Bouton accent / secondaire - Dégradé coloré raffiné */
  buttonColored: GRADIENT_BUTTON_COLORED,
  /** Bouton accent hover */
  buttonColoredHover: GRADIENT_BUTTON_COLORED_HOVER,
  /** Accent (badges, icônes, éléments IA) - même dégradé coloré */
  accent: GRADIENT_BUTTON_COLORED,
  /** Logo / Brand - Noir */
  logo: 'linear-gradient(135deg, #111827 0%, #000000 100%)',
  /** CRM Theme */
  crm: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
  /** Catalogue Theme */
  catalogue: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
  /** Cercle IA / icône centrale - dégradé violet (#a079ff) */
  aiCircle:
    'linear-gradient(180deg, #6D3FEB 0%, #8B5FF7 35%, #A079FF 65%, #C4A8FF 100%)',
  /** Barres de progression / indicateurs - lime (#dce875) */
  progress: GRADIENT_PROGRESS,
} as const;

// =============================================================================
// TYPOGRAPHIE (Typography - Nunito)
// =============================================================================

export const typography = {
  fontFamily: {
    sans: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  // Poids Nunito: 200, 300, 400, 600, 700, 800
  fontWeight: {
    extralight: 200,
    light: 300,
    regular: 400,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// =============================================================================
// FORMES ET TAILLES (Shapes & Sizes)
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
  pill: '9999px',
  circle: '50%',
} as const;

export const boxShadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  card: '0px 4px 6px -1px rgba(0, 0, 0, 0.08), 0px 2px 4px -2px rgba(0, 0, 0, 0.04)',
} as const;

// =============================================================================
// ESPACEMENT (Spacing)
// =============================================================================

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
} as const;

// =============================================================================
// ICÔNES (Icons)
// =============================================================================

export const iconSizes = {
  xs: '16px',
  sm: '18px',
  md: '20px',
  lg: '24px',
  xl: '32px',
} as const;

// =============================================================================
// LAYOUT & BREAKPOINTS (Responsive)
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const containerMaxWidth = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transition = {
  fast: '150ms ease',
  default: '200ms ease',
  slow: '300ms ease',
} as const;

// =============================================================================
// SIDEBAR
// =============================================================================

export const sidebar = {
  width: '260px',
  widthCollapsed: '72px',
} as const;
