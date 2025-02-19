/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            'pre': {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              color: 'var(--tw-prose-pre-code)',
              marginTop: '1.5em',
              marginBottom: '1.5em',
              padding: '1.25em',
              borderRadius: '0.75rem',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              overflow: 'auto'
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: '400',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
              display: 'block',
              overflow: 'visible',
              whiteSpace: 'pre',
              position: 'relative'
            },
            'code': {
              color: 'var(--tw-prose-code)',
              fontWeight: '500',
              fontSize: '0.875em',
              backgroundColor: 'var(--tw-prose-code-bg)',
              padding: '0.25em 0.375em',
              borderRadius: '0.375rem'
            }
          }
        },
        invert: {
          css: {
            '--tw-prose-pre-bg': 'rgb(17 24 39)',
            '--tw-prose-pre-code': 'rgb(229 231 235)',
            '--tw-prose-code': 'rgb(229 231 235)',
            '--tw-prose-code-bg': 'rgba(139, 92, 246, 0.1)'
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 