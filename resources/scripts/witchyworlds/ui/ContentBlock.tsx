import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React from 'react';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';
import Title from '@/witchyworlds/ui/Title';

interface Props extends PageContentBlockProps {
    title: string;
    description?: string;
}

const ContentBlock: React.FC<Props> = ({ title, description, children, ...props }) => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);

    return (
        <PageContentBlock title={`${title} | ${name}`} {...props}>
            <Title className='text-4xl mb-2'>{title}</Title>
            <p className='text-xs text-gray-500'>{description}</p>
            {children}
        </PageContentBlock>
    );
};

export default ContentBlock;
