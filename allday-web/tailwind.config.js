/** Tema tomado del diseño de Google Stitch ("Vibrant Artisan Catalog"). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'surface-container': '#e7eeff', 'on-primary-fixed': '#2d0050', 'on-error': '#ffffff', 'on-tertiary-fixed': '#002021',
        'on-primary': '#ffffff', 'surface-bright': '#f9f9ff', tertiary: '#00494b', 'on-error-container': '#93000a',
        'surface-variant': '#d8e3fb', 'on-secondary-fixed-variant': '#5a4300', 'on-primary-fixed-variant': '#680eac',
        'inverse-on-surface': '#ecf1ff', 'secondary-fixed-dim': '#f6be0a', 'on-secondary': '#ffffff', 'tertiary-fixed': '#7df5f8',
        'surface-container-high': '#dee8ff', 'on-secondary-fixed': '#251a00', secondary: '#775a00', 'secondary-container': '#fdc416',
        'on-tertiary-container': '#67e1e4', 'surface-container-low': '#f0f3ff', 'secondary-fixed': '#ffdf98',
        'surface-container-lowest': '#ffffff', 'on-tertiary': '#ffffff', 'surface-dim': '#cfdaf2', error: '#ba1a1a',
        outline: '#7e7384', 'tertiary-container': '#006365', 'on-surface': '#111c2d', 'on-background': '#111c2d',
        'on-primary-container': '#e4c2ff', 'on-secondary-container': '#6d5200', 'primary-fixed': '#f1dbff',
        'error-container': '#ffdad6', 'surface-container-highest': '#d8e3fb', 'primary-fixed-dim': '#deb7ff',
        'surface-tint': '#8234c6', surface: '#f9f9ff', primary: '#6100a4', 'tertiary-fixed-dim': '#5dd8db',
        'on-surface-variant': '#4c4353', 'inverse-surface': '#263143', 'outline-variant': '#cfc2d5',
        'primary-container': '#7b2cbf', 'on-tertiary-fixed-variant': '#004f51', 'inverse-primary': '#deb7ff', background: '#f9f9ff',
        whatsapp: '#25D366', 'whatsapp-dark': '#1EBE5D',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
      spacing: {
        'gutter-desktop': '1.5rem', 'space-xs': '0.25rem', 'margin-tablet': '1.5rem', 'space-md': '1rem', 'space-xl': '2.5rem',
        'margin-desktop': '2.5rem', 'space-sm': '0.5rem', 'space-lg': '1.5rem', gutter: '1rem', margin: '1rem',
      },
      fontFamily: Object.fromEntries(['headline-lg', 'headline-md', 'headline-lg-mobile', 'label-lg', 'body-sm', 'body-md', 'body-lg',
        'headline-sm', 'label-sm', 'display-mobile', 'display', 'label-md', 'sans'].map((k) => [k, ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif']])),
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '700' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '700' }],
        'display-mobile': ['30px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '800' }],
        display: ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
