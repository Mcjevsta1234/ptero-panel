import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString } from '@/lib/formatters';
import UptimeDuration from '@/components/server/UptimeDuration';
import CopyOnClick from '@/components/elements/CopyOnClick';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { CrystallineCard, RuneCircle } from '@/witchyworlds/theme/WitchyDesignSystem';

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

const StatCard = styled(CrystallineCard)`
    ${tw`p-3 flex-shrink-0`}
    background: linear-gradient(135deg, 
        rgba(107, 33, 168, 0.15) 0%,
        rgba(45, 106, 79, 0.1) 100%
    );
    border: 1px solid rgba(167, 139, 250, 0.2);
    box-shadow: 0 0 20px rgba(107, 33, 168, 0.1), inset 0 0 20px rgba(6, 182, 212, 0.05);
`;

const StatHeader = styled.div`
    ${tw`flex items-center gap-3`}
`;

const StatLabel = styled.div`
    ${tw`text-xs uppercase tracking-widest font-semibold`}
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.8), rgba(6, 182, 212, 0.8));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const StatValue = styled.div`
    ${tw`text-base font-bold mt-1`}
    color: rgba(255, 255, 255, 0.95);
`;

const IconWrapper = styled.div`
    ${tw`w-8 h-8 rounded flex items-center justify-center flex-shrink-0`}
    background: radial-gradient(circle, rgba(167, 139, 250, 0.3), rgba(107, 33, 168, 0.1));
    border: 1px solid rgba(167, 139, 250, 0.2);
    
    svg {
        ${tw`w-4 h-4`}
        filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.5));
    }
`;

const GraphContainer = styled.div`
    ${tw`h-8 mt-2`}
`;

// Smooth path builder for graphs
const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    const d: string[] = [];
    d.push(`M ${points[0].x},${points[0].y}`);
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
        const control1x = p1.x + (p2.x - p0.x) / 6;
        const control1y = p1.y + (p2.y - p0.y) / 6;
        const control2x = p2.x - (p3.x - p1.x) / 6;
        const control2y = p2.y - (p3.y - p1.y) / 6;
        d.push(`C ${control1x},${control1y} ${control2x},${control2y} ${p2.x},${p2.y}`);
    }
    return d.join(' ');
};

// Mystical mountain graph with conic gradient fill
const MysticalMountainGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    const width = 100;
    const height = 32;
    const padding = 2;

    if (!data.length) return null;
    const points = data.map((d, index) => {
        const x = (index / (MAX_DATA_POINTS - 1)) * width;
        const normalizedValue = Math.min(100, (d.value / max) * 100);
        const y = height - (normalizedValue / 100) * (height - padding * 2) - padding;
        return { x, y };
    });
    const path = buildSmoothPath(points);
    const areaPath = path ? `${path} L ${points[points.length - 1].x},${height} L 0,${height} Z` : '';
    const gradientId = `mmg-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
                    <stop offset="60%" style={{ stopColor: color, stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
                </linearGradient>
                <filter id="glow-filter">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.85} />}
            {path && <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" filter="url(#glow-filter)" />}
        </svg>
    );
};

// Dual metric mirrored graph
const MirrorMountainGraph = ({ data, color1, color2 }: { data: NetworkDataPoint[]; color1: string; color2: string }) => {
    const width = 100;
    const height = 32;
    const centerY = height / 2;
    const maxHeight = (height / 2) - 2;

    if (data.length < 2) return null;
    const maxValue = Math.max(...data.map(d => d.rx), ...data.map(d => d.tx), 1);

    const buildMountain = (values: number[], isTop: boolean) => {
        const pts = values.map((val, index) => {
            const x = (index / (MAX_DATA_POINTS - 1)) * width;
            const normalized = Math.min(100, (val / maxValue) * 100);
            const yOffset = (normalized / 100) * maxHeight;
            const y = isTop ? centerY - yOffset : centerY + yOffset;
            return { x, y };
        });
        const path = buildSmoothPath(pts);
        return { pts, path };
    };

    const top = buildMountain(data.map(d => d.rx), true);
    const bottom = buildMountain(data.map(d => d.tx), false);

    const gradientId1 = `mmg-top-${color1.replace('#', '')}`;
    const gradientId2 = `mmg-bottom-${color2.replace('#', '')}`;
    const topArea = top.path ? `${top.path} L ${top.pts[top.pts.length - 1].x},${centerY} L ${top.pts[0].x},${centerY} Z` : '';
    const bottomArea = bottom.path ? `${bottom.path} L ${bottom.pts[bottom.pts.length - 1].x},${centerY} L ${bottom.pts[0].x},${centerY} Z` : '';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId1} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color1, stopOpacity: 0.8 }} />
                    <stop offset="70%" style={{ stopColor: color1, stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: color1, stopOpacity: 0.1 }} />
                </linearGradient>
                <linearGradient id={gradientId2} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color2, stopOpacity: 0.8 }} />
                    <stop offset="70%" style={{ stopColor: color2, stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: color2, stopOpacity: 0.1 }} />
                </linearGradient>
                <filter id="network-glow">
                    <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(167, 139, 250, 0.1)" strokeWidth={1} />
            {topArea && <path d={topArea} fill={`url(#${gradientId1})`} opacity={0.8} />}
            {bottomArea && <path d={bottomArea} fill={`url(#${gradientId2})`} opacity={0.8} />}
            {top.path && <path d={top.path} stroke={color1} strokeWidth={1.8} fill="none" strokeLinecap="round" filter="url(#network-glow)" />}
            {bottom.path && <path d={bottom.path} stroke={color2} strokeWidth={1.8} fill="none" strokeLinecap="round" filter="url(#network-glow)" />}
        </svg>
    );
};

const MysticalConsoleSidebar = () => {
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
        if (!connected || !instance) return;
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
    const cpuLimit = limits.cpu;
    const cpuPercent = isOffline ? 0 : (() => {
        if (!cpuLimit || cpuLimit <= 0) return Math.round(stats.cpu);
        const pct = (stats.cpu / cpuLimit) * 100;
        return Math.round(pct < 0 ? 0 : pct);
    })();

    const planName = serverNode ? serverNode.split(' ')[0].toLowerCase() : 'standard';

    return (
        <div css={tw`flex flex-col gap-3 w-full h-full`}>
            {/* Uptime Card */}
            <StatCard>
                <StatHeader>
                    <IconWrapper>
                        <svg className="text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>Uptime</StatLabel>
                        <StatValue>
                            {isOffline ? 'Offline' : stats.uptime > 0 ? <UptimeDuration uptime={stats.uptime / 1000} /> : 'Starting'}
                        </StatValue>
                    </div>
                </StatHeader>
            </StatCard>

            {/* Server Plan */}
            <StatCard>
                <StatHeader>
                    <IconWrapper>
                        <svg className="text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>Server Plan</StatLabel>
                        <StatValue>{planName} {bytesToString(memoryLimitBytes)}</StatValue>
                    </div>
                </StatHeader>
            </StatCard>

            {/* IP Address */}
            <CopyOnClick text={serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}>
                <StatCard css={tw`cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg`}>
                    <StatLabel css={tw`text-xs`}>Address (Click to Copy)</StatLabel>
                    <StatValue css={tw`text-sm font-mono blur-sm hover:blur-none transition-all duration-200`}>
                        {serverAllocation ? `${serverAllocation.alias || serverAllocation.ip}:${serverAllocation.port}` : 'N/A'}
                    </StatValue>
                </StatCard>
            </CopyOnClick>

            {/* CPU */}
            <StatCard css={tw`flex-1 min-h-0`}>
                <StatHeader css={tw`mb-1`}>
                    <IconWrapper>
                        <svg className="text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>CPU</StatLabel>
                        <StatValue>{cpuPercent}%</StatValue>
                    </div>
                </StatHeader>
                {cpuHistory.length > 0 && (
                    <GraphContainer>
                        <MysticalMountainGraph data={cpuHistory} color="#3b82f6" max={cpuLimit || 100} />
                    </GraphContainer>
                )}
            </StatCard>

            {/* RAM */}
            <StatCard css={tw`flex-1 min-h-0`}>
                <StatHeader css={tw`mb-1`}>
                    <IconWrapper>
                        <svg className="text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>RAM</StatLabel>
                        <StatValue>{isOffline ? '0 MB' : bytesToString(stats.memory)}</StatValue>
                    </div>
                </StatHeader>
                {memoryHistory.length > 0 && (
                    <GraphContainer>
                        <MysticalMountainGraph data={memoryHistory} color="#10b981" max={100} />
                    </GraphContainer>
                )}
            </StatCard>

            {/* Disk */}
            <StatCard css={tw`flex-1 min-h-0`}>
                <StatHeader css={tw`mb-1`}>
                    <IconWrapper>
                        <svg className="text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>Disk</StatLabel>
                        <StatValue>{isOffline ? '0 MB' : bytesToString(stats.disk)}</StatValue>
                    </div>
                </StatHeader>
                {diskHistory.length > 0 && (
                    <GraphContainer>
                        <MysticalMountainGraph data={diskHistory} color="#a855f7" max={100} />
                    </GraphContainer>
                )}
            </StatCard>

            {/* Network I/O */}
            <StatCard css={tw`flex-1 min-h-0`}>
                <StatHeader css={tw`mb-1`}>
                    <IconWrapper>
                        <svg className="text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </IconWrapper>
                    <div css={tw`flex-1`}>
                        <StatLabel>Network I/O</StatLabel>
                        <StatValue css={tw`text-sm`}>
                            {isOffline ? (
                                '0 B / 0 B'
                            ) : (
                                <>
                                    <div className="text-cyan-400">↓ {bytesToString(stats.rx)}</div>
                                    <div className="text-violet-400">↑ {bytesToString(stats.tx)}</div>
                                </>
                            )}
                        </StatValue>
                    </div>
                </StatHeader>
                {networkHistory.length > 0 && (
                    <GraphContainer>
                        <MirrorMountainGraph data={networkHistory} color1="#06b6d4" color2="#a855f7" />
                    </GraphContainer>
                )}
            </StatCard>
        </div>
    );
};

export default MysticalConsoleSidebar;
