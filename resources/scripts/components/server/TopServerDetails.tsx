import React, { useEffect, useState, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import PowerButtons from '@/components/server/console/PowerButtons';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import Can from '@/components/elements/Can';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Card from '@/witchyworlds/ui/Card';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Title from '@/witchyworlds/ui/Title';
import { StatBlock } from '@/witchyworlds/ui/StatBlock';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Blur from '@/witchyworlds/ui/Blur';
import { useTranslation } from 'react-i18next';
import { FaFloppyDisk, FaGlobe, FaHashtag, FaMemory, FaMicrochip, FaDiscord } from 'react-icons/fa6';
import { CreditCardIcon, StatusOnlineIcon, GlobeIcon, BookOpenIcon, LightningBoltIcon } from '@heroicons/react/solid';

type Stats = Record<'memory' | 'cpu' | 'disk', number>;

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'text-xs text-gray-300'}>/ {limit || <>&infin;</>}</span>
    </>
);

const Container = styled.div`
    ${tw`relative z-10 pt-4`};
`;

const SocialIcon = styled.a`
    ${tw`relative flex items-center justify-center w-9 h-9 bg-gray-800 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer group`}
    
    svg {
        ${tw`w-5 h-5 text-gray-300`}
    }
    
    &:hover svg {
        ${tw`text-witchyworlds`}
    }
    
    /* Tooltip */
    &::after {
        content: attr(data-tooltip);
        ${tw`absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none transition-opacity`}
    }
    
    &:hover::after {
        ${tw`opacity-100`}
    }
`;

const TopServerDetails = () => {
    const [stats, setStats] = useState<Stats>({
        memory: 0,
        cpu: 0,
        disk: 0,
    });

    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    
    const socialBilling = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialBilling);
    const socialStatus = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialStatus);
    const socialDiscord = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialDiscord);
    const socialWebsite = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialWebsite);
    const socialKnowledgebase = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialKnowledgebase);
    const socialTrials = useStoreState((state: ApplicationStore) => state.witchyworlds.data?.socialTrials);

    const trialsUrl = (socialTrials && socialTrials.trim() !== '') ? socialTrials.trim() : 'https://trials.witchyworlds.top';

    const socials = [
        { icon: GlobeIcon, label: 'Website', url: socialWebsite },
        { icon: LightningBoltIcon, label: 'Trials', url: trialsUrl },
        { icon: CreditCardIcon, label: 'Client Area', url: socialBilling },
        { icon: BookOpenIcon, label: 'Knowledgebase', url: socialKnowledgebase },
        { icon: StatusOnlineIcon, label: 'Status Page', url: socialStatus },
        { icon: FaDiscord, label: 'Discord', url: socialDiscord },
    ].filter(link => link.url && link.url.trim() !== '');

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits]
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
        });
    });

    return (
        <Container>
            <Card className={`!p-4 !px-6 w-full !bg-gray-700`}>
                <div className='flex items-center justify-between gap-4 mb-4'>
                    <div className={'flex items-center gap-x-3'}>
                        <Title className='text-3xl'>{name}</Title>
                        {rootAdmin && (
                            // eslint-disable-next-line react/jsx-no-target-blank
                            <a href={`/admin/servers/view/${serverId}`} target={'_blank'} className='h-5 w-5'>
                                <ExternalLinkIcon />
                            </a>
                        )}
                    </div>
                    
                    <div className='flex items-center gap-3'>
                        {/* Social Icons */}
                        {socials.map((social, index) => (
                            <SocialIcon
                                key={index}
                                href={social.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                data-tooltip={social.label}
                            >
                                <social.icon />
                            </SocialIcon>
                        ))}
                        
                        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                            <PowerButtons className='grid grid-cols-3 gap-2 ml-2' />
                        </Can>
                    </div>
                </div>
                
                {/* Stats row - centered */}
                <div className='flex items-center justify-center gap-2 flex-wrap'>
                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaGlobe />
                        </span>
                        <CopyOnClick text={allocation}>
                            <Blur className={`text-sm text-gray-100`}>{allocation}</Blur>
                        </CopyOnClick>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaMicrochip />
                        </span>
                        <span className='text-sm text-gray-100'>
                            {status === 'offline' ? (
                                <Limit limit={textLimits.cpu}>0%</Limit>
                            ) : (
                                <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                            )}
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaMemory />
                        </span>
                        <span className='text-sm text-gray-100'>
                            {status === 'offline' ? (
                                <Limit limit={textLimits.memory}>0 MiB</Limit>
                            ) : (
                                <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                            )}
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaFloppyDisk />
                        </span>
                        <span className='text-sm text-gray-100'>
                            <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaHashtag />
                        </span>
                        <CopyOnClick text={id}>
                            <span className='text-sm text-gray-100'>{id}</span>
                        </CopyOnClick>
                    </StatBlock>
                </div>
            </Card>
        </Container>
    );
};
export default TopServerDetails;
