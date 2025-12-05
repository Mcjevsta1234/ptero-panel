import React from 'react';
import tw from 'twin.macro';

interface BubbleCardProps {
    children: React.ReactNode;
    hover?: boolean;
    className?: string;
    onClick?: () => void;
}

export const BubbleCard: React.FC<BubbleCardProps> = ({
    children,
    hover = true,
    className,
    onClick,
}) => {
    return (
        <div
            css={[
                tw`
                    relative rounded-bubble
                    bg-white/5 dark:bg-black/20
                    backdrop-blur-md
                    border border-white/10 dark:border-white/5
                    p-6
                    transition-all duration-300
                    overflow-hidden
                `,
                hover && tw`
                    hover:bg-white/10 dark:hover:bg-black/30
                    hover:border-white/20 dark:hover:border-white/10
                    hover:shadow-glow
                    cursor-pointer
                `,
            ]}
            onClick={onClick}
            className={className}
        >
            {/* Glow effect background */}
            <div css={tw`
                absolute inset-0 opacity-0 hover:opacity-100
                transition-opacity duration-300
                bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent
                rounded-bubble
                pointer-events-none
            `} />
            
            {/* Content */}
            <div css={tw`relative z-10`}>
                {children}
            </div>
        </div>
    );
};
