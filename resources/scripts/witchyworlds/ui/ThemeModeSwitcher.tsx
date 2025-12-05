import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';

type ThemeMode = 'dark' | 'light';

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

const applyThemeMode = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    
    if (mode === 'dark') {
        html.classList.add('dark-mode');
        html.classList.remove('light-mode');
        // Dark theme background
        const root = html.style;
        root.setProperty('--bg-primary', '#0f1419');
        root.setProperty('--bg-secondary', '#1a2332');
        root.setProperty('--bg-tertiary', '#232f45');
        root.setProperty('--text-primary', '#e5e7eb');
        root.setProperty('--text-secondary', '#9ca3af');
    } else {
        html.classList.add('light-mode');
        html.classList.remove('dark-mode');
        // Light theme background
        const root = html.style;
        root.setProperty('--bg-primary', '#fafbfc');
        root.setProperty('--bg-secondary', '#f3f4f6');
        root.setProperty('--bg-tertiary', '#e5e7eb');
        root.setProperty('--text-primary', '#1f2937');
        root.setProperty('--text-secondary', '#6b7280');
    }
};

export const ThemeModeSwitcher = () => {
    const [mode, setMode] = useState<ThemeMode>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Check for saved preference
        const saved = getCookie('theme-mode') as ThemeMode | null;
        if (saved && (saved === 'dark' || saved === 'light')) {
            setMode(saved);
            applyThemeMode(saved);
        } else {
            // Default to dark
            setMode('dark');
            applyThemeMode('dark');
        }
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        setCookie('theme-mode', newMode);
        applyThemeMode(newMode);
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggleMode}
            css={tw`
                p-2 rounded-full
                bg-white/5 dark:bg-black/20
                border border-white/10 dark:border-white/5
                backdrop-blur-sm
                hover:bg-white/10 dark:hover:bg-black/30
                hover:border-white/20 dark:hover:border-white/10
                transition-all duration-300
                text-neutral-400 hover:text-neutral-200
            `}
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
            {mode === 'dark' ? (
                <FontAwesomeIcon icon={faSun} css={tw`w-5 h-5`} />
            ) : (
                <FontAwesomeIcon icon={faMoon} css={tw`w-5 h-5`} />
            )}
        </button>
    );
};
