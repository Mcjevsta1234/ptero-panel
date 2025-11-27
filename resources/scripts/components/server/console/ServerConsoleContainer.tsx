import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import ConsoleBlock from '@/components/server/console/ConsoleBlock';
import ServerStatsWithGraphs from '@/components/server/console/ServerStatsWithGraphs';
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
            
            <Spinner.Suspense>
                <ServerStatsWithGraphs />
            </Spinner.Suspense>

            <div className='grid lg:grid-cols-4 gap-4'>
                <div className='lg:col-span-3 space-y-4'>
                    <Spinner.Suspense>
                        <ConsoleBlock />
                    </Spinner.Suspense>
                    <Features enabled={eggFeatures} />
                </div>
                <div className='lg:col-span-1'>
                    <Spinner.Suspense>
                        <SocialsSection className='h-full' />
                    </Spinner.Suspense>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
