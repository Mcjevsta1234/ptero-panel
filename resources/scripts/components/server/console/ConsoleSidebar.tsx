import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import UptimeDuration from '@/components/server/UptimeDuration';
import CopyOnClick from '@/components/elements/CopyOnClick';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

interface DataPoint {
    time: number;
    value: number;
}

interface NetworkDataPoint {
    time: number;
    rx: number;
    tx: number;
}

const MAX_DATA_POINTS = 20;

// Design 1: Radial/Circular Progress Meter (CPU)
const RadialGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const centerY = height / 2;
    const radius = 12;
    const strokeWidth = 3;

    const latestValue = data[data.length - 1].value;
    const normalizedValue = Math.min(100, (latestValue / max) * 100);
    const circumference = 2 * Math.PI * radius;
    const progress = (normalizedValue / 100) * circumference;

    // Create mini sparkline on the right
    const sparklineWidth = width - 35;
    const sparklinePoints = data.map((point, index) => {
        const x = 35 + (index / (MAX_DATA_POINTS - 1)) * sparklineWidth;
        const normalizedVal = Math.min(100, (point.value / max) * 100);
        const y = height - (normalizedVal / 100) * (height - 4) - 2;
        return { x, y };
    });

    const sparkPath = sparklinePoints.length > 1
        ? `M ${sparklinePoints[0].x},${sparklinePoints[0].y} ` + sparklinePoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')
        : '';

    const gradientId = `gradient-radial-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.6 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle
                cx={radius + 4}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="#374151"
                strokeWidth={strokeWidth}
            />
            
            {/* Progress circle */}
            <circle
                cx={radius + 4}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius + 4} ${centerY})`}
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
            
            {/* Sparkline */}
            {sparkPath && (
                <path
                    d={sparkPath}
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.6"
                    style={{ transition: 'd 0.3s ease-out' }}
                />
            )}
        </svg>
    );
};

// Design 2: Block/Grid Fill Pattern (RAM)
const BlockGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const cols = 20;
    const rows = 4;
    const blockWidth = (width / cols) - 0.5;
    const blockHeight = (height / rows) - 0.5;

    const latestValue = data[data.length - 1].value;
    const normalizedValue = Math.min(100, (latestValue / max) * 100);
    const totalBlocks = cols * rows;
    const filledBlocks = Math.round((normalizedValue / 100) * totalBlocks);

    const blocks = [];
    for (let i = 0; i < totalBlocks; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * (blockWidth + 0.5);
        const y = height - (row + 1) * (blockHeight + 0.5);
        const isFilled = i < filledBlocks;
        
        blocks.push(
            <rect
                key={i}
                x={x}
                y={y}
                width={blockWidth}
                height={blockHeight}
                fill={isFilled ? color : '#374151'}
                opacity={isFilled ? 0.7 + (i / totalBlocks) * 0.3 : 0.3}
                rx="0.5"
                style={{ transition: 'fill 0.3s ease-out, opacity 0.3s ease-out' }}
            />
        );
    }

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {blocks}
        </svg>
    );
};

// Design 3: Smooth curved line with particles (Disk - keeping this one)
const CurvedLineGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const padding = 2;
    
    const points = data.map((point, index) => {
        const x = (index / (MAX_DATA_POINTS - 1)) * width;
        const normalizedValue = Math.min(100, (point.value / max) * 100);
        const y = height - (normalizedValue / 100) * (height - padding * 2) - padding;
        return { x, y };
    });

    const smoothPath = points.length > 2 ? (() => {
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpX = (prev.x + curr.x) / 2;
            path += ` Q ${prev.x},${prev.y} ${cpX},${(prev.y + curr.y) / 2}`;
            if (i === points.length - 1) {
                path += ` T ${curr.x},${curr.y}`;
            }
        }
        return path;
    })() : '';

    const gradientId = `gradient-curved-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
                </linearGradient>
            </defs>
            {smoothPath && (
                <>
                    <path
                        d={`${smoothPath} L ${width},${height} L 0,${height} Z`}
                        fill={`url(#${gradientId})`}
                        style={{ transition: 'd 0.3s ease-out' }}
                    />
                    <path
                        d={smoothPath}
                        stroke={color}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        style={{ transition: 'd 0.3s ease-out' }}
                    />
                    {points.slice(-5).map((point, idx) => (
                        <circle
                            key={idx}
                            cx={point.x}
                            cy={point.y}
                            r={idx === 4 ? 2 : 1}
                            fill={color}
                            opacity={0.5 + (idx / 5) * 0.5}
                            style={{ transition: 'cx 0.3s ease-out, cy 0.3s ease-out' }}
                        />
                    ))}
                </>
            )}
        </svg>
    );
};

// Design 4: Split Horizontal Bars (Network RX/TX)
const SplitBarGraph = ({ data, color1, color2 }: { data: NetworkDataPoint[]; color1: string; color2: string }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const barHeight = (height / 2) - 2;
    const gap = 4;

    const maxValue = Math.max(
        ...data.map(d => Math.max(d.rx, d.tx)),
        1
    );

    const latestData = data[data.length - 1];
    const rxPercent = (latestData.rx / maxValue) * 100;
    const txPercent = (latestData.tx / maxValue) * 100;

    // Create mini bars for history
    const barCount = Math.min(data.length, 10);
    const barWidth = width / barCount - 1;

    const gradientId1 = `gradient-split-${color1.replace('#', '')}`;
    const gradientId2 = `gradient-split-${color2.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <linearGradient id={gradientId1} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color1, stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: color1, stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id={gradientId2} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: color2, stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            
            {/* RX (Download) - Top half */}
            {data.slice(-barCount).map((point, index) => {
                const barRxPercent = Math.min(100, (point.rx / maxValue) * 100);
                const barRxWidth = (barRxPercent / 100) * width;
                const x = (index / barCount) * width;
                return (
                    <rect
                        key={`rx-${index}`}
                        x={0}
                        y={index * (barHeight / barCount)}
                        width={barRxWidth}
                        height={barHeight / barCount - 0.5}
                        fill={`url(#${gradientId1})`}
                        opacity={0.5 + (index / barCount) * 0.5}
                        rx="1"
                        style={{ transition: 'width 0.3s ease-out' }}
                    />
                );
            })}
            
            {/* TX (Upload) - Bottom half */}
            {data.slice(-barCount).map((point, index) => {
                const barTxPercent = Math.min(100, (point.tx / maxValue) * 100);
                const barTxWidth = (barTxPercent / 100) * width;
                return (
                    <rect
                        key={`tx-${index}`}
                        x={0}
                        y={barHeight + gap + (index * (barHeight / barCount))}
                        width={barTxWidth}
                        height={barHeight / barCount - 0.5}
                        fill={`url(#${gradientId2})`}
                        opacity={0.5 + (index / barCount) * 0.5}
                        rx="1"
                        style={{ transition: 'width 0.3s ease-out' }}
                    />
                );
            })}
        </svg>
    );
};

const ConsoleSidebar = () => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
    const [memoryHistory, setMemoryHistory] = useState<DataPoint[]>([]);
    const [diskHistory, setDiskHistory] = useState<DataPoint[]>([]);
    const [networkHistory, setNetworkHistory] = useState<NetworkDataPoint[]>([]);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const serverNode = ServerContext.useStoreState((state) => state.server.data!.node);
    const serverAllocation = ServerContext.useStoreState((state) => 
        state.server.data!.allocations.find((a) => a.isDefault)
    );

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
        const cpuLimit = limits.cpu; // CPU limit in percentage (100% per core)

        setCpuHistory((prev) => {
            const updated = [...prev, { time: now, value: newStats.cpu }];
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

        setNetworkHistory((prev) => {
            const updated = [...prev, { time: now, rx: newStats.rx, tx: newStats.tx }];
            return updated.slice(-MAX_DATA_POINTS);
        });
    });

    const isOffline = status === 'offline' || status === null;
    const memoryLimitBytes = limits.memory * 1024 * 1024;
    const cpuLimit = limits.cpu; // CPU limit (100% per core)

    // Calculate CPU percentage relative to the limit (accounts for multi-core)
    const cpuPercent = isOffline ? 0 : Math.min(100, Math.round((stats.cpu / cpuLimit) * 100));

    // Extract plan name from node (e.g., "Premium Utah" -> "premium")
    const planName = serverNode ? serverNode.split(' ')[0].toLowerCase() : 'standard';

    return (
        <div className="flex flex-col gap-3">
            {/* Uptime - moved to top */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Uptime</div>
                        <div className="text-base font-semibold text-white">
                            {isOffline ? 'Offline' : stats.uptime > 0 ? <UptimeDuration uptime={stats.uptime / 1000} /> : 'Starting'}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Server Plan */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Server Plan</div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-witchyworlds flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span>{planName} {bytesToString(memoryLimitBytes)}</span>
                </div>
            </div>

            {/* IP Address with Blur */}
            <CopyOnClick text={serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}>
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-pointer hover:border-witchyworlds transition-colors">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Address</div>
                    <div className="text-sm font-medium text-white blur-sm hover:blur-none transition-all">
                        {serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}
                    </div>
                </div>
            </CopyOnClick>

            {/* CPU */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">CPU</div>
                        <div className="text-base font-semibold text-white">{cpuPercent}%</div>
                    </div>
                </div>
                {cpuHistory.length > 0 && (
                    <div className="h-8">
                        <RadialGraph data={cpuHistory} color="#3b82f6" max={cpuLimit} />
                    </div>
                )}
            </div>

            {/* RAM */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">RAM</div>
                        <div className="text-base font-semibold text-white">
                            {isOffline ? '0 MB' : bytesToString(stats.memory)}
                        </div>
                    </div>
                </div>
                {memoryHistory.length > 0 && (
                    <div className="h-8">
                        <BlockGraph data={memoryHistory} color="#10b981" max={100} />
                    </div>
                )}
            </div>

            {/* Disk */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Disk</div>
                        <div className="text-base font-semibold text-white">
                            {isOffline ? '0 MB' : bytesToString(stats.disk)}
                        </div>
                    </div>
                </div>
                {diskHistory.length > 0 && (
                    <div className="h-8">
                        <CurvedLineGraph data={diskHistory} color="#a855f7" max={100} />
                    </div>
                )}
            </div>

            {/* Network I/O */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Net I/O</div>
                        <div className="text-sm font-semibold text-white leading-tight">
                            {isOffline ? (
                                '0 B / 0 B'
                            ) : (
                                <>
                                    <div className="text-cyan-400">↓ {bytesToString(stats.rx)}</div>
                                    <div className="text-purple-400">↑ {bytesToString(stats.tx)}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {networkHistory.length > 0 && (
                    <div className="h-8">
                        <SplitBarGraph data={networkHistory} color1="#06b6d4" color2="#a855f7" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsoleSidebar;
