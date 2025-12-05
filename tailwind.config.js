const colors = require('tailwindcss/colors');

function witchyworlds(variable) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${variable}) / ${opacityValue})`
      : `rgb(var(${variable}))`;
}

const gray = {
    50: witchyworlds('--color-50'),
    100: witchyworlds('--color-100'),
    200: witchyworlds('--color-200'),
    300: witchyworlds('--color-300'),
    400: witchyworlds('--color-400'),
    500: witchyworlds('--color-500'),
    600: witchyworlds('--color-600'),
    700: witchyworlds('--color-700'),
    800: witchyworlds('--color-800'),
    900: witchyworlds('--color-900'),
};

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                header: ['"Poppins"', '"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
                sans: ["var(--font-family)"], 
            },
            colors: {
                black: '#0a0f1c',
                primary: colors.blue,
                gray: gray,
                neutral: gray,
                cyan: colors.cyan,
                witchyworlds: witchyworlds('--color-primary'),
                success: witchyworlds('--color-success'),
                danger: witchyworlds('--color-danger'),
                secondary: witchyworlds('--color-secondary'),
                // Nature-inspired colors
                'nature-green': '#2d5016',
                'nature-leaf': '#4a9d6f',
                'nature-moss': '#6b8e60',
                'nature-forest': '#1a3a1a',
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
                350: '350ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
            borderRadius: {
                ui: 'var(--radius)',
                'bubble': '2rem',
                'mega': '3rem',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(var(--color-primary, 100 150 200) / 0.3)',
                'glow-lg': '0 0 40px rgba(var(--color-primary, 100 150 200) / 0.4)',
                'bubble': '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 -2px 10px rgba(255, 255, 255, 0.1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};