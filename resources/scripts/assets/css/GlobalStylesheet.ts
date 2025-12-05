import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';

export default createGlobalStyle`
    * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }

    html {
        scroll-behavior: smooth;
    }

    body {
        ${tw`font-sans bg-neutral-900 text-neutral-100`};
        letter-spacing: 0.015em;
        background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
        position: relative;
        
        &::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(45, 80, 22, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(74, 157, 111, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-header font-semibold tracking-tight`};
        letter-spacing: -0.02em;
        color: rgba(var(--color-primary, 255 255 255) / 1);
    }

    h1 {
        font-size: 2.5rem;
        letter-spacing: -0.03em;
    }

    h2 {
        font-size: 2rem;
    }

    h3 {
        font-size: 1.5rem;
    }

    p {
        ${tw`text-neutral-200 leading-relaxed font-sans`};
        color: rgba(229, 231, 235, 0.9);
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Smooth scroll-bar styling */
    ::-webkit-scrollbar {
        background: none;
        width: 12px;
        height: 12px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(var(--color-primary, 100 150 200) / 0.5);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: padding-box;
        transition: background 0.3s ease;
        
        &:hover {
            background: rgba(var(--color-primary, 100 150 200) / 0.8);
            background-clip: padding-box;
        }
    }

    ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }

    /* Selection styling */
    ::selection {
        background: rgba(var(--color-primary, 100 150 200) / 0.5);
        color: #ffffff;
    }

    /* Animations */
    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    @keyframes glow {
        0%, 100% {
            box-shadow: 0 0 20px rgba(var(--color-primary, 100 150 200) / 0.3);
        }
        50% {
            box-shadow: 0 0 40px rgba(var(--color-primary, 100 150 200) / 0.6);
        }
    }

    @keyframes shimmer {
        0% {
            background-position: -1000px 0;
        }
        100% {
            background-position: 1000px 0;
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .float {
        animation: float 3s ease-in-out infinite;
    }

    .glow {
        animation: glow 2s ease-in-out infinite;
    }

    .slide-in {
        animation: slideIn 0.5s ease-out;
    }

    .fade-in {
        animation: fadeIn 0.5s ease-out;
    }
`;
