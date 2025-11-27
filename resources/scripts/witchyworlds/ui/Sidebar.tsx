import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { Link, NavLink } from 'react-router-dom';
import Avatar from '@/witchyworlds/ui/Avatar';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';
import { FaHouse } from 'react-icons/fa6';

interface Props {
    isOpen?: boolean;
    children?: React.ReactNode;
    dashboard?: boolean;
}

const Container = styled.div<{ isOpen: boolean }>`
    ${tw`w-[225px] self-start m-2 border border-gray-600 rounded-ui bg-gray-700 text-white flex flex-col z-40 transition-transform duration-300 ease-in-out`};

    ${({ isOpen }) => (isOpen ? tw`fixed top-16 left-0 translate-x-0` : tw`-translate-x-full hidden`)}

    height: calc(100dvh - 64px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    @media (min-width: 1024px) {
        position: fixed;
        top: 64px;
        left: 0;
        transform: translateX(0);
        display: flex;
        height: calc(100dvh - 100px);
        overflow-y: auto;
    }
`;

const ProfileHeader = styled.div`
    ${tw`sticky top-0 z-10 bg-gray-700 p-4 border-b border-gray-600`}
`;

const SidebarContent = styled.div`
    ${tw`flex flex-col flex-1 overflow-y-auto`}
`;

export const SideNavigation = styled.div`
    ${tw`flex flex-col gap-1 pb-4 -mt-1`};

    & .label {
        ${tw`flex items-center ml-2 mr-2 px-3 pt-2 pb-1 text-sm font-semibold text-gray-100 uppercase rounded-ui transition-all duration-300`};
    }
    a {
        ${tw`flex items-center ml-2 mr-2 px-5 py-2 text-sm font-medium text-gray-200 rounded-ui transition-all duration-300`};

        &:hover,
        &:focus,
        &.active {
            ${tw`text-witchyworlds`};
            background-color: rgb(var(--color-primary) / 0.2);
        }
    }
`;

const Sidebar = ({ children, isOpen = false, dashboard = false }: Props) => {
    const { t } = useTranslation('routes');
    const nameFirst = useStoreState((state) => state.user.data?.name_first);
    const nameLast = useStoreState((state) => state.user.data?.name_last);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);

    return (
        <Container isOpen={isOpen}>
            <ProfileHeader>
                <div className='flex items-center gap-3'>
                    <Link to='/account'>
                        <Avatar className='w-10' />
                    </Link>
                    <div className='flex flex-col'>
                        <div className='flex items-center gap-x-1'>
                            <span className='text-xs tracking-widest uppercase text-white/50'>
                                {rootAdmin ? 'Administrator' : name + ' User'}
                            </span>
                            {rootAdmin && (
                                // eslint-disable-next-line react/jsx-no-target-blank
                                <a href={`/admin`} target={'_blank'} className='h-5 w-5 text-white/70'>
                                    <ExternalLinkIcon />
                                </a>
                            )}
                        </div>
                        <Link to='/account'>
                            <span className='text-sm font-semibold'>
                                {nameFirst} {nameLast}
                            </span>
                        </Link>
                    </div>
                </div>
            </ProfileHeader>

            <SidebarContent>
                {dashboard && (
                    <SideNavigation>
                        <NavLink className='mt-2' to='/' exact>
                            <span className='flex items-center'>
                                <FaHouse className='w-5 mr-1' /> {t('index.dashboard')}
                            </span>
                        </NavLink>
                    </SideNavigation>
                )}
                {children && <SideNavigation>{children}</SideNavigation>}
            </SidebarContent>
        </Container>
    );
};

export default Sidebar;
