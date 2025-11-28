import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
            <div css={tw`mb-4 flex justify-between items-center`}>
import { getAllocationStats, getFormData, getEggDetails, createDedicatedServer, deleteDedicatedServer } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';
import { Link } from 'react-router-dom';
            <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
                {/* Left: Node summary styled like screenshot - thicker card */}
                <TitledGreyBox title={'Node Name'}>
                    <div css={tw`py-2 min-h-[150px]`}>
                        <p css={tw`text-lg font-semibold`}>{allocation.node.name}</p>
                        {/* Node address removed per request */}
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

                {/* Right: Server management list (click to manage, delete button) — thicker card */}
                <TitledGreyBox title={'Server list'}>
                    <div css={tw`py-2 space-y-2 min-h-[150px]`}>
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
            {/* Three small usage tiles */}
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
            return;
        }
        try {
            const egg = await getEggDetails(eggId);
            setSelectedEgg(egg);
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:detail', error });
        }
    };

    const handleCreateServer = async (values: CreateServerFormValues, { setSubmitting, resetForm }: FormikHelpers<CreateServerFormValues>) => {
        clearFlashes('dedicated:detail');
        try {
            await createDedicatedServer({
                allocation_id: allocationId,
                name: values.name,
                egg_id: values.egg_id!,
                memory: values.memory,
                disk: values.disk,
                cpu: values.cpu,
                databases: values.databases,
                allocations: values.allocations,
                backups: values.backups,
                swap: 1024,
                io: 500,
                docker_image: values.docker_image || undefined,
            });
            addFlash({
                key: 'dedicated:detail',
                type: 'success',
                message: 'Server created successfully! It may take a few moments to install.',
            });
            resetForm();
            setShowCreateForm(false);
            fetchStats(); // Refresh the stats to show the new server
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:detail', error });
        } finally {
            setSubmitting(false);
        }
    };

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

            {/* Long limits bar at bottom */}
            <div css={tw`w-full mt-2`}>
                <div css={tw`px-4 py-3 bg-neutral-800 rounded text-center`}>
                    <span css={tw`mx-2`}>database {allocation.used.databases}/{allocation.limits.databases}</span>
                    <span css={tw`mx-2`}>allocation {allocation.used.allocations}/{allocation.limits.allocations}</span>
                    <span css={tw`mx-2`}>backups {allocation.used.backups}/{allocation.limits.backups}</span>
                </div>
            </div>

            {/* Overview Section */}
            <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6`}>
                {/* Left: Node summary styled like screenshot */}
                <TitledGreyBox title={'Node Name'}>
                    <div css={tw`py-2`}>
                        <p css={tw`text-lg font-semibold`}>{allocation.node.name}</p>
                        <p css={tw`text-xs text-neutral-500 mt-1`}>{allocation.node.fqdn}</p>
                        <div css={tw`mt-3 space-y-1 text-sm`}>
                            <p>Node ram - allocated ram</p>
                            <p>Node cpu - allocated cpu</p>
                            <p>Node disk - allocated disk</p>
                        </div>
                    </div>
                </TitledGreyBox>

                {/* Right: Server management list (click to manage, delete button) */}
                <TitledGreyBox title={'Server list'}>
                    <div css={tw`py-2 space-y-2`}>
                        {servers.length === 0 ? (
                            <p css={tw`text-neutral-400 text-sm`}>No servers yet</p>
                        ) : (
                            servers.map(s => (
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

                {/* Used resource tiles */}
                <TitledGreyBox title={'used cpu'}>
                    <div css={tw`py-2`}>
                        <p css={tw`text-2xl`}>{allocation.used.cpu}%</p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'used ram'}>
                    <div css={tw`py-2`}>
                        <p css={tw`text-2xl`}>{(allocation.used.memory / 1024).toFixed(1)} GB</p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'used disk'}>
                    <div css={tw`py-2`}>
                        <p css={tw`text-2xl`}>{(allocation.used.disk / 1024).toFixed(1)} GB</p>
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

            {/* Create Server section removed per request (button replaced by limits bar). */}

            {/* Removed bottom servers table as requested */}
        </PageContentBlock>
    );
};
