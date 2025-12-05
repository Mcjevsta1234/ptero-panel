import React from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

interface CardProps {
    className?: string;
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

const CardDefault = styled.div`
    ${tw`rounded-bubble bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5 backdrop-blur-md`}
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 20px rgba(var(--color-primary, 59 130 246) / 0.1);

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 30px rgba(var(--color-primary, 59 130 246) / 0.15);
    }
`;

export default ({ className, children }: CardProps) => (
    <CardDefault className={classNames('p-6', className)}>{children}</CardDefault>
);
