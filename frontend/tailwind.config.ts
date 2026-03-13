import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111827',
          light: '#374151',
          dark: '#000000',
        },
        secondary: {
          DEFAULT: '#E1306C',
          light: '#FD1D1D',
          dark: '#833AB4',
        },
        background: {
          page: '#FFFFFF',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',
        light: '300',
        regular: '400',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      borderRadius: {
        card: '24px',
        button: '12px',
        input: '12px',
      },
      backgroundColor: {
        surface: '#FFFFFF',
        'page-bg': '#FFFFFF',
        'nav-active': 'var(--color-nav-active-bg)',
        'tab-active': 'var(--color-tab-active-bg)',
        'badge-accent': 'var(--color-badge-accent)',
        'logo-accent': 'var(--color-logo-accent)',
        'checkbox-checked': 'var(--color-checkbox-checked)',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        'button-primary': '0 4px 14px 0 rgba(193, 53, 132, 0.3)',
        glow: '0 0 40px -10px rgba(253, 29, 29, 0.3)',
      },
      backgroundImage: {
        'gradient-page': 'var(--gradient-page)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-sidebar': 'var(--gradient-sidebar)',
        'gradient-header': 'var(--gradient-header)',
        'gradient-active-nav': 'var(--gradient-active-nav)',
        'gradient-button-primary': 'var(--gradient-button-primary)',
        'gradient-button-primary-hover': 'var(--gradient-button-primary-hover)',
        'gradient-button-colored': 'var(--gradient-button-colored)',
        'gradient-button-colored-hover': 'var(--gradient-button-colored-hover)',
        'gradient-ai-circle': 'var(--gradient-ai-circle)',
        'gradient-progress': 'var(--gradient-progress)',
        'gradient-badge-success': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
        'gradient-input': 'var(--bg-card)',
        'gradient-logo': 'var(--gradient-logo)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-crm': 'var(--gradient-crm)',
        'gradient-catalogue': 'var(--gradient-catalogue)',
        
        /* Dark mode gradients mapping */
        'gradient-page-dark': 'var(--gradient-page)',
        'gradient-card-dark': 'var(--gradient-card)',
        'gradient-sidebar-dark': 'var(--gradient-sidebar)',
        'gradient-header-dark': 'var(--gradient-header)',
        'gradient-active-nav-dark': 'var(--gradient-active-nav)',
        'gradient-input-dark': 'var(--bg-card)',
      },
      keyframes: {
        'dropdown-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dropdown-item': {
          '0%': { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'diagram-node-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'diagram-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.95' },
        },
        'diagram-line-draw': {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'dropdown-in': 'dropdown-in 0.2s ease-out forwards',
        'dropdown-item': 'dropdown-item 0.2s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'glow-ring': 'glow-ring 2s ease-out infinite',
        'diagram-node-in': 'diagram-node-in 0.5s ease-out forwards',
        'diagram-pulse': 'diagram-pulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;