import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import Card from '@/witchyworlds/ui/Card';
import Title from '@/witchyworlds/ui/Title';
import FlashMessageRender from '@/components/FlashMessageRender';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
    showFlashes?: string | boolean;
}

const TitledGreyBox = ({ icon, title, children, className, showFlashes }: Props) => (
    <Card css={tw`!p-0`} className={className}>
        <div css={tw`p-3`}>
            {typeof title === 'string' ? (
                <Title css={tw`text-sm`}>
                    {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2 text-neutral-300`} />}
                    {title}
                </Title>
            ) : (
                title
            )}
        </div>
        {showFlashes && (
            <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} css={tw`mb-4`} />
        )}
        <div css={tw`p-3`}>{children}</div>
    </Card>
);

export default memo(TitledGreyBox, isEqual);
