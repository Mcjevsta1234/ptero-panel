import React from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface BubbleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

export const BubbleModal: React.FC<BubbleModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}) => {
    if (!isOpen) return null;

    return (
        <div css={tw`
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/40 backdrop-blur-sm
            transition-opacity duration-300
        `} onClick={onClose}>
            <div
                css={tw`
                    w-full mx-4
                    rounded-bubble
                    bg-gradient-to-br from-white/10 to-white/5
                    dark:from-black/40 dark:to-black/20
                    border border-white/20 dark:border-white/10
                    backdrop-blur-xl
                    shadow-2xl
                    transition-all duration-300
                `}
                style={{
                    animation: 'slideIn 0.5s ease-out',
                }}
                className={sizeClasses[size]}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div css={tw`
                    flex items-center justify-between
                    px-6 py-4
                    border-b border-white/10 dark:border-white/5
                `}>
                    {title && (
                        <h3 css={tw`
                            text-lg font-bold
                            text-neutral-100 dark:text-neutral-50
                        `}>
                            {title}
                        </h3>
                    )}
                    <button
                        onClick={onClose}
                        css={tw`
                            p-1
                            rounded-lg
                            text-neutral-400 hover:text-neutral-200
                            hover:bg-white/10
                            dark:hover:bg-white/5
                            transition-all duration-200
                        `}
                    >
                        <FontAwesomeIcon icon={faTimes} css={tw`w-5 h-5`} />
                    </button>
                </div>

                {/* Content */}
                <div css={tw`px-6 py-4`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div css={tw`
                        px-6 py-4
                        border-t border-white/10 dark:border-white/5
                        flex justify-end gap-3
                    `}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
