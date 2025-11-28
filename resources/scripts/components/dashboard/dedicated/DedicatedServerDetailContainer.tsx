import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import { getAllocationStats, deleteDedicatedServer } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';
import styled from 'styled-components/macro';
import DeleteConfirmModal from './DeleteConfirmModal';
import CreateServerInlineForm from './CreateServerInlineForm';

const InfoCard = styled.div`
    ${tw`bg-neutral-700 rounded p-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`}
`;

const InfoLabel = styled.span`
    ${tw`text-neutral-400 text-sm`}
`;

const InfoValue = styled.span`
    ${tw`font-semibold text-neutral-100 break-words`}
`;

const ProgressTrack = styled.div`
    ${tw`w-full h-2 rounded-full bg-neutral-800 overflow-hidden`}
`;

const ProgressFill = styled.div<{ percent: number; color: string }>`
    ${tw`h-full rounded-full transition-all duration-300`}
    width: ${({ percent }) => Math.min(percent, 100)}%;
    background-color: ${({ color }) => color};
`;

const ServerCard = styled.div`
    ${tw`bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-3 transition-colors duration-200 hover:border-primary-500`}
`;

const ServerMeta = styled.div`
    ${tw`text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1`}
`;

type StatusIntent = 'online' | 'offline' | 'installing' | 'suspended';

const statusVariants: Record<StatusIntent, ReturnType<typeof tw>> = {
    online: tw`bg-emerald-500/20 text-emerald-200 border border-emerald-500/30`,
    offline: tw`bg-neutral-800 text-neutral-200 border border-neutral-700`,
    installing: tw`bg-amber-500/20 text-amber-200 border border-amber-500/30`,
    suspended: tw`bg-red-500/20 text-red-200 border border-red-500/30`,
};

const StatusBadge = styled.span<{ intent: StatusIntent }>`
    ${tw`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border`}
    ${({ intent }) => statusVariants[intent] || statusVariants.offline}
`;

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
    const [deleteModal, setDeleteModal] = useState<{ visible: boolean; serverName: string; serverIdentifier: string }>({
        visible: false,
        serverName: '',
        serverIdentifier: '',
    });

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

    const { allocation, servers } = stats;

    const handleDeleteClick = (serverName: string, serverIdentifier: string) => {
        setDeleteModal({ visible: true, serverName, serverIdentifier });
    };

    const handleDeleteConfirm = async () => {
        clearFlashes('dedicated:detail');
        try {
            await deleteDedicatedServer(deleteModal.serverIdentifier);
            addFlash({ 
                key: 'dedicated:detail', 
                type: 'success', 
                message: 'Server deleted successfully.' 
            });
            setDeleteModal({ visible: false, serverName: '', serverIdentifier: '' });
            fetchStats();
        } catch (error) {
            console.error('Delete error:', error);
            clearAndAddHttpError({ key: 'dedicated:detail', error });
        }
    };

    const formatGb = (value: number) => `${(value / 1024).toFixed(1)} GB`;
    const formatLimit = (value: number, suffix = '') => (value === 0 ? 'Unlimited' : `${value}${suffix}`);
    const formatLimitGb = (value: number) => (value === 0 ? 'Unlimited' : formatGb(value));
    const remainingCpu = allocation.limits.cpu === 0 ? 'Unlimited' : `${Math.max(allocation.limits.cpu - allocation.used.cpu, 0)}%`;
    const remainingMemory = allocation.limits.memory === 0 ? 'Unlimited' : formatGb(Math.max(allocation.limits.memory - allocation.used.memory, 0));
    const remainingDisk = allocation.limits.disk === 0 ? 'Unlimited' : formatGb(Math.max(allocation.limits.disk - allocation.used.disk, 0));
    const cpuPercent = allocation.limits.cpu === 0 ? 0 : (allocation.used.cpu / allocation.limits.cpu) * 100;
    const memoryPercent = allocation.limits.memory === 0 ? 0 : (allocation.used.memory / allocation.limits.memory) * 100;
    const diskPercent = allocation.limits.disk === 0 ? 0 : (allocation.used.disk / allocation.limits.disk) * 100;
    const nodeLocation = allocation.node.location || 'Unknown';

    const humanizeStatus = (value: string) =>
        value
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());

    const resolveServerStatus = (server: AllocationStats['servers'][number]): { label: string; intent: StatusIntent } => {
        if (server.suspended) {
            return { label: 'Suspended', intent: 'suspended' };
        }

        const raw = (server.status || '').trim();
        if (!raw) {
            return { label: 'Offline', intent: 'offline' };
        }

        const normalized = raw.toLowerCase();
        if (normalized.includes('install')) {
            return { label: 'Installing', intent: 'installing' };
        }
        if (normalized.includes('running') || normalized.includes('online')) {
            return { label: 'Online', intent: 'online' };
        }
        if (normalized.includes('starting')) {
            return { label: 'Starting', intent: 'installing' };
        }
        if (normalized.includes('offline') || normalized.includes('stopping')) {
            return { label: 'Offline', intent: 'offline' };
        }

        return { label: humanizeStatus(raw), intent: 'offline' };
    };


    return (
        <PageContentBlock title={allocation.name || 'Dedicated Server'}>
            <div css={tw`grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8`}>
                <TitledGreyBox title={'Allocation Overview'}>
                    <div css={tw`space-y-6`}>
                        <div css={tw`grid grid-cols-1 lg:grid-cols-3 gap-4`}>
                            <div>
                                <div css={tw`flex justify-between text-xs uppercase tracking-wide text-neutral-400`}>
                                    <span>CPU Usage</span>
                                    <span>{allocation.used.cpu}% / {formatLimit(allocation.limits.cpu, '%')}</span>
                                </div>
                                <ProgressTrack>
                                    <ProgressFill percent={cpuPercent} color={'rgb(59,130,246)'} />
                                </ProgressTrack>
                                <p css={tw`text-xs text-neutral-300 mt-1`}>Available: {remainingCpu}</p>
                            </div>

                            <div>
                                <div css={tw`flex justify-between text-xs uppercase tracking-wide text-neutral-400`}>
                                    <span>Memory Usage</span>
                                    <span>
                                        {formatGb(allocation.used.memory)} / {formatLimitGb(allocation.limits.memory)}
                                    </span>
                                </div>
                                <ProgressTrack>
                                    <ProgressFill percent={memoryPercent} color={'rgb(16,185,129)'} />
                                </ProgressTrack>
                                <p css={tw`text-xs text-neutral-300 mt-1`}>Available: {remainingMemory}</p>
                            </div>

                            <div>
                                <div css={tw`flex justify-between text-xs uppercase tracking-wide text-neutral-400`}>
                                    <span>Disk Usage</span>
                                    <span>
                                        {formatGb(allocation.used.disk)} / {formatLimitGb(allocation.limits.disk)}
                                    </span>
                                </div>
                                <ProgressTrack>
                                    <ProgressFill percent={diskPercent} color={'rgb(250,204,21)'} />
                                </ProgressTrack>
                                <p css={tw`text-xs text-neutral-300 mt-1`}>Available: {remainingDisk}</p>
                            </div>
                        </div>

                        <div css={tw`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`}>
                            <InfoCard>
                                <InfoLabel>Databases</InfoLabel>
                                <InfoValue>
                                    {allocation.used.databases} / {allocation.limits.databases === 0 ? '∞' : allocation.limits.databases}
                                </InfoValue>
                            </InfoCard>
                            <InfoCard>
                                <InfoLabel>Allocations</InfoLabel>
                                <InfoValue>
                                    {allocation.used.allocations} / {allocation.limits.allocations === 0 ? '∞' : allocation.limits.allocations}
                                </InfoValue>
                            </InfoCard>
                            <InfoCard>
                                <InfoLabel>Backups</InfoLabel>
                                <InfoValue>
                                    {allocation.used.backups} / {allocation.limits.backups === 0 ? '∞' : allocation.limits.backups}
                                </InfoValue>
                            </InfoCard>
                            <InfoCard>
                                <div>
                                    <InfoLabel>Node</InfoLabel>
                                    <InfoValue>{allocation.node.name}</InfoValue>
                                </div>
                                <span css={tw`text-xs text-neutral-400`}>{nodeLocation}</span>
                            </InfoCard>
                            <InfoCard>
                                <div>
                                    <InfoLabel>Main IP</InfoLabel>
                                    <InfoValue css={tw`text-xs sm:text-sm break-all`}>{allocation.node.fqdn}</InfoValue>
                                </div>
                            </InfoCard>
                            <InfoCard>
                                <InfoLabel>Servers Deployed</InfoLabel>
                                <InfoValue>{servers.length}</InfoValue>
                            </InfoCard>
                        </div>
                    </div>
                </TitledGreyBox>

                <CreateServerInlineForm
                    allocationId={allocation.id}
                    limits={allocation.limits}
                    used={allocation.used}
                    onCreated={() => fetchStats()}
                />
            </div>

            <TitledGreyBox title={'Servers'}>
                {servers.length === 0 ? (
                    <div css={tw`py-12 text-center text-neutral-400`}>No servers created yet.</div>
                ) : (
                    <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-4`}>
                        {servers.map((s) => {
                            const statusInfo = resolveServerStatus(s);

                            return (
                                <ServerCard key={s.id}>
                                    <div css={tw`flex items-start justify-between gap-4`}>
                                        <div>
                                            <p css={tw`text-sm font-semibold text-neutral-100 leading-tight`}>{s.name}</p>
                                            <p css={tw`text-[11px] text-neutral-500`}>{s.address ?? s.identifier}</p>
                                        </div>
                                        <StatusBadge intent={statusInfo.intent}>{statusInfo.label}</StatusBadge>
                                    </div>
                                    <ServerMeta>
                                        <span>CPU {s.cpu}%</span>
                                        <span>RAM {(s.memory / 1024).toFixed(1)} GB</span>
                                        <span>Disk {(s.disk / 1024).toFixed(1)} GB</span>
                                        <span>Game {s.egg}</span>
                                    </ServerMeta>
                                <div css={tw`flex flex-wrap gap-2`}>
                                    <Link to={`/server/${s.identifier}`}>
                                        <Button.Text css={tw`text-[11px] px-3 py-1`}>Manage</Button.Text>
                                    </Link>
                                    <Button.Danger
                                        css={tw`text-[11px] px-3 py-1`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteClick(s.name, s.identifier);
                                        }}
                                    >
                                        Delete
                                    </Button.Danger>
                                </div>
                                </ServerCard>
                            );
                        })}
                    </div>
                )}
            </TitledGreyBox>

            <DeleteConfirmModal
                visible={deleteModal.visible}
                serverName={deleteModal.serverName}
                onConfirm={handleDeleteConfirm}
                onModalDismissed={() => setDeleteModal({ visible: false, serverName: '', serverIdentifier: '' })}
            />
        </PageContentBlock>
    );
}
