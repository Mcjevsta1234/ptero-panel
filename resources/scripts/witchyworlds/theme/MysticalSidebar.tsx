import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { Link, NavLink } from 'react-router-dom';
import Avatar from '@/witchyworlds/ui/Avatar';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { useTranslation } from 'react-i18next';
import { FaHouse, FaDiscord } from 'react-icons/fa6';
import {
    CashIcon as BanknotesIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    LightBulbIcon,
    BeakerIcon,
} from '@heroicons/react/solid';
import { EnchantedSidebar, EnchantedNav, RuneCircle } from '@/witchyworlds/theme/WitchyDesignSystem';

interface Props {
    isOpen?: boolean;
    children?: React.ReactNode;
    dashboard?: boolean;
}

const SidebarContainer = styled(EnchantedSidebar)<{ isOpen: boolean }>`
    ${({ isOpen }) => (isOpen ? tw`fixed top-20 left-0 translate-x-0` : tw`-translate-x-full hidden`)}

    height: calc(100dvh - 80px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    @media (min-width: 1024px) {
        position: fixed;
        top: 80px;
        left: 0;
        transform: translateX(0);
        display: flex;
        flex-direction: column;
        height: calc(100dvh - 100px);
        overflow-y: auto;
    }
`;

const ProfileCard = styled.div`
    ${tw`sticky top-0 z-10 p-5 mb-4 mt-2 mx-2`}
    background: linear-gradient(135deg, 
        rgba(107, 33, 168, 0.15) 0%,
        rgba(45, 106, 79, 0.1) 100%
    );
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
`;

const ProfileContent = styled.div`
    ${tw`flex items-center gap-3`}
`;

const ProfileInfo = styled.div`
    ${tw`flex flex-col flex-1`}
    
    .role {
        ${tw`text-xs font-semibold uppercase tracking-widest`}
        color: rgba(167, 139, 250, 0.6);
        letter-spacing: 0.15em;
    }
    
    .name {
        ${tw`text-sm font-bold mt-1`}
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.8), rgba(6, 182, 212, 0.8));
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
`;

const SocialLinksSection = styled.div`
    ${tw`mt-auto pt-4 mb-2 mx-2`}
    border-top: 1px solid rgba(167, 139, 250, 0.1);
`;

const SocialGrid = styled.div`
    ${tw`grid grid-cols-2 gap-2 p-3`}
`;

const SocialLink = styled.a`
    ${tw`flex flex-col items-center justify-center gap-2 p-3 rounded-lg transition-all duration-300`}
    background: linear-gradient(135deg, rgba(45, 106, 79, 0.2), rgba(107, 33, 168, 0.1));
    border: 1px solid rgba(167, 139, 250, 0.1);
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    svg {
        ${tw`w-4 h-4`}
    }
    
    &:hover {
        background: linear-gradient(135deg, rgba(45, 106, 79, 0.4), rgba(167, 139, 250, 0.2));
        border-color: rgba(167, 139, 250, 0.3);
        color: rgba(167, 139, 250, 1);
        transform: translateY(-2px);
        box-shadow: 0 0 15px rgba(167, 139, 250, 0.2);
    }
`;

const SidebarContent = styled.div`
    ${tw`flex flex-col flex-1 overflow-y-auto px-2 py-3`}
    gap: 0.5rem;
`;

const Sidebar = ({ children, isOpen = false, dashboard = false }: Props) => {
    const { t } = useTranslation('routes');
    const nameFirst = useStoreState((state) => state.user.data?.name_first);
    const nameLast = useStoreState((state) => state.user.data?.name_last);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    
    const socialBilling = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialBilling);
    const socialStatus = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialStatus);
    const socialDiscord = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialDiscord);
    const socialWebsite = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialWebsite);
    const socialKnowledgebase = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialKnowledgebase);
    const socialTrials = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialTrials);

    const socialsOrdered = [
        { icon: <BanknotesIcon />, label: 'Billing', url: socialBilling },
        { icon: <CheckCircleIcon />, label: 'Status', url: socialStatus },
        { icon: <FaDiscord />, label: 'Discord', url: socialDiscord },
        { icon: <GlobeAltIcon />, label: 'Website', url: socialWebsite },
        { icon: <LightBulbIcon />, label: 'KB', url: socialKnowledgebase },
        { icon: <BeakerIcon />, label: 'Trials', url: socialTrials },
    ].filter(s => s.url);

    return (
        <SidebarContainer isOpen={isOpen}>
            <ProfileCard>
                <ProfileContent>
                    <Link to='/account'>
                        <Avatar className='w-10' />
                    </Link>
                    <ProfileInfo>
                        <div className='role'>
                            {rootAdmin ? (
                                <>
                                    <RuneCircle status='active' style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                                    Administrator
                                </>
                            ) : (
                                <>
                                    <RuneCircle status='active' style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                                    {name} User
                                </>
                            )}
                        </div>
                        <Link to='/account'>
                            <span className='name'>
                                {nameFirst} {nameLast}
                            </span>
                        </Link>
                    </ProfileInfo>
                </ProfileContent>
            </ProfileCard>

            <SidebarContent>
                {dashboard && (
                    <EnchantedNav>
                        <NavLink className='mt-2' to='/' exact>
                            <span className='flex items-center gap-2'>
                                <FaHouse className='w-4 h-4' /> 
                                <span>{t('index.dashboard')}</span>
                            </span>
                        </NavLink>
                        {rootAdmin && (
                            <NavLink to='/admin' exact>
                                <span className='flex items-center gap-2'>
                                    <BeakerIcon className='w-4 h-4' />
                                    <span>{t('index.admin')}</span>
                                </span>
                            </NavLink>
                        )}
                    </EnchantedNav>
                )}
                {children && <EnchantedNav>{children}</EnchantedNav>}
            </SidebarContent>

            {socialsOrdered.length > 0 && (
                <SocialLinksSection>
                    <SocialGrid>
                        {socialsOrdered.map((social, index) => (
                            <SocialLink
                                key={index}
                                href={social.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                title={social.label}
                            >
                                {social.icon}
                                <span>{social.label}</span>
                            </SocialLink>
                        ))}
                    </SocialGrid>
                </SocialLinksSection>
            )}
        </SidebarContainer>
    );
};

export default Sidebar;
