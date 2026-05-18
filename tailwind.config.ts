import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          light: '#FF8C35',
          dark: '#E55500',
        },
        navy: {
          DEFAULT: '#0F1F5C',
          light: '#1B3A8A',
          mid: '#2D4FB5',
        },
        green: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#86EFAC',
        },
        background: '#F4F6FF',
        surface: '#FFFFFF',
        'surface-variant': '#F0F4FF',
        'light-grey': '#E8EDF8',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        'text-primary': '#0F1F5C',
        'text-secondary': '#64748B',
        'text-light': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B00, #FF9A3C)',
        'gradient-navy': 'linear-gradient(135deg, #0F1F5C, #1B3A8A)',
        'gradient-green': 'linear-gradient(135deg, #22C55E, #16A34A)',
        'gradient-splash': 'linear-gradient(180deg, #0A1642, #0F1F5C, #162470)',
      },
      boxShadow: {
        card: '0 2px 12px rgba(15, 31, 92, 0.06)',
        'card-hover': '0 8px 24px rgba(15, 31, 92, 0.1)',
        primary: '0 6px 20px rgba(255, 107, 0, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;