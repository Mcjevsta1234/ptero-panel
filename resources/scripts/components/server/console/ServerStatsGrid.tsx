import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import UptimeDuration from '@/components/server/UptimeDuration';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

export default function ServerStatsGrid() {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

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

    // Convert limits from MB to bytes for proper comparison
    const memoryLimitBytes = limits.memory * 1024 * 1024;
    const diskLimitBytes = limits.disk * 1024 * 1024;

    // Calculate percentages
    const cpuPercent = isOffline ? 0 : Math.min(100, Math.round((stats.cpu / limits.cpu) * 100));
    const memoryPercent = isOffline ? 0 : Math.min(100, Math.round((stats.memory / memoryLimitBytes) * 100));
    const diskPercent = isOffline ? 0 : Math.min(100, Math.round((stats.disk / diskLimitBytes) * 100));

    return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {/* CPU */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">CPU</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? '0%' : `${cpuPercent}%`}
                    </div>
                    <div className="text-xs text-gray-500">
                        {isOffline ? 'Offline' : `${stats.cpu.toFixed(1)}% / ${limits.cpu}%`}
                    </div>
                </div>

                {/* Memory */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Memory</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? '0%' : `${memoryPercent}%`}
                    </div>
                    <div className="text-xs text-gray-500">
                        {isOffline ? 'Offline' : `${bytesToString(stats.memory)} / ${bytesToString(memoryLimitBytes)}`}
                    </div>
                </div>

                {/* Disk */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Disk</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? '0%' : `${diskPercent}%`}
                    </div>
                    <div className="text-xs text-gray-500">
                        {isOffline ? 'Offline' : `${bytesToString(stats.disk)} / ${bytesToString(diskLimitBytes)}`}
                    </div>
                </div>

                {/* Uptime */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Uptime</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? (
                            'Offline'
                        ) : stats.uptime > 0 ? (
                            <UptimeDuration uptime={stats.uptime / 1000} />
                        ) : (
                            'Starting'
                        )}
                    </div>
                    <div className="text-xs text-gray-500">{status || 'offline'}</div>
                </div>

                {/* Network RX */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Network (In)</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? '0 B' : bytesToString(stats.rx)}
                    </div>
                    <div className="text-xs text-gray-500">Received</div>
                </div>

                {/* Network TX */}
                <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Network (Out)</div>
                    <div className="text-2xl font-bold text-white">
                        {isOffline ? '0 B' : bytesToString(stats.tx)}
                    </div>
                    <div className="text-xs text-gray-500">Transmitted</div>
                </div>
            </div>
        </div>
    );
}
