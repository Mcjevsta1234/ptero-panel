import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import tw from 'twin.macro';
import { getAllocationStats } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';
import { Link } from 'react-router-dom';

interface AllocationStats {
    allocation: {
        id: number;
        name: string;
        node: {
            id: number;
            name: string;
            fqdn: string;
            location: string;
        };
        limits: {
            cpu: number;
            memory: number;
            disk: number;
        };
        used: {
            cpu: number;
            memory: number;
            disk: number;
            servers: number;
        };
        available: {
            cpu: number;
            memory: number;
            disk: number;
        };
        overallocation: {
            memory: boolean;
            disk: boolean;
        };
    };
    servers: Array<{
        id: number;
        uuid: string;
        name: string;
        identifier: string;
        egg: string;
        cpu: number;
        memory: number;
        disk: number;
        status: string;
        suspended: boolean;
        created_at: string;
    }>;
}

export default ({ match }: RouteComponentProps<{ id: string }>) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AllocationStats | null>(null);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const allocationId = parseInt(match.params.id);

    const fetchStats = () => {
        setLoading(true);
        clearFlashes('dedicated:detail');
        getAllocationStats(allocationId)
            .then((data) => setStats(data))
            .catch((error) => clearAndAddHttpError({ key: 'dedicated:detail', error }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [allocationId]);

    if (loading && !stats) {
        return (
            <PageContentBlock title={'Loading...'}>
                <Spinner size={'large'} centered />
            </PageContentBlock>
        );
    }

    if (!stats) {
        return (
            <PageContentBlock title={'Error'}>
                <p css={tw`text-center text-neutral-400`}>Failed to load allocation details.</p>
            </PageContentBlock>
        );
    }

    const { allocation, servers } = stats;
    const cpuPercent = allocation.limits.cpu === 0 ? 0 : (allocation.used.cpu / allocation.limits.cpu) * 100;
    const memoryPercent = allocation.limits.memory === 0 ? 0 : (allocation.used.memory / allocation.limits.memory) * 100;
    const diskPercent = allocation.limits.disk === 0 ? 0 : (allocation.used.disk / allocation.limits.disk) * 100;

    return (
        <PageContentBlock title={allocation.name || 'Dedicated Server'}>
            <div css={tw`mb-4 flex justify-between items-center`}>
                <Link to={'/account/dedicated'}>
                    <Button.Text>&larr; Back to Allocations</Button.Text>
                </Link>
                <p css={tw`text-sm text-neutral-400`}>Auto-refreshes every 30 seconds</p>
            </div>

            {/* Overview Section */}
            <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6`}>
                <TitledGreyBox title={'Node'}>
                    <div css={tw`text-center py-2`}>
                        <p css={tw`text-lg font-semibold`}>{allocation.node.name}</p>
                        <p css={tw`text-xs text-neutral-400`}>{allocation.node.location}</p>
                        <p css={tw`text-xs text-neutral-500 mt-1`}>{allocation.node.fqdn}</p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Total Servers'}>
                    <div css={tw`text-center py-2`}>
                        <p css={tw`text-3xl font-bold text-cyan-400`}>{allocation.used.servers}</p>
                        <p css={tw`text-xs text-neutral-400 mt-1`}>Active Servers</p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'CPU Usage'}>
                    <div css={tw`text-center py-2`}>
                        <p css={tw`text-3xl font-bold text-yellow-400`}>
                            {allocation.used.cpu}%
                        </p>
                        <p css={tw`text-xs text-neutral-400 mt-1`}>
                            of {allocation.limits.cpu === 0 ? 'Unlimited' : `${allocation.limits.cpu}%`}
                        </p>
                        {allocation.limits.cpu > 0 && (
                            <div css={tw`w-full bg-neutral-700 rounded-full h-2 mt-2`}>
                                <div
                                    css={tw`bg-yellow-400 h-2 rounded-full transition-all duration-300`}
                                    style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Memory Usage'}>
                    <div css={tw`text-center py-2`}>
                        <p css={tw`text-3xl font-bold text-green-400`}>
                            {(allocation.used.memory / 1024).toFixed(1)} GB
                        </p>
                        <p css={tw`text-xs text-neutral-400 mt-1`}>
                            of {allocation.overallocation.memory ? 'Unlimited' : `${(allocation.limits.memory / 1024).toFixed(1)} GB`}
                        </p>
                        {!allocation.overallocation.memory && (
                            <div css={tw`w-full bg-neutral-700 rounded-full h-2 mt-2`}>
                                <div
                                    css={tw`bg-green-400 h-2 rounded-full transition-all duration-300`}
                                    style={{ width: `${Math.min(memoryPercent, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                </TitledGreyBox>
            </div>

            {/* Resource Details */}
            <div css={tw`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6`}>
                <TitledGreyBox title={'CPU Details'}>
                    <div css={tw`space-y-2`}>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Allocated:</span>
                            <span css={tw`font-semibold`}>{allocation.limits.cpu === 0 ? 'Unlimited' : `${allocation.limits.cpu}%`}</span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Used:</span>
                            <span css={tw`font-semibold text-yellow-400`}>{allocation.used.cpu}%</span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Available:</span>
                            <span css={tw`font-semibold text-cyan-400`}>
                                {allocation.available.cpu === -1 ? 'Unlimited' : `${allocation.available.cpu}%`}
                            </span>
                        </div>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Memory Details'}>
                    <div css={tw`space-y-2`}>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Allocated:</span>
                            <span css={tw`font-semibold`}>
                                {allocation.overallocation.memory ? 'Unlimited' : `${(allocation.limits.memory / 1024).toFixed(1)} GB`}
                            </span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Used:</span>
                            <span css={tw`font-semibold text-green-400`}>{(allocation.used.memory / 1024).toFixed(1)} GB</span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Available:</span>
                            <span css={tw`font-semibold text-cyan-400`}>
                                {allocation.available.memory === -1 ? 'Unlimited' : `${(allocation.available.memory / 1024).toFixed(1)} GB`}
                            </span>
                        </div>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Disk Details'}>
                    <div css={tw`space-y-2`}>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Allocated:</span>
                            <span css={tw`font-semibold`}>
                                {allocation.overallocation.disk ? 'Unlimited' : `${(allocation.limits.disk / 1024).toFixed(1)} GB`}
                            </span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Used:</span>
                            <span css={tw`font-semibold text-blue-400`}>{(allocation.used.disk / 1024).toFixed(1)} GB</span>
                        </div>
                        <div css={tw`flex justify-between`}>
                            <span css={tw`text-neutral-400`}>Available:</span>
                            <span css={tw`font-semibold text-cyan-400`}>
                                {allocation.available.disk === -1 ? 'Unlimited' : `${(allocation.available.disk / 1024).toFixed(1)} GB`}
                            </span>
                        </div>
                    </div>
                </TitledGreyBox>
            </div>

            {/* Servers List */}
            <TitledGreyBox title={`Servers (${servers.length})`}>
                {servers.length === 0 ? (
                    <p css={tw`text-center text-neutral-400 py-4`}>No servers created yet.</p>
                ) : (
                    <div css={tw`overflow-x-auto`}>
                        <table css={tw`w-full`}>
                            <thead>
                                <tr css={tw`border-b border-neutral-700`}>
                                    <th css={tw`text-left py-3 px-4`}>Name</th>
                                    <th css={tw`text-left py-3 px-4`}>Software</th>
                                    <th css={tw`text-center py-3 px-4`}>CPU</th>
                                    <th css={tw`text-center py-3 px-4`}>Memory</th>
                                    <th css={tw`text-center py-3 px-4`}>Disk</th>
                                    <th css={tw`text-center py-3 px-4`}>Status</th>
                                    <th css={tw`text-right py-3 px-4`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servers.map((server) => (
                                    <tr key={server.id} css={tw`border-b border-neutral-700 hover:bg-neutral-700 transition-colors`}>
                                        <td css={tw`py-3 px-4`}>
                                            <p css={tw`font-semibold`}>{server.name}</p>
                                            <p css={tw`text-xs text-neutral-500`}>{server.identifier}</p>
                                        </td>
                                        <td css={tw`py-3 px-4 text-sm`}>{server.egg}</td>
                                        <td css={tw`py-3 px-4 text-center text-sm`}>{server.cpu}%</td>
                                        <td css={tw`py-3 px-4 text-center text-sm`}>{(server.memory / 1024).toFixed(1)} GB</td>
                                        <td css={tw`py-3 px-4 text-center text-sm`}>{(server.disk / 1024).toFixed(1)} GB</td>
                                        <td css={tw`py-3 px-4 text-center`}>
                                            {server.suspended ? (
                                                <span css={tw`px-2 py-1 bg-red-500 bg-opacity-25 text-red-400 rounded text-xs`}>
                                                    Suspended
                                                </span>
                                            ) : (
                                                <span css={tw`px-2 py-1 bg-green-500 bg-opacity-25 text-green-400 rounded text-xs`}>
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td css={tw`py-3 px-4 text-right`}>
                                            <Link to={`/server/${server.identifier}`}>
                                                <Button.Text css={tw`text-xs py-1 px-2`}>Manage</Button.Text>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </TitledGreyBox>
        </PageContentBlock>
    );
};
