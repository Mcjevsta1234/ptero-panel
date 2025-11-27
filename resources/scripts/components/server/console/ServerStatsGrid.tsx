import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';
import UptimeDuration from '@/components/server/UptimeDuration';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const StatCard = ({ 
    label, 
    value, 
    max, 
    unit 
}: { 
    label: string; 
    value: number | string | React.ReactNode; 
    max?: number; 
    unit?: string;
}) => {
    const percentage = max ? Math.round((Number(value) / max) * 100) : null;
    
    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">{label}</div>
            <div className="flex items-baseline justify-between">
                <div className="text-2xl font-semibold text-white">
                    {typeof value === 'number' && unit ? `${value}${unit}` : value}
                    {max && unit && <span className="text-gray-400 text-lg ml-1">/ {max}{unit}</span>}
                </div>
                {percentage !== null && (
                    <div className="text-lg text-gray-300">{percentage}%</div>
                )}
            </div>
        </div>
    );
};

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
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    const memoryLimit = limits.memory * 1024 * 1024; // Convert MB to bytes
    const diskLimit = limits.disk * 1024 * 1024; // Convert MB to bytes

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
                label="CPU"
                value={status === 'offline' ? '0' : stats.cpu.toFixed(2)}
                max={limits.cpu}
                unit="%"
            />
            <StatCard
                label="Memory"
                value={status === 'offline' ? 'Offline' : bytesToString(stats.memory)}
                max={memoryLimit}
            />
            <StatCard
                label="Disk"
                value={status === 'offline' ? 'Offline' : bytesToString(stats.disk)}
                max={diskLimit}
            />
            <StatCard
                label="Uptime"
                value={
                    status === null ? (
                        'Offline'
                    ) : stats.uptime > 0 ? (
                        <UptimeDuration uptime={stats.uptime / 1000} />
                    ) : (
                        capitalize(status)
                    )
                }
            />
        </div>
    );
}
