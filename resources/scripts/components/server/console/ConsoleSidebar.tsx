import React, { useEffect, useState, useRef } from 'react';
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

// Utility to build a smooth (Catmull-Rom) path from points.
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

// Single metric mountain graph with internal smoothing animation.
const SingleMountainGraph = ({ data, color, max = 100 }: { data: DataPoint[]; color: string; max?: number }) => {
    const width = 100;
    const height = 32;
    const padding = 2;
    const animDuration = 600; // ms
    const [animated, setAnimated] = useState<number[]>(data.map(d => d.value));
    const prevTarget = useRef<number[]>(animated);
    const startTime = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);

    // Trigger animation whenever data changes.
    useEffect(() => {
        const target = data.map(d => d.value);
        const prev = prevTarget.current.length === target.length ? prevTarget.current : target.map((v, i) => prevTarget.current[i] ?? v);
        prevTarget.current = target;
        startTime.current = performance.now();

        const animate = (now: number) => {
            if (!startTime.current) return;
            const elapsed = now - startTime.current;
            const t = Math.min(1, elapsed / animDuration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const current = target.map((v, i) => prev[i] + (v - prev[i]) * eased);
            setAnimated(current);
            if (t < 1) frameRef.current = requestAnimationFrame(animate);
        };
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [data]);

    if (animated.length === 0) return null;
    const points = animated.map((val, index) => {
        const x = (index / (MAX_DATA_POINTS - 1)) * width;
        const normalizedValue = Math.min(100, (val / max) * 100);
        const y = height - (normalizedValue / 100) * (height - padding * 2) - padding;
        return { x, y };
    });
    const path = buildSmoothPath(points);
    const areaPath = path ? `${path} L ${points[points.length - 1].x},${height} L 0,${height} Z` : '';
    const gradientId = `gradient-single-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.7 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.15 }} />
                </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.8} />}
            {path && <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />}
            {/* Latest point pulse */}
            {points.length > 0 && (
                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={color}>
                    <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                </circle>
            )}
        </svg>
    );
};

// Dual metric (rx/tx) mirrored mountain graph with smoothing.
const MirrorMountainGraph = ({ data, color1, color2 }: { data: NetworkDataPoint[]; color1: string; color2: string }) => {
    const width = 100;
    const height = 32;
    const centerY = height / 2;
    const maxHeight = (height / 2) - 2;
    const animDuration = 600;
    const [animatedRx, setAnimatedRx] = useState<number[]>(data.map(d => d.rx));
    const [animatedTx, setAnimatedTx] = useState<number[]>(data.map(d => d.tx));
    const prevRx = useRef<number[]>(animatedRx);
    const prevTx = useRef<number[]>(animatedTx);
    const startTime = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const targetRx = data.map(d => d.rx);
        const targetTx = data.map(d => d.tx);
        const prevR = prevRx.current.length === targetRx.length ? prevRx.current : targetRx.map((v, i) => prevRx.current[i] ?? v);
        const prevT = prevTx.current.length === targetTx.length ? prevTx.current : targetTx.map((v, i) => prevTx.current[i] ?? v);
        prevRx.current = targetRx;
        prevTx.current = targetTx;
        startTime.current = performance.now();
        const maxValue = Math.max(...targetRx.map(v => v), ...targetTx.map(v => v), 1);

        const animate = (now: number) => {
            if (!startTime.current) return;
            const elapsed = now - startTime.current;
            const t = Math.min(1, elapsed / animDuration);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimatedRx(targetRx.map((v, i) => prevR[i] + (v - prevR[i]) * eased));
            setAnimatedTx(targetTx.map((v, i) => prevT[i] + (v - prevT[i]) * eased));
            if (t < 1) frameRef.current = requestAnimationFrame(animate);
        };
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [data]);

    if (animatedRx.length < 2 || animatedTx.length < 2) return null;
    const maxValue = Math.max(...animatedRx.map(v => v), ...animatedTx.map(v => v), 1);

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

    const top = buildMountain(animatedRx, true);
    const bottom = buildMountain(animatedTx, false);
    const gradientId1 = `gradient-mirror-${color1.replace('#', '')}`;
    const gradientId2 = `gradient-mirror-${color2.replace('#', '')}`;

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
            <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="#374151" strokeWidth={1} opacity={0.3} />
            {top.path && (
                <path d={`${top.path} L ${top.pts[top.pts.length - 1].x},${centerY} L ${top.pts[0].x},${centerY} Z`} fill={`url(#${gradientId1})`} />
            )}
            {bottom.path && (
                <path d={`${bottom.path} L ${bottom.pts[bottom.pts.length - 1].x},${centerY} L ${bottom.pts[0].x},${centerY} Z`} fill={`url(#${gradientId2})`} />
            )}
            {/* Pulses */}
            {top.pts.length > 0 && (
                <circle cx={top.pts[top.pts.length - 1].x} cy={top.pts[top.pts.length - 1].y} r={3} fill={color1}>
                    <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                </circle>
            )}
            {bottom.pts.length > 0 && (
                <circle cx={bottom.pts[bottom.pts.length - 1].x} cy={bottom.pts[bottom.pts.length - 1].y} r={3} fill={color2}>
                    <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                </circle>
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
    const cpuPercent = isOffline ? 0 : (() => {
        if (!cpuLimit || cpuLimit <= 0) return Math.round(stats.cpu);
        const pct = (stats.cpu / cpuLimit) * 100;
        return Math.round(pct < 0 ? 0 : pct);
    })();

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
                        <SingleMountainGraph data={cpuHistory} color="#3b82f6" max={cpuLimit || 100} />
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
                        <SingleMountainGraph data={memoryHistory} color="#10b981" max={100} />
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
                        <SingleMountainGraph data={diskHistory} color="#a855f7" max={100} />
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
