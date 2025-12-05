import React, { SelectHTMLAttributes } from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface BubbleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Array<{ value: string | number; label: string }>;
}

export const BubbleSelect: React.FC<BubbleSelectProps> = ({
    label,
    error,
    options,
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
                <select
                    css={tw`
                        w-full appearance-none
                        px-4 py-3 pr-10
                        rounded-xl
                        bg-white/5 dark:bg-black/20
                        border border-white/10 dark:border-white/5
                        text-neutral-100 dark:text-neutral-50
                        backdrop-blur-sm
                        transition-all duration-300
                        focus:bg-white/10 dark:focus:bg-black/30
                        focus:border-blue-500/50
                        focus:shadow-lg focus:shadow-blue-500/20
                        focus:outline-none
                        cursor-pointer
                    `}
                    className={className}
                    {...props}
                >
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            css={tw`bg-neutral-900 text-neutral-100`}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                
                <div css={tw`
                    absolute right-3 top-1/2 transform -translate-y-1/2
                    text-neutral-400 pointer-events-none
                `}>
                    <FontAwesomeIcon icon={faChevronDown} css={tw`w-4 h-4`} />
                </div>
            </div>
            
            {error && (
                <p css={tw`text-red-400 text-sm mt-2 ml-1`}>
                    {error}
                </p>
            )}
        </div>
    );
};
