import React, { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/solid';
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
                relative inline-flex items-center justify-center
                w-12 h-12 rounded-full
                bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30
                border border-white/20 dark:border-white/10
                backdrop-blur-sm
                transition-all duration-300
                focus:outline-none
                group
            `}
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div css={tw`relative w-6 h-6`}>
                {mode === 'dark' ? (
                    <MoonIcon
                        css={tw`
                            w-6 h-6
                            text-yellow-300
                            transition-all duration-300
                            group-hover:scale-110
                        `}
                    />
                ) : (
                    <SunIcon
                        css={tw`
                            w-6 h-6
                            text-yellow-400
                            transition-all duration-300
                            group-hover:scale-110
                        `}
                    />
                )}
            </div>
        </button>
    );
};
