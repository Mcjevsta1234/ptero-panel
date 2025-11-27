import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React from 'react';
import { ServerContext } from '@/state/server';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';

interface Props extends PageContentBlockProps {
    title: string;
}

const ServerContentBlock: React.FC<Props> = ({ title, children, ...props }) => {
    const servername = ServerContext.useStoreState((state) => state.server.data!.name);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);

    return (
        <PageContentBlock title={`(${servername}) ${title} | ${name}`} {...props}>
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
