import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          deep: '#4c1d95',
        },
        orchid: '#c026d3',
        wa: {
          DEFAULT: '#25d366',
          dark: '#128c7e',
          deep: '#075e54',
        },
        // Semantic theme tokens mapped to CSS variables
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        glass: 'var(--glass)',
        ink: 'var(--ink)',
        ink2: 'var(--ink2)',
        mute: 'var(--mute)',
        line: 'var(--line)',
        pill: 'var(--pill)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        ping: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        marquee: 'marquee 35s linear infinite',
        float: 'float 7s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
