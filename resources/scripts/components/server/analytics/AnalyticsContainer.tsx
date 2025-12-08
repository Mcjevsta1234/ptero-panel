import React, { useEffect, useState, useMemo, memo } from 'react';
import { ServerContext } from '@/state/server';
import ContentBlock from '@/witchyworlds/ui/ContentBlock';
import Card from '@/witchyworlds/ui/Card';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import getAnalytics, { ServerAnalytics } from '@/api/server/analytics/getAnalytics';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const periods = [
    { value: '1h', label: '1 Hour' },
    { value: '3h', label: '3 Hours' },
    { value: '6h', label: '6 Hours' },
    { value: '12h', label: '12 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '2d', label: '2 Days' },
    { value: '3d', label: '3 Days' },
    { value: '4d', label: '4 Days' },
    { value: '5d', label: '5 Days' },
    { value: '6d', label: '6 Days' },
    { value: '7d', label: '7 Days' },
];

// Memoized chart components to prevent re-renders from countdown timer
const CPUChart = memo(({ data }: { data: any[] }) => (
    <Card css={tw`p-4`}>
        <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>CPU Usage (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    animationDuration={0}
                />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} name="CPU %" isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    </Card>
));

const MemoryChart = memo(({ data }: { data: any[] }) => (
    <Card css={tw`p-4`}>
        <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>Memory Usage (GB)</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    animationDuration={0}
                />
                <Legend />
                <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} dot={false} name="Memory (GB)" isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    </Card>
));

const DiskChart = memo(({ data }: { data: any[] }) => (
    <Card css={tw`p-4`}>
        <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>Disk Usage (GB)</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    animationDuration={0}
                />
                <Legend />
                <Line type="monotone" dataKey="disk" stroke="#F59E0B" strokeWidth={2} dot={false} name="Disk (GB)" isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    </Card>
));

const NetworkChart = memo(({ data }: { data: any[] }) => (
    <Card css={tw`p-4`}>
        <h3 css={tw`text-lg font-bold text-gray-100 mb-4`}>Network Usage (MB)</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    animationDuration={0}
                />
                <Legend />
                <Line type="monotone" dataKey="networkRx" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Download (MB)" isAnimationActive={false} />
                <Line type="monotone" dataKey="networkTx" stroke="#EC4899" strokeWidth={2} dot={false} name="Upload (MB)" isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    </Card>
));

export default () => {
    const { t } = useTranslation('server/analytics');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('24h');
    const [analytics, setAnalytics] = useState<ServerAnalytics[]>([]);
    const [countdown, setCountdown] = useState(30);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const fetchAnalytics = () => {
        getAnalytics(uuid, period)
            .then((data) => setAnalytics(data))
            .catch((error) => clearAndAddHttpError({ key: 'analytics', error }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        clearFlashes('analytics');
        fetchAnalytics();
        setCountdown(30);

        // Refresh every 30 seconds to match collection rate
        const interval = setInterval(() => {
            fetchAnalytics();
            setCountdown(30);
        }, 30000);

        // Countdown timer - use separate state update to avoid re-rendering charts
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(countdownInterval);
        };
    }, [uuid, period]);

    // Memoize chart data transformation to avoid recalculating on every render
    const chartData = useMemo(() => {
        return analytics.map((record) => {
            const date = new Date(record.timestamp);
            return {
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                cpu: record.cpu,
                memory: record.memory / (1024 * 1024 * 1024), // Convert to GB
                disk: record.disk / (1024 * 1024 * 1024), // Convert to GB
                networkRx: record.network_rx / (1024 * 1024), // Convert to MB
                networkTx: record.network_tx / (1024 * 1024), // Convert to MB
            };
        });
    }, [analytics]);

    // Memoize downsampled data to avoid recalculating on countdown updates
    const displayData = useMemo(() => {
        // Fewer points for longer periods to maintain smooth performance
        const maxPointsByPeriod: Record<string, number> = {
            '1h': 100,
            '3h': 90,
            '6h': 80,
            '12h': 70,
            '24h': 60,
            '1d': 60,
            '2d': 50,
            '3d': 50,
            '4d': 40,
            '5d': 40,
            '6d': 40,
            '7d': 40,
        };
        const maxPoints = maxPointsByPeriod[period] || 50;
        
        if (chartData.length <= maxPoints) {
            return chartData;
        }

        const sampleRate = Math.ceil(chartData.length / maxPoints);
        const downsampled = [];

        for (let i = 0; i < chartData.length; i += sampleRate) {
            const batch = chartData.slice(i, i + sampleRate);
            const avgPoint = {
                time: batch[Math.floor(batch.length / 2)].time,
                cpu: batch.reduce((sum, p) => sum + p.cpu, 0) / batch.length,
                memory: batch.reduce((sum, p) => sum + p.memory, 0) / batch.length,
                disk: batch.reduce((sum, p) => sum + p.disk, 0) / batch.length,
                networkRx: batch.reduce((sum, p) => sum + p.networkRx, 0) / batch.length,
                networkTx: batch.reduce((sum, p) => sum + p.networkTx, 0) / batch.length,
            };
            downsampled.push(avgPoint);
        }

        return downsampled;
    }, [chartData, period]);

    return (
        <ContentBlock title={'Resource Analytics'}>
            <FlashMessageRender byKey={'analytics'} css={tw`mb-4`} />

            {/* Period Selector with Refresh Timer */}
            <Card css={tw`p-4 mb-4`}>
                <div css={tw`flex flex-wrap items-center justify-between gap-4`}>
                    <div css={tw`flex items-center gap-3`}>
                        <h3 css={tw`text-lg font-bold text-gray-100`}>Time Period</h3>
                        <div css={tw`flex items-center gap-2`}>
                            <div css={tw`relative w-8 h-8`}>
                                <svg css={tw`w-8 h-8 transform -rotate-90`} viewBox="0 0 32 32">
                                    <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        css={tw`text-gray-700`}
                                    />
                                    <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeDasharray={`${(countdown / 30) * 87.96} 87.96`}
                                        css={tw`text-blue-500 transition-all duration-1000`}
                                    />
                                </svg>
                                <span css={tw`absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-300`}>
                                    {countdown}
                                </span>
                            </div>
                            <span css={tw`text-sm text-gray-400`}>Next refresh</span>
                        </div>
                    </div>
                    <div css={tw`flex flex-wrap gap-2`}>
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPeriod(p.value)}
                                css={[
                                    tw`px-3 py-1.5 rounded text-sm font-medium transition-colors`,
                                    period === p.value
                                        ? tw`bg-blue-600 text-white`
                                        : tw`bg-gray-700 text-gray-300 hover:bg-gray-600`,
                                ]}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {loading ? (
                <Spinner size={'large'} centered />
            ) : analytics.length === 0 ? (
                <Card css={tw`p-8 text-center`}>
                    <p css={tw`text-gray-400`}>No analytics data available for this period.</p>
                    <p css={tw`text-sm text-gray-500 mt-2`}>
                        Analytics data is collected every few minutes while your server is running.
                    </p>
                </Card>
            ) : (
                <div css={tw`space-y-4`}>
                    <CPUChart data={displayData} />
                    <MemoryChart data={displayData} />
                    <DiskChart data={displayData} />
                    <NetworkChart data={displayData} />
                </div>
            )}
        </ContentBlock>
    );
};
