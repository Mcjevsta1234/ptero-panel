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
                header: ['"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
                sans: ["var(--font-family)"], 
            },
            colors: {
                black: '#131a20',
                // "primary" and "neutral" are deprecated, prefer the use of "blue" and "gray"
                // in new code.
                primary: colors.blue,
                gray: gray,
                neutral: gray,
                cyan: colors.cyan,
                witchyworlds: witchyworlds('--color-primary'),
                success: witchyworlds('--color-success'),
                danger: witchyworlds('--color-danger'),
                secondary: witchyworlds('--color-secondary'),
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
            borderRadius: {
                ui: 'var(--radius)',
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