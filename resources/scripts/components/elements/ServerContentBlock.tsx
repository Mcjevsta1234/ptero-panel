import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';
import Title from '@/witchyworlds/ui/Title';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import UptimeDuration from '@/components/server/UptimeDuration';

interface Props extends PageContentBlockProps {
    title: string;
}

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const ServerContentBlock: React.FC<Props> = ({ title, children, ...props }) => {
    const servername = ServerContext.useStoreState((state) => state.server.data!.name);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

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

    return (
        <PageContentBlock title={`(${servername}) ${title} | ${name}`} {...props}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <Title className='text-4xl'>{title}</Title>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    {/* Uptime */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-wide text-xs">Uptime:</span>
                        <span className="text-white font-medium">
                            {isOffline ? (
                                'Offline'
                            ) : stats.uptime > 0 ? (
                                <UptimeDuration uptime={stats.uptime / 1000} />
                            ) : (
                                'Starting'
                            )}
                        </span>
                    </div>
                    {/* Network In */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-wide text-xs">RX:</span>
                        <span className="text-white font-medium">
                            {isOffline ? '0 B' : bytesToString(stats.rx)}
                        </span>
                    </div>
                    {/* Network Out */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 uppercase tracking-wide text-xs">TX:</span>
                        <span className="text-white font-medium">
                            {isOffline ? '0 B' : bytesToString(stats.tx)}
                        </span>
                    </div>
                </div>
            </div>
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
