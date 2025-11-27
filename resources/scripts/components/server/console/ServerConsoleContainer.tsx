import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import ConsoleBlock from '@/components/server/console/ConsoleBlock';
import ConsoleSidebar from '@/components/server/console/ConsoleSidebar';
import SocialsSection from '@/components/server/console/SocialsSection';
import { Alert } from '@/components/elements/alert';
import { useTranslation } from 'react-i18next';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const { t } = useTranslation('server/console');
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    return (
        <ServerContentBlock title={t('title')}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? t('node-under-maintenance')
                        : isInstalling
                        ? t('server-installing')
                        : t('server-transferring')}
                </Alert>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4'>
                <div className='space-y-4 order-2 lg:order-1'>
                    <Spinner.Suspense>
                        <ConsoleBlock />
                    </Spinner.Suspense>
                    <SocialsSection />
                    <Features enabled={eggFeatures} />
                </div>
                <div className='order-1 lg:order-2'>
                    <Spinner.Suspense>
                        <ConsoleSidebar />
                    </Spinner.Suspense>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
