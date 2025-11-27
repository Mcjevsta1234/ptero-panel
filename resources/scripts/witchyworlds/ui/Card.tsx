import React from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

interface CardProps {
    className?: string;
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

const CardDefault = styled.div`
    ${tw`rounded-ui bg-gray-700 border border-gray-600`}
`;

export default ({ className, children }: CardProps) => (
    <CardDefault className={classNames('p-5', className)}>{children}</CardDefault>
);
