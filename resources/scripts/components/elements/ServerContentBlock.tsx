import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';
import Title from '@/witchyworlds/ui/Title';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import PowerButtons from '@/components/server/console/PowerButtons';

interface Props extends PageContentBlockProps {
    title: string;
    showStats?: boolean;
}

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const ServerContentBlock: React.FC<Props> = ({ title, children, showStats = false, ...props }) => {
    const servername = ServerContext.useStoreState((state) => state.server.data!.name);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const serverAllocation = ServerContext.useStoreState((state) => 
        state.server.data!.allocations.find((a) => a.isDefault)
    );
    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let parsedStats: any = {};
        try {
            parsedStats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: parsedStats.memory_bytes,
            cpu: parsedStats.cpu_absolute,
            disk: parsedStats.disk_bytes,
            tx: parsedStats.network.tx_bytes,
            rx: parsedStats.network.rx_bytes,
            uptime: parsedStats.uptime || 0,
        });
    });

    const isOffline = status === 'offline' || status === null;
    const memoryLimitBytes = limits.memory * 1024 * 1024;
    const diskLimitBytes = limits.disk * 1024 * 1024;

    const cpuPercent = isOffline ? 0 : Math.min(100, Math.round(stats.cpu));
    const memoryPercent = isOffline ? 0 : Math.min(100, Math.round((stats.memory / memoryLimitBytes) * 100));

    return (
        <PageContentBlock title={`(${servername}) ${title} | ${name}`} {...props}>
            {showStats ? (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Server Name */}
                        <div className="flex items-center gap-3">
                            <Title className='text-2xl'>{servername}</Title>
                        </div>

                        {/* Center: Stats */}
                        <div className="flex flex-wrap items-center gap-2 flex-1 justify-center">
                            {/* IP */}
                            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    <span className="text-sm font-medium text-white blur-sm hover:blur-none transition-all cursor-pointer">
                                        {serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* CPU */}
                            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                    <span className="text-sm font-medium text-white">{cpuPercent}%</span>
                                </div>
                            </div>

                            {/* RAM */}
                            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    <span className="text-sm font-medium text-white">
                                        {isOffline ? '0 MB' : `${bytesToString(stats.memory)} / ${bytesToString(memoryLimitBytes)}`}
                                    </span>
                                </div>
                            </div>

                            {/* Disk */}
                            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-white">
                                        {isOffline ? '0 MB / 0 GB' : `${bytesToString(stats.disk)} / ${bytesToString(diskLimitBytes)}`}
                                    </span>
                                </div>
                            </div>

                            {/* UUID */}
                            <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    <span className="text-xs font-mono text-gray-300">
                                        {serverUuid.split('-')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Power Buttons */}
                        <PowerButtons className="flex gap-2 flex-shrink-0" />
                    </div>
                </div>
            ) : (
                <div className="flex items-center mb-4">
                    <Title className='text-4xl'>{title}</Title>
                </div>
            )}
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
