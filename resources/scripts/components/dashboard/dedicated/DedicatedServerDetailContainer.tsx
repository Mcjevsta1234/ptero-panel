import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import { getAllocationStats, deleteDedicatedServer } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';

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
            databases: number;
            allocations: number;
            backups: number;
        };
        used: {
            cpu: number;
            memory: number;
            disk: number;
            servers: number;
            databases: number;
            allocations: number;
            backups: number;
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
        address?: string | null;
        egg: string;
        cpu: number;
        memory: number;
        disk: number;
        status: string;
        suspended: boolean;
        created_at: string;
    }>;
    node_usage?: {
        memory_allocated: number;
        memory_capacity: number;
        disk_allocated: number;
        disk_capacity: number;
        cpu_allocated: number;
        cpu_capacity: number | null;
    };
}

export default function DedicatedServerDetailContainer() {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { id } = useParams<{ id: string }>();
    const allocationId = parseInt(id as string, 10);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AllocationStats | null>(null);

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
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const { allocation, servers, node_usage } = stats;

    return (
        <PageContentBlock title={allocation.name || 'Dedicated Server'}>
            <div css={tw`mb-4 flex justify-between items-center`}>
                <Link to={'/account/dedicated'}>
                    <Button.Text>&larr; Back to Allocations</Button.Text>
                </Link>
                <p css={tw`text-sm text-neutral-400`}>Auto-refreshes every 30 seconds</p>
            </div>

            {/* Top: two larger cards */}
            <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
                <TitledGreyBox title={'Node Name'}>
                    <div css={tw`py-2 min-h-[150px]`}>
                        <p css={tw`text-lg font-semibold`}>{allocation.node.name}</p>
                        {/* Node address intentionally hidden */}
                        <div css={tw`mt-3 space-y-1 text-sm`}>
                            <p>
                                Node ram - allocated {allocation.limits.memory === 0 ? 'Unlimited' : `${(allocation.limits.memory / 1024).toFixed(1)} GB`}
                                {node_usage?.memory_capacity ? ` (Node ${(node_usage.memory_capacity / 1024).toFixed(1)} GB)` : ''}
                            </p>
                            <p>
                                Node cpu - allocated {allocation.limits.cpu === 0 ? 'Unlimited' : `${allocation.limits.cpu}%`}
                                {node_usage?.cpu_capacity ? ` (Node ${node_usage.cpu_capacity}%)` : ''}
                            </p>
                            <p>
                                Node disk - allocated {allocation.limits.disk === 0 ? 'Unlimited' : `${(allocation.limits.disk / 1024).toFixed(1)} GB`}
                                {node_usage?.disk_capacity ? ` (Node ${(node_usage.disk_capacity / 1024).toFixed(1)} GB)` : ''}
                            </p>
                        </div>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Server list'}>
                    <div css={tw`py-2 space-y-2 min-h-[150px]`}>
                        {servers.length === 0 ? (
                            <p css={tw`text-neutral-400 text-sm`}>No servers yet</p>
                        ) : (
                            servers.map((s) => (
                                <div key={s.id} css={tw`flex items-center justify-between bg-neutral-800 rounded px-3 py-2`}>
                                    <div>
                                        <Link to={`/server/${s.identifier}`} css={tw`text-sm font-semibold hover:underline`}>
                                            {s.address ?? s.identifier}
                                        </Link>
                                        <p css={tw`text-xs text-neutral-500`}>{s.name}</p>
                                    </div>
                                    <div css={tw`flex items-center gap-2`}>
                                        <Link to={`/server/${s.identifier}`}>
                                            <Button.Text css={tw`text-xs`}>Manage</Button.Text>
                                        </Link>
                                        <Button.Text
                                            css={tw`text-xs text-red-400`}
                                            onClick={async () => {
                                                clearFlashes('dedicated:detail');
                                                try {
                                                    await deleteDedicatedServer(s.id);
                                                    addFlash({ key: 'dedicated:detail', type: 'success', message: 'Server deleted.' });
                                                    fetchStats();
                                                } catch (error) {
                                                    clearAndAddHttpError({ key: 'dedicated:detail', error });
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button.Text>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TitledGreyBox>
            </div>

            {/* Three smaller cards */}
            <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6`}>
                <TitledGreyBox title={'used cpu'}>
                    <div css={tw`py-2 min-h-[100px]`}>
                        <p css={tw`text-2xl`}>{allocation.used.cpu}%</p>
                    </div>
                </TitledGreyBox>
                <TitledGreyBox title={'used ram'}>
                    <div css={tw`py-2 min-h-[100px]`}>
                        <p css={tw`text-2xl`}>{(allocation.used.memory / 1024).toFixed(1)} GB</p>
                    </div>
                </TitledGreyBox>
                <TitledGreyBox title={'used disk'}>
                    <div css={tw`py-2 min-h-[100px]`}>
                        <p css={tw`text-2xl`}>{(allocation.used.disk / 1024).toFixed(1)} GB</p>
                    </div>
                </TitledGreyBox>
            </div>

            {/* Bottom long limits bar */}
            <div css={tw`w-full mt-2`}>
                <div css={tw`px-4 py-3 bg-neutral-800 rounded text-center`}>
                    <span css={tw`mx-2`}>database {allocation.used.databases}/{allocation.limits.databases}</span>
                    <span css={tw`mx-2`}>allocation {allocation.used.allocations}/{allocation.limits.allocations}</span>
                    <span css={tw`mx-2`}>backups {allocation.used.backups}/{allocation.limits.backups}</span>
                </div>
            </div>
        </PageContentBlock>
    );
}
