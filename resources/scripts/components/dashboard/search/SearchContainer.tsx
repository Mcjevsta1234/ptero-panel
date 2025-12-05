import React, { useEffect, useState } from 'react';
import useEventListener from '@/plugins/useEventListener';
import SearchModal from '@/components/dashboard/search/SearchModal';
import { SearchIcon } from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation('dashboard/index');
    const [visible, setVisible] = useState(false);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(navigator.platform.toLowerCase().includes('mac'));
    }, []);

    useEventListener('keydown', (e: KeyboardEvent) => {
        const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
        const isTyping = tagName === 'input' || tagName === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

        if (!isTyping) {
            if (
                (isMac && e.metaKey && e.key.toLowerCase() === 'k') ||
                (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')
            ) {
                e.preventDefault();
                setVisible(true);
            }
        }
    });

    return (
        <>
            {visible && <SearchModal appear visible={visible} onDismissed={() => setVisible(false)} />}
            <button
                type='button'
                aria-label='Search'
                onClick={() => setVisible(true)}
                style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, rgba(15, 40, 24, 0.3), rgba(10, 14, 39, 0.5))',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'rgba(167, 139, 250, 0.6)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.2)';
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <SearchIcon style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(167, 139, 250, 0.6)' }} />
                <div className='hidden md:block w-full text-left'>
                    <span>{t('search.label')}</span>
                </div>

                <div className='hidden md:flex items-center gap-1 text-xs ml-auto' style={{ color: 'rgba(167, 139, 250, 0.6)' }}>
                    <kbd
                        style={{
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            background: 'linear-gradient(135deg, rgba(15, 40, 24, 0.5), rgba(10, 14, 39, 0.7))',
                            border: '1px solid rgba(167, 139, 250, 0.2)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: isMac ? '0.875rem' : undefined,
                            fontWeight: isMac ? '500' : undefined
                        }}
                    >
                        {isMac ? '⌘' : 'Ctrl'}
                    </kbd>
                    <kbd style={{
                        padding: '0.125rem 0.25rem',
                        borderRadius: '0.25rem',
                        background: 'linear-gradient(135deg, rgba(15, 40, 24, 0.5), rgba(10, 14, 39, 0.7))',
                        border: '1px solid rgba(167, 139, 250, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }}>K</kbd>
                </div>
            </button>
        </>
    );
};
