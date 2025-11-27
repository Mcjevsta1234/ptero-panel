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

// Design 1: Wave-filled Progress Bar (CPU)
const WaveProgressGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    
    const latestValue = data[data.length - 1].value;
    const normalizedValue = Math.min(100, (latestValue / max) * 100);
    const fillWidth = (normalizedValue / 100) * width;

    // Create wave pattern
    const waveCount = 4;
    const waveHeight = 4;
    const waveWidth = width / waveCount;
    
    let wavePath = `M 0,${height / 2}`;
    for (let i = 0; i <= waveCount; i++) {
        const x = i * waveWidth;
        const y1 = (height / 2) - waveHeight;
        const y2 = (height / 2) + waveHeight;
        wavePath += ` Q ${x + waveWidth / 4},${y1} ${x + waveWidth / 2},${height / 2}`;
        wavePath += ` Q ${x + (waveWidth * 3) / 4},${y2} ${x + waveWidth},${height / 2}`;
    }

    const gradientId = `gradient-wave-${color.replace('#', '')}`;
    const glowId = `glow-wave-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
                </linearGradient>
                <filter id={glowId}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <clipPath id={`clip-${color.replace('#', '')}`}>
                    <rect x="0" y="0" width={fillWidth} height={height} style={{ transition: 'width 0.5s ease-out' }} />
                </clipPath>
            </defs>
            
            {/* Background bar */}
            <rect x="0" y={height / 2 - 3} width={width} height="6" fill="#374151" rx="3" opacity="0.3" />
            
            {/* Filled wave */}
            <g clipPath={`url(#clip-${color.replace('#', '')})`}>
                <path
                    d={wavePath}
                    stroke={`url(#${gradientId})`}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    filter={`url(#${glowId})`}
                >
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        from={`${-waveWidth} 0`}
                        to="0 0"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </path>
            </g>
            
            {/* Progress indicator dot */}
            <circle
                cx={fillWidth}
                cy={height / 2}
                r="4"
                fill={color}
                filter={`url(#${glowId})`}
                style={{ transition: 'cx 0.5s ease-out' }}
            >
                <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
};

// Design 2: Vertical Column Fill (RAM)
const ColumnFillGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const columnCount = 16;
    const columnWidth = (width / columnCount) - 1.5;
    const gap = 1.5;

    const gradientId = `gradient-column-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.6 }} />
                    <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.85 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            
            {data.slice(-columnCount).map((point, index) => {
                const normalizedValue = Math.min(100, (point.value / max) * 100);
                const columnHeight = (normalizedValue / 100) * height;
                const x = index * (columnWidth + gap);
                const opacity = 0.4 + (index / columnCount) * 0.6;
                
                return (
                    <g key={index}>
                        {/* Background column */}
                        <rect
                            x={x}
                            y={0}
                            width={columnWidth}
                            height={height}
                            fill="#374151"
                            opacity="0.2"
                            rx="1"
                        />
                        {/* Filled column */}
                        <rect
                            x={x}
                            y={height - columnHeight}
                            width={columnWidth}
                            height={columnHeight}
                            fill={`url(#${gradientId})`}
                            opacity={opacity}
                            rx="1"
                            style={{ 
                                transition: 'height 0.5s ease-out, y 0.5s ease-out'
                            }}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

// Design 3: Flowing Ribbon (Disk)
const RibbonGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const padding = 4;
    
    const points = data.map((point, index) => {
        const x = (index / (MAX_DATA_POINTS - 1)) * width;
        const normalizedValue = Math.min(100, (point.value / max) * 100);
        const y = height - (normalizedValue / 100) * (height - padding * 2) - padding;
        return { x, y };
    });

    // Create smooth bezier curve
    const smoothPath = points.length > 2 ? (() => {
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
        }
        return path;
    })() : '';

    // Create ribbon edges
    const topRibbon = smoothPath;
    const bottomRibbon = points.length > 2 ? (() => {
        let path = `M ${points[0].x},${points[0].y + 6}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            path += ` C ${controlX},${current.y + 6} ${controlX},${next.y + 6} ${next.x},${next.y + 6}`;
        }
        return path;
    })() : '';

    const gradientId = `gradient-ribbon-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.9 }} />
                    <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.6 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.3 }} />
                </linearGradient>
            </defs>
            
            {smoothPath && (
                <>
                    {/* Ribbon fill */}
                    <path
                        d={`${topRibbon} L ${points[points.length - 1].x},${points[points.length - 1].y + 6} ${bottomRibbon.substring(1)} Z`}
                        fill={`url(#${gradientId})`}
                        opacity="0.8"
                        style={{ transition: 'all 0.5s ease-out' }}
                    />
                    {/* Top edge */}
                    <path
                        d={topRibbon}
                        stroke={color}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.9"
                        style={{ transition: 'd 0.5s ease-out' }}
                    />
                    {/* Bottom edge */}
                    <path
                        d={bottomRibbon}
                        stroke={color}
                        strokeWidth="1"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                        style={{ transition: 'd 0.5s ease-out' }}
                    />
                    {/* Highlight dots */}
                    {points.slice(-3).map((point, idx) => (
                        <circle
                            key={idx}
                            cx={point.x}
                            cy={point.y}
                            r={idx === 2 ? 3 : 2}
                            fill={color}
                            opacity={idx === 2 ? 1 : 0.6}
                            style={{ transition: 'cx 0.5s ease-out, cy 0.5s ease-out' }}
                        >
                            {idx === 2 && (
                                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                            )}
                        </circle>
                    ))}
                </>
            )}
        </svg>
    );
};

// Design 4: Mirrored Mountain Range (Network RX/TX)
const MirrorMountainGraph = ({ data, color1, color2 }: { data: NetworkDataPoint[]; color1: string; color2: string }) => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 32;
    const centerY = height / 2;
    const maxHeight = (height / 2) - 2;
    
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.rx, d.tx)),
        1
    );

    // Create smooth paths for RX (top) and TX (bottom)
    const createMountainPath = (values: number[], isTop: boolean) => {
        const points = values.map((val, index) => {
            const x = (index / (MAX_DATA_POINTS - 1)) * width;
            const normalizedValue = Math.min(100, (val / maxValue) * 100);
            const yOffset = (normalizedValue / 100) * maxHeight;
            const y = isTop ? centerY - yOffset : centerY + yOffset;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x},${centerY}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
        }
        path += ` L ${points[points.length - 1].x},${centerY} Z`;
        return path;
    };

    const rxValues = data.map(d => d.rx);
    const txValues = data.map(d => d.tx);

    const rxPath = createMountainPath(rxValues, true);
    const txPath = createMountainPath(txValues, false);

    const gradientId1 = `gradient-mountain-${color1.replace('#', '')}`;
    const gradientId2 = `gradient-mountain-${color2.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId1} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color1, stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: color1, stopOpacity: 0.2 }} />
                </linearGradient>
                <linearGradient id={gradientId2} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: color2, stopOpacity: 0.2 }} />
                </linearGradient>
            </defs>
            
            {/* Center line */}
            <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#374151" strokeWidth="1" opacity="0.3" />
            
            {/* RX (Download) - Top mountain */}
            {rxPath && (
                <path
                    d={rxPath}
                    fill={`url(#${gradientId1})`}
                    opacity="0.9"
                    style={{ transition: 'd 0.5s ease-out' }}
                />
            )}
            
            {/* TX (Upload) - Bottom mountain */}
            {txPath && (
                <path
                    d={txPath}
                    fill={`url(#${gradientId2})`}
                    opacity="0.9"
                    style={{ transition: 'd 0.5s ease-out' }}
                />
            )}
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
                        <WaveProgressGraph data={cpuHistory} color="#3b82f6" max={cpuLimit} />
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
                        <ColumnFillGraph data={memoryHistory} color="#10b981" max={100} />
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
                        <RibbonGraph data={diskHistory} color="#a855f7" max={100} />
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
                        <MirrorMountainGraph data={networkHistory} color1="#06b6d4" color2="#a855f7" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsoleSidebar;
