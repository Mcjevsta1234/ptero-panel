import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import { getAllocationStats, deleteDedicatedServer } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';
import styled, { css } from 'styled-components/macro';
import DeleteConfirmModal from './DeleteConfirmModal';
import CreateServerInlineForm from './CreateServerInlineForm';

const TitleText = styled.div`
    ${tw`text-center font-semibold text-base text-neutral-100`}
`;

const MetricsPanel = styled.div`
    ${tw`bg-neutral-700 rounded-2xl p-6 lg:p-8`}
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
`;

const MetricGrid = styled.div`
    ${tw`grid gap-4 w-full`}
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    grid-auto-rows: auto;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const MetricCard = styled.div`
    ${tw`bg-neutral-800 rounded-lg p-4 flex flex-col gap-2`}
    width: 100%;
`;

const ProgressBar = styled.div`
    ${tw`w-full h-2 rounded-full bg-neutral-900 overflow-hidden`}
`;

const ProgressFill = styled.div<{ percent: number; color: string }>`
    ${tw`h-full rounded-full transition-all duration-300`}
    width: ${({ percent }) => Math.min(percent, 100)}%;
    background-color: ${({ color }) => color};
`;



const MetricLabel = styled.span`
    ${tw`text-xs uppercase tracking-wide text-neutral-400`}
`;

const MetricValue = styled.div`
    ${tw`flex justify-between items-baseline text-sm`}
`;

const MetricDetail = styled.span`
    ${tw`text-xs text-neutral-400`}
`;

const ServerCard = styled.div`
    ${tw`bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-3 transition-colors duration-200 hover:border-primary-500`}
`;

const ServerMeta = styled.div`
    ${tw`text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1`}
`;

type StatusIntent = 'online' | 'offline' | 'installing' | 'suspended';

const statusPalette: Record<StatusIntent, { bg: string; border: string; color: string }> = {
    online: {
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        color: 'rgb(110, 231, 183)',
    },
    offline: {
        bg: 'rgba(38, 38, 38, 1)',
        border: 'rgba(82, 82, 82, 1)',
        color: 'rgb(212, 212, 212)',
    },
    installing: {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        color: 'rgb(251, 191, 36)',
    },
    suspended: {
        bg: 'rgba(248, 113, 113, 0.2)',
        border: 'rgba(248, 113, 113, 0.5)',
        color: 'rgb(252, 165, 165)',
    },
};

const StatusBadge = styled.span<{ $intent: StatusIntent }>`
    ${tw`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border font-semibold`}
    ${({ $intent }) => {
        const palette = statusPalette[$intent] || statusPalette.offline;
        return css`
            background-color: ${palette.bg};
            border-color: ${palette.border};
            color: ${palette.color};
        `;
    }}
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
    const remainingDatabases = allocation.limits.databases === 0 ? 'Unlimited' : `${Math.max(allocation.limits.databases - allocation.used.databases, 0)}`;
    const remainingAllocations = allocation.limits.allocations === 0 ? 'Unlimited' : `${Math.max(allocation.limits.allocations - allocation.used.allocations, 0)}`;
    const remainingBackups = allocation.limits.backups === 0 ? 'Unlimited' : `${Math.max(allocation.limits.backups - allocation.used.backups, 0)}`;
    const cpuPercent = allocation.limits.cpu === 0 ? 0 : (allocation.used.cpu / allocation.limits.cpu) * 100;
    const memoryPercent = allocation.limits.memory === 0 ? 0 : (allocation.used.memory / allocation.limits.memory) * 100;
    const diskPercent = allocation.limits.disk === 0 ? 0 : (allocation.used.disk / allocation.limits.disk) * 100;
    const databasePercent = allocation.limits.databases === 0 ? 0 : (allocation.used.databases / allocation.limits.databases) * 100;
    const allocationsPercent = allocation.limits.allocations === 0 ? 0 : (allocation.used.allocations / allocation.limits.allocations) * 100;
    const backupsPercent = allocation.limits.backups === 0 ? 0 : (allocation.used.backups / allocation.limits.backups) * 100;

    const humanizeStatus = (value: string) =>
        value
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());

    const countDisplay = (usedCount: number, limitCount: number) => `${usedCount} / ${limitCount === 0 ? '∞' : limitCount}`;

    const renderTitle = (text: string) => <TitleText>{text}</TitleText>;

    const usageMetrics = [
        {
            key: 'cpu',
            label: 'CPU Usage',
            used: `${allocation.used.cpu}%`,
            total: formatLimit(allocation.limits.cpu, '%'),
            available: remainingCpu,
            percent: cpuPercent,
            color: 'rgb(59,130,246)',
        },
        {
            key: 'memory',
            label: 'Memory Usage',
            used: formatGb(allocation.used.memory),
            total: formatLimitGb(allocation.limits.memory),
            available: remainingMemory,
            percent: memoryPercent,
            color: 'rgb(16,185,129)',
        },
        {
            key: 'disk',
            label: 'Disk Usage',
            used: formatGb(allocation.used.disk),
            total: formatLimitGb(allocation.limits.disk),
            available: remainingDisk,
            percent: diskPercent,
            color: 'rgb(250,204,21)',
        },
        {
            key: 'databases',
            label: 'Databases',
            used: countDisplay(allocation.used.databases, allocation.limits.databases),
            total: '',
            available: remainingDatabases,
            percent: databasePercent,
            color: 'rgb(147,197,253)',
        },
        {
            key: 'allocations',
            label: 'Allocations',
            used: countDisplay(allocation.used.allocations, allocation.limits.allocations),
            total: '',
            available: remainingAllocations,
            percent: allocationsPercent,
            color: 'rgb(129,140,248)',
        },
        {
            key: 'backups',
            label: 'Backups',
            used: countDisplay(allocation.used.backups, allocation.limits.backups),
            total: '',
            available: remainingBackups,
            percent: backupsPercent,
            color: 'rgb(248,113,113)',
        },
    ];

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
                <MetricsPanel>
                    <MetricGrid>
                        {usageMetrics.map((metric) => (
                            <MetricCard key={metric.key}>
                                <MetricLabel>{metric.label}</MetricLabel>
                                <MetricValue>
                                    <span css={tw`font-semibold text-neutral-100`}>
                                        {metric.key === 'cpu' || metric.key === 'memory' || metric.key === 'disk'
                                            ? `${metric.used} / ${metric.total}`
                                            : metric.used}
                                    </span>
                                </MetricValue>
                                <ProgressBar>
                                    <ProgressFill percent={metric.percent} color={metric.color} />
                                </ProgressBar>
                            </MetricCard>
                        ))}
                    </MetricGrid>
                </MetricsPanel>

                <CreateServerInlineForm
                    allocationId={allocation.id}
                    limits={allocation.limits}
                    used={allocation.used}
                    onCreated={() => fetchStats()}
                    titleOverride={renderTitle('Create Server')}
                />
            </div>

            <TitledGreyBox title={renderTitle(`Servers (${servers.length})`)}>
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
                                        <StatusBadge $intent={statusInfo.intent}>{statusInfo.label}</StatusBadge>
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
