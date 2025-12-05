import React from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

interface TitleProps {
    className?: string;
    children: React.ReactNode;
    scheme?: 'gray' | 'primary' | 'nature';
}

const Gradient = styled.div`
    ${tw`leading-tight bg-gradient-to-r bg-clip-text text-transparent font-bold`}
`;

const gradientClasses: Record<NonNullable<TitleProps['scheme']>, string> = {
    primary: 'from-blue-400 via-blue-500 to-blue-600',
    nature: 'from-nature-leaf via-nature-green to-nature-moss',
    gray: 'from-neutral-200 via-neutral-300 to-neutral-400',
};

export const Title = ({ className, children, scheme = 'nature' }: TitleProps) => {
    const colorClass = gradientClasses[scheme];

    return <Gradient className={classNames(colorClass, className)}>{children}</Gradient>;
};

export default Title;
