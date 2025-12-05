import React, { InputHTMLAttributes } from 'react';
import tw from 'twin.macro';

interface BubbleInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const BubbleInput: React.FC<BubbleInputProps> = ({
    label,
    error,
    icon,
    className,
    ...props
}) => {
    return (
        <div css={tw`w-full`}>
            {label && (
                <label css={tw`
                    block text-sm font-semibold
                    text-neutral-200 dark:text-neutral-100
                    mb-2 ml-1
                `}>
                    {label}
                </label>
            )}
            
            <div css={tw`relative`}>
                {icon && (
                    <div css={tw`
                        absolute left-4 top-1/2 transform -translate-y-1/2
                        text-neutral-400
                        pointer-events-none
                    `}>
                        {icon}
                    </div>
                )}
                
                <input
                    css={tw`
                        w-full
                        px-4 py-3
                        ${icon ? 'pl-12' : ''}
                        rounded-xl
                        bg-white/5 dark:bg-black/20
                        border border-white/10 dark:border-white/5
                        text-neutral-100 dark:text-neutral-50
                        placeholder-neutral-500 dark:placeholder-neutral-600
                        backdrop-blur-sm
                        transition-all duration-300
                        focus:bg-white/10 dark:focus:bg-black/30
                        focus:border-blue-500/50
                        focus:shadow-lg focus:shadow-blue-500/20
                        focus:outline-none
                    `}
                    className={className}
                    {...props}
                />
            </div>
            
            {error && (
                <p css={tw`text-red-400 text-sm mt-2 ml-1`}>
                    {error}
                </p>
            )}
        </div>
    );
};
