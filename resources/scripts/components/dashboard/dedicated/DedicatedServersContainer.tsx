import React, { useEffect, useState } from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';
import tw from 'twin.macro';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Spinner from '@/components/elements/Spinner';
import { getAllocations } from '@/api/dedicated';
import { DedicatedAllocation } from '@/api/dedicated/types';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import Card from '@/witchyworlds/ui/Card';
import Title from '@/witchyworlds/ui/Title';
import { bytesToString } from '@/lib/formatters';

export default ({ location }: RouteComponentProps) => {
    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState<DedicatedAllocation[]>([]);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes('dedicated');
        setLoading(true);
        getAllocations()
            .then((data) => setAllocations(data))
            .catch((error) => clearAndAddHttpError({ key: 'dedicated', error }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <PageContentBlock title={'Dedicated Servers'}>
                <Spinner size={'large'} centered />
            </PageContentBlock>
        );
    }

    if (allocations.length === 0) {
        return (
            <PageContentBlock title={'Dedicated Servers'}>
                <TitledGreyBox title={'No Allocations'}>
                    <p css={tw`text-neutral-400 text-center text-sm`}>
                        You don't have any dedicated server allocations yet. Contact an administrator to get started.
                    </p>
                </TitledGreyBox>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={'Dedicated Servers'}>
            <div css={tw`grid grid-cols-1 gap-4`}>
                {allocations.map((allocation) => {
                    const used = allocation.used_resources;
                    const memoryUsage = (used.memory / allocation.memory) * 100;
                    const diskUsage = (used.disk / allocation.disk) * 100;
                    const cpuUsage = allocation.cpu > 0 ? (used.cpu / allocation.cpu) * 100 : 0;

                    return (
                        <Link key={allocation.id} to={`/account/dedicated/${allocation.id}`}>
                            <Card css={tw`!p-0 hover:border-cyan-400 transition-colors cursor-pointer`}>
                                <div css={tw`p-6`}>
                                    {/* Header */}
                                    <div css={tw`flex items-center justify-between pb-4 border-b border-neutral-700`}>
                                        <div>
                                            <Title css={tw`text-2xl mb-1`}>{allocation.name}</Title>
                                            <p css={tw`text-sm text-neutral-400`}>{allocation.node.name}</p>
                                        </div>
                                        <span css={tw`py-1 px-3 text-xs font-medium rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30`}>
                                            {allocation.servers_count} {allocation.servers_count === 1 ? 'Server' : 'Servers'}
                                        </span>
                                    </div>

                                    {/* Resource Stats */}
                                    <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 pt-4`}>
                                        {/* CPU */}
                                        <div>
                                            <div css={tw`flex items-center justify-between mb-2`}>
                                                <span css={tw`text-xs font-medium text-neutral-400 uppercase tracking-wider`}>CPU</span>
                                                <span css={tw`text-sm font-semibold text-neutral-200`}>
                                                    {used.cpu}% / {allocation.cpu === 0 ? '\u221e' : `${allocation.cpu}%`}
                                                </span>
                                            </div>
                                            <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                                                <div
                                                    css={tw`h-2 rounded-full transition-all duration-300`}
                                                    className={cpuUsage >= 90 ? 'bg-red-500' : cpuUsage >= 75 ? 'bg-yellow-500' : 'bg-cyan-500'}
                                                    style={{ width: `${Math.min(cpuUsage, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Memory */}
                                        <div>
                                            <div css={tw`flex items-center justify-between mb-2`}>
                                                <span css={tw`text-xs font-medium text-neutral-400 uppercase tracking-wider`}>Memory</span>
                                                <span css={tw`text-sm font-semibold text-neutral-200`}>
                                                    {bytesToString(used.memory * 1024 * 1024)} / {bytesToString(allocation.memory * 1024 * 1024)}
                                                </span>
                                            </div>
                                            <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                                                <div
                                                    css={tw`h-2 rounded-full transition-all duration-300`}
                                                    className={
                                                        allocation.allow_memory_overallocation
                                                            ? 'bg-blue-500'
                                                            : memoryUsage >= 90
                                                            ? 'bg-red-500'
                                                            : memoryUsage >= 75
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                    }
                                                    style={{ width: `${Math.min(memoryUsage, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Disk */}
                                        <div>
                                            <div css={tw`flex items-center justify-between mb-2`}>
                                                <span css={tw`text-xs font-medium text-neutral-400 uppercase tracking-wider`}>Disk</span>
                                                <span css={tw`text-sm font-semibold text-neutral-200`}>
                                                    {bytesToString(used.disk * 1024 * 1024)} / {bytesToString(allocation.disk * 1024 * 1024)}
                                                </span>
                                            </div>
                                            <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                                                <div
                                                    css={tw`h-2 rounded-full transition-all duration-300`}
                                                    className={
                                                        allocation.allow_disk_overallocation
                                                            ? 'bg-blue-500'
                                                            : diskUsage >= 90
                                                            ? 'bg-red-500'
                                                            : diskUsage >= 75
                                                            ? 'bg-yellow-500'
                                                            : 'bg-purple-500'
                                                    }
                                                    style={{ width: `${Math.min(diskUsage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </PageContentBlock>
    );
};
