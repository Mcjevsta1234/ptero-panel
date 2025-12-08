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

        // Refresh every 60 seconds to match backend collection rate
        const interval = setInterval(() => {
            fetchAnalytics();
        }, 60000);

        return () => {
            clearInterval(interval);
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

    // Memoize downsampled data - aggressively limit points for smooth performance
    const displayData = useMemo(() => {
        // Very limited points to ensure smooth scrolling and interaction
        const maxPointsByPeriod: Record<string, number> = {
            '1h': 60,
            '3h': 60,
            '6h': 50,
            '12h': 50,
            '24h': 40,
            '1d': 40,
            '2d': 35,
            '3d': 30,
            '4d': 30,
            '5d': 25,
            '6d': 25,
            '7d': 25,
        };
        const maxPoints = maxPointsByPeriod[period] || 30;
        
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

            {/* Period Selector */}
            <Card css={tw`p-4 mb-4`}>
                <div css={tw`flex flex-wrap items-center justify-between gap-4`}>
                    <div css={tw`flex items-center gap-3`}>
                        <h3 css={tw`text-lg font-bold text-gray-100`}>Time Period</h3>
                        <span css={tw`text-sm text-gray-400`}>Auto-refreshes every minute</span>
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
