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
import Blur from '@/witchyworlds/ui/Blur';
import { useTranslation } from 'react-i18next';
import { FaFloppyDisk, FaGlobe, FaHashtag, FaMemory, FaMicrochip } from 'react-icons/fa6';

type Stats = Record<'memory' | 'cpu' | 'disk', number>;

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'text-xs text-gray-300'}>/ {limit || <>&infin;</>}</span>
    </>
);

const Container = styled.div`
    ${tw`relative z-10 pt-4 pl-2`};
`;

const UtilContainer = styled.div`
    ${tw`mx-auto w-full md:flex items-center justify-between`};
    max-width: 1200px;
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

    const statusBadge = useMemo(() => {
        switch (status) {
            case 'running':
                return { class: 'bg-green-700/60 text-green-200', text: 'Online' };
            case 'offline':
                return { class: 'bg-gray-600 text-gray-300', text: 'Offline' };
            case 'starting':
                return { class: 'bg-yellow-700/60 text-yellow-200', text: 'Starting' };
            case 'stopping':
                return { class: 'bg-yellow-700/60 text-yellow-200', text: 'Stopping' };
            default:
                return { class: 'bg-gray-600 text-gray-300', text: 'Unknown' };
        }
    }, [status]);

    return (
        <Container>
            <Card className={`!p-6 !px-8 mx-auto w-full max-w-[1200px] !bg-gray-700`}>
                {/* Header Row: Name + Status + Admin Link */}
                <div className='flex items-center gap-3 flex-wrap mb-4'>
                    <Title className='text-3xl'>{name}</Title>
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-ui tracking-wide uppercase ${statusBadge.class}`}
                    >
                        {statusBadge.text}
                    </span>
                    {rootAdmin && (
                        // eslint-disable-next-line react/jsx-no-target-blank
                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'} className='h-5 w-5 text-gray-300'>
                            <ExternalLinkIcon />
                        </a>
                    )}
                </div>

                {/* Stats Row */}
                <div className='flex items-center gap-2 flex-wrap mb-6'>
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
                {/* Actions Row */}
                <div className='flex w-full justify-end'>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className='grid grid-cols-3 gap-2' />
                    </Can>
                </div>
            </Card>
        </Container>
    );
};
export default TopServerDetails;
