import React from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

interface TitleProps {
    className?: string;
    children: React.ReactNode;
    scheme?: 'gray' | 'primary';
}

const Gradient = styled.div`
    ${tw`leading-tight bg-gradient-to-tl bg-clip-text text-transparent font-semibold`}
`;

const gradientClasses: Record<NonNullable<TitleProps['scheme']>, string> = {
    primary: 'from-witchyworlds/60 via-witchyworlds/80 to-witchyworlds/90',
    gray: 'from-gray-50 via-gray-100 to-gray-200',
};

export const Title = ({ className, children, scheme = 'gray' }: TitleProps) => {
    const colorClass = gradientClasses[scheme];

    return <Gradient className={classNames(colorClass, className)}>{children}</Gradient>;
};

export default Title;
