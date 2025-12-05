import React from 'react';
import tw from 'twin.macro';

interface BubbleButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
    primary: tw`
        bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
        hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
        text-white
        shadow-lg hover:shadow-glow-lg
    `,
    secondary: tw`
        bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700
        hover:from-gray-600 hover:via-gray-700 hover:to-gray-800
        text-white
        shadow-lg hover:shadow-glow-lg
    `,
    danger: tw`
        bg-gradient-to-br from-red-500 via-red-600 to-red-700
        hover:from-red-600 hover:via-red-700 hover:to-red-800
        text-white
        shadow-lg hover:shadow-glow-lg
    `,
    success: tw`
        bg-gradient-to-br from-green-500 via-green-600 to-green-700
        hover:from-green-600 hover:via-green-700 hover:to-green-800
        text-white
        shadow-lg hover:shadow-glow-lg
    `,
};

const sizeStyles = {
    sm: tw`px-4 py-2 text-sm rounded-lg`,
    md: tw`px-6 py-3 text-base rounded-xl`,
    lg: tw`px-8 py-4 text-lg rounded-2xl`,
};

export const BubbleButton: React.FC<BubbleButtonProps> = ({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            css={[
                tw`
                    font-semibold
                    transition-all duration-300
                    active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    backdrop-blur-sm
                    border border-white/20
                `,
                variantStyles[variant],
                sizeStyles[size],
            ]}
            className={className}
        >
            {children}
        </button>
    );
};
