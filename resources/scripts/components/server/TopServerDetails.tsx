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
import { useStoreState } from 'easy-peasy';
import Blur from '@/witchyworlds/ui/Blur';
import { FaFloppyDisk, FaGlobe, FaHashtag, FaMemory, FaMicrochip } from 'react-icons/fa6';

type Stats = Record<'memory' | 'cpu' | 'disk', number>;

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'text-xs text-gray-300'}>/ {limit || <>&infin;</>}</span>
    </>
);

const Container = styled.div`${tw`relative z-10 pt-4 pl-2`}`;

const TopServerDetails = () => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0 });
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    const textLimits = useMemo(() => ({
        cpu: limits?.cpu ? `${limits.cpu}%` : null,
        memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
        disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
    }), [limits]);

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((a) => a.isDefault);
        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    useEffect(() => {
        if (!connected || !instance) return;
        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        try {
            const parsed = JSON.parse(data);
            setStats({ memory: parsed.memory_bytes, cpu: parsed.cpu_absolute, disk: parsed.disk_bytes });
        } catch {/* ignore */}
    });

    const statusBadge = useMemo(() => {
        switch (status) {
            case 'running': return { class: 'bg-green-700/60 text-green-200', text: 'Online' };
            case 'offline': return { class: 'bg-gray-600 text-gray-300', text: 'Offline' };
            case 'starting': return { class: 'bg-yellow-700/60 text-yellow-200', text: 'Starting' };
            case 'stopping': return { class: 'bg-yellow-700/60 text-yellow-200', text: 'Stopping' };
            default: return { class: 'bg-gray-600 text-gray-300', text: 'Unknown' };
        }
    }, [status]);

    return (
        <Container>
            <Card className='!p-4 !px-6 mx-auto w-full max-w-[1200px] !bg-gray-700'>
                <div className='flex items-center justify-between gap-4 flex-wrap mb-2'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        <Title className='text-2xl'>{name}</Title>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-ui tracking-wide uppercase ${statusBadge.class}`}>{statusBadge.text}</span>
                        {rootAdmin && (
                            // eslint-disable-next-line react/jsx-no-target-blank
                            <a href={`/admin/servers/view/${serverId}`} target='_blank' className='h-5 w-5 text-gray-300'>
                                <ExternalLinkIcon />
                            </a>
                        )}
                    </div>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className='flex gap-2' />
                    </Can>
                </div>
                <div className='flex items-center gap-5 flex-wrap text-sm'>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaGlobe className='w-4 h-4 text-gray-400' />
                        <CopyOnClick text={allocation}><Blur className='text-sm'>{allocation}</Blur></CopyOnClick>
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaMicrochip className='w-4 h-4 text-gray-400' />
                        {status === 'offline' ? <Limit limit={textLimits.cpu}>0%</Limit> : <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>}
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaMemory className='w-4 h-4 text-gray-400' />
                        {status === 'offline' ? <Limit limit={textLimits.memory}>0 MiB</Limit> : <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>}
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaFloppyDisk className='w-4 h-4 text-gray-400' />
                        <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaHashtag className='w-4 h-4 text-gray-400' />
                        <CopyOnClick text={id}><span>{id}</span></CopyOnClick>
                    </div>
                </div>
            </Card>
        </Container>
    );
};

export default TopServerDetails;
