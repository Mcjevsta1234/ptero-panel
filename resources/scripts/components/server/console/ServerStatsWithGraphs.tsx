import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

interface DataPoint {
    time: number;
    value: number;
}

const MAX_DATA_POINTS = 20; // Show last 20 data points (about 20 seconds at 1s intervals)

export default function ServerStatsWithGraphs() {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
    const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
    const [diskHistory, setDiskHistory] = useState<DataPoint[]>([]);

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

        const newStats = {
            memory: parsedStats.memory_bytes,
            cpu: parsedStats.cpu_absolute,
            disk: parsedStats.disk_bytes,
            tx: parsedStats.network.tx_bytes,
            rx: parsedStats.network.rx_bytes,
            uptime: parsedStats.uptime || 0,
        };

        setStats(newStats);

        const now = Date.now();
        const memoryLimitBytes = limits.memory * 1024 * 1024;
        const diskLimitBytes = limits.disk * 1024 * 1024;

        // Update CPU history
        setCpuHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.cpu / limits.cpu) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
        });

        // Update Memory history
        setMemoryHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.memory / memoryLimitBytes) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
        });

        // Update Disk history
        setDiskHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.disk / diskLimitBytes) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
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

    const createChartData = (history: DataPoint[], color: string) => ({
        labels: history.map(() => ''),
        datasets: [
            {
                data: history.map((d) => d.value),
                borderColor: color,
                backgroundColor: `${color}20`,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 2,
            },
        ],
    });

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: {
                display: false,
                min: 0,
                max: 100,
            },
        },
        animation: {
            duration: 0,
        },
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* CPU */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">CPU</div>
                        <div className="text-2xl font-bold text-white">
                            {isOffline ? '0%' : `${cpuPercent}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                            {isOffline ? 'Offline' : `${stats.cpu.toFixed(1)}% / ${limits.cpu}%`}
                        </div>
                    </div>
                </div>
                <div className="h-16">
                    {cpuHistory.length > 0 && (
                        <Line data={createChartData(cpuHistory, '#3b82f6')} options={chartOptions} />
                    )}
                </div>
            </div>

            {/* Memory */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Memory</div>
                        <div className="text-2xl font-bold text-white">
                            {isOffline ? '0%' : `${memoryPercent}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                            {isOffline ? 'Offline' : `${bytesToString(stats.memory)} / ${bytesToString(memoryLimitBytes)}`}
                        </div>
                    </div>
                </div>
                <div className="h-16">
                    {memoryHistory.length > 0 && (
                        <Line data={createChartData(memoryHistory, '#10b981')} options={chartOptions} />
                    )}
                </div>
            </div>

            {/* Disk */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Disk</div>
                        <div className="text-2xl font-bold text-white">
                            {isOffline ? '0%' : `${diskPercent}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                            {isOffline ? 'Offline' : `${bytesToString(stats.disk)} / ${bytesToString(diskLimitBytes)}`}
                        </div>
                    </div>
                </div>
                <div className="h-16">
                    {diskHistory.length > 0 && (
                        <Line data={createChartData(diskHistory, '#f59e0b')} options={chartOptions} />
                    )}
                </div>
            </div>
        </div>
    );
}
