import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import MysticalServerCard from '@/components/dashboard/MysticalServerCard';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { FlowingTitle, CrystallineCard, ArcaneButton, HexagonDivider } from '@/witchyworlds/theme/WitchyDesignSystem';
import { useTranslation } from 'react-i18next';

const DashboardHeader = styled.div`
    ${tw`grid lg:grid-cols-2 gap-6 mb-8`}
`;

const HeaderContent = styled.div`
    ${tw`flex flex-col justify-center`}
`;

const ToggleContainer = styled.div`
    ${tw`flex lg:justify-end justify-center items-center gap-4 pt-4`}
    
    label {
        ${tw`text-xs uppercase font-semibold tracking-widest cursor-pointer`}
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.7), rgba(6, 182, 212, 0.7));
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        
        input {
            ${tw`ml-2 cursor-pointer`}
        }
    }
`;

const ServerGrid = styled.div`
    ${tw`grid lg:grid-cols-2 gap-6`}
`;

const EmptyState = styled(CrystallineCard)`
    ${tw`col-span-1 lg:col-span-2 p-12 flex flex-col items-center justify-center text-center`}
    
    svg {
        ${tw`w-12 h-12 mb-4`}
        color: rgba(167, 139, 250, 0.4);
    }
    
    p {
        ${tw`text-neutral-400 text-sm`}
    }
`;

export default () => {
    const { t } = useTranslation('dashboard/index');
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock className='pr-4' title={t('title')} showFlashKey={'dashboard'}>
            <DashboardHeader>
                <HeaderContent>
                    <FlowingTitle>{t('title')}</FlowingTitle>
                    <p css={tw`text-neutral-400 text-sm mt-2`}>
                        {!servers ? 'Loading your servers...' : `You have ${servers.pagination.total} server${servers.pagination.total !== 1 ? 's' : ''}`}
                    </p>
                </HeaderContent>
                {rootAdmin && (
                    <ToggleContainer>
                        <label>
                            {showOnlyAdmin ? t('other-servers') : t('your-servers')}
                            <input
                                type='checkbox'
                                checked={showOnlyAdmin}
                                onChange={() => setShowOnlyAdmin((s) => !s)}
                            />
                        </label>
                    </ToggleContainer>
                )}
            </DashboardHeader>

            <HexagonDivider />

            <div css={tw`py-8`}>
                {!servers ? (
                    <Spinner centered size={'large'} />
                ) : (
                    <Pagination data={servers} onPageSelect={setPage}>
                        {({ items }) =>
                            items.length > 0 ? (
                                <ServerGrid>
                                    {items.map((server) => (
                                        <MysticalServerCard
                                            key={server.uuid}
                                            server={server}
                                        />
                                    ))}
                                </ServerGrid>
                            ) : (
                                <EmptyState>
                                    <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
                                    </svg>
                                    <p>{showOnlyAdmin ? t('no-other-servers') : t('no-servers')}</p>
                                </EmptyState>
                            )
                        }
                    </Pagination>
                )}
            </div>
        </PageContentBlock>
    );
};
