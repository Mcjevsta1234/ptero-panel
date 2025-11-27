import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import UptimeDuration from '@/components/server/UptimeDuration';
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
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SocialsSection from '@/components/server/console/SocialsSection';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

interface DataPoint {
    time: number;
    value: number;
}

const MAX_DATA_POINTS = 20;

const ConsoleSidebar = () => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
    const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
    const [diskHistory, setDiskHistory] = useState<DataPoint[]>([]);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const servername = ServerContext.useStoreState((state) => state.server.data!.name);
    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverNode = ServerContext.useStoreState((state) => state.server.data!.node);
    const serverAllocation = ServerContext.useStoreState((state) => state.server.data!.allocations.find(a => a.isDefault));
    const eggName = ServerContext.useStoreState((state) => state.server.data!.eggFeatures);

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

        setCpuHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.cpu / limits.cpu) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
        });

        setMemoryHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.memory / memoryLimitBytes) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
        });

        setDiskHistory((prev) => {
            const updated = [...prev, { time: now, value: Math.min(100, (newStats.disk / diskLimitBytes) * 100) }];
            return updated.slice(-MAX_DATA_POINTS);
        });
    });

    const isOffline = status === 'offline' || status === null;
    const memoryLimitBytes = limits.memory * 1024 * 1024;
    const diskLimitBytes = limits.disk * 1024 * 1024;

    const cpuPercent = isOffline ? 0 : Math.min(100, Math.round((stats.cpu / limits.cpu) * 100));
    const memoryPercent = isOffline ? 0 : Math.min(100, Math.round((stats.memory / memoryLimitBytes) * 100));
    const diskPercent = isOffline ? 0 : Math.min(100, Math.round((stats.disk / diskLimitBytes) * 100));

    // Extract plan name from node (e.g., "Premium Utah" -> "Premium")
    const planName = serverNode ? serverNode.split(' ')[0] : 'Standard';

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
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {/* Server Info - Moved to top */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Address</div>
                        <div className="text-sm font-medium text-white break-all">
                            {serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Server Plan</div>
                    <div className="text-sm font-medium text-white">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-witchyworlds flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            <span>{planName} {bytesToString(memoryLimitBytes)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Uptime */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Uptime</div>
                        <div className="text-lg font-semibold text-white">
                            {isOffline ? 'Offline' : stats.uptime > 0 ? <UptimeDuration uptime={stats.uptime / 1000} /> : 'Starting'}
                        </div>
                    </div>
                </div>
            </div>

            {/* CPU Load */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">CPU Load</div>
                        <div className="text-lg font-semibold text-white">{isOffline ? '0%' : `${cpuPercent}%`}</div>
                    </div>
                </div>
                {cpuHistory.length > 0 && (
                    <div className="h-12 mt-auto">
                        <Line data={createChartData(cpuHistory, '#3b82f6')} options={chartOptions} />
                    </div>
                )}
            </div>

            {/* Memory */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Memory</div>
                        <div className="text-lg font-semibold text-white">
                            {isOffline ? '0 MB / 0 GB' : `${bytesToString(stats.memory)} / ${bytesToString(memoryLimitBytes)}`}
                        </div>
                    </div>
                </div>
                {memoryHistory.length > 0 && (
                    <div className="h-12 mt-auto">
                        <Line data={createChartData(memoryHistory, '#10b981')} options={chartOptions} />
                    </div>
                )}
            </div>

            {/* Disk */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Disk</div>
                        <div className="text-lg font-semibold text-white">
                            {isOffline ? '0 MB' : bytesToString(stats.disk)}
                        </div>
                    </div>
                </div>
                {diskHistory.length > 0 && (
                    <div className="h-12 mt-auto">
                        <Line data={createChartData(diskHistory, '#a855f7')} options={chartOptions} />
                    </div>
                )}
            </div>

            {/* Network */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[120px] flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Network (In / Out)</div>
                        <div className="text-lg font-semibold text-white">
                            {isOffline ? '0 B / 0 B' : `${bytesToString(stats.rx)} / ${bytesToString(stats.tx)}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <SocialsSection />
        </div>
    );
};

export default ConsoleSidebar;
