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
import CreateServerModal from './CreateServerModal';
import Card from '@/witchyworlds/ui/Card';
import Title from '@/witchyworlds/ui/Title';

const InfoCard = styled.div`
    ${tw`bg-neutral-700 rounded p-3 flex justify-between items-center`}
`;

const InfoLabel = styled.span`
    ${tw`text-neutral-400 text-sm`}
`;

const InfoValue = styled.span`
    ${tw`font-semibold text-neutral-100`}
`;

const ProgressTrack = styled.div`
    ${tw`w-full h-2 rounded-full bg-neutral-800 overflow-hidden`}
`;

const ProgressFill = styled.div<{ percent: number; color: string }>`
    ${tw`h-full rounded-full transition-all duration-300`}
    width: ${({ percent }) => Math.min(percent, 100)}%;
    background-color: ${({ color }) => color};
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
    const [createModalVisible, setCreateModalVisible] = useState(false);

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

    return (
        <PageContentBlock title={allocation.name || 'Dedicated Server'}>
            <div css={tw`mb-6 flex justify-between items-center`}>
                {/* Server Fleet */}
                <div css={tw`mb-8`}>
                    {servers.length === 0 ? (
                        <TitledGreyBox title={'Servers'}>
                            <div css={tw`py-10 text-center text-neutral-400`}>No servers created yet.</div>
                        </TitledGreyBox>
                    ) : (
                        <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-5`}>
                            {servers.map((s) => (
                                <Card key={s.id} css={tw`!p-0 overflow-hidden relative`}>
                                    <div
                                        css={tw`relative p-5`}
                                        style={{
                                            backgroundImage: 'linear-gradient(135deg, rgba(76, 0, 255, 0.1), rgba(0, 200, 255, 0.05))',
                                        }}
                                    >
                                        <div css={tw`flex items-start justify-between`}>
                                            <div>
                                                <Title css={tw`text-xl mb-1`}>{s.name}</Title>
                                                <p css={tw`text-sm text-neutral-400`}>{s.address ?? s.identifier}</p>
                                            </div>
                                            <span css={tw`text-xs px-3 py-1 rounded-full bg-neutral-800 text-neutral-200`}>
                                                {s.status ?? 'Unknown'}
                                            </span>
                                        </div>
                                        <div css={tw`grid grid-cols-2 gap-3 mt-4 text-sm`}>
                                            <InfoCard css={tw`bg-neutral-800 bg-opacity-60`}>
                                                <InfoLabel>CPU</InfoLabel>
                                                <InfoValue>{s.cpu}%</InfoValue>
                                            </InfoCard>
                                            <InfoCard css={tw`bg-neutral-800 bg-opacity-60`}>
                                                <InfoLabel>Memory</InfoLabel>
                                                <InfoValue>{(s.memory / 1024).toFixed(1)} GB</InfoValue>
                                            </InfoCard>
                                            <InfoCard css={tw`bg-neutral-800 bg-opacity-60`}>
                                                <InfoLabel>Disk</InfoLabel>
                                                <InfoValue>{(s.disk / 1024).toFixed(1)} GB</InfoValue>
                                            </InfoCard>
                                            <InfoCard css={tw`bg-neutral-800 bg-opacity-60`}>
                                                <InfoLabel>Egg</InfoLabel>
                                                <InfoValue css={tw`text-xs`}>{s.egg}</InfoValue>
                                            </InfoCard>
                                        </div>
                                        <div css={tw`flex items-center gap-3 mt-5`}>
                                            <Link to={`/server/${s.identifier}`}>
                                                <Button.Text css={tw`text-xs px-3 py-1`}>Manage</Button.Text>
                                            </Link>
                                            <Button.Danger
                                                css={tw`text-xs px-3 py-1`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteClick(s.name, s.identifier);
                                                }}
                                            >
                                                Delete
                                            </Button.Danger>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Usage Progress Bars */}
                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8`}>
                    <TitledGreyBox title={'CPU Allocation'}>
                        <div css={tw`space-y-2`}>
                            <div css={tw`flex justify-between text-sm`}>
                                <span css={tw`text-neutral-400`}>Used</span>
                                <span css={tw`font-semibold`}>{allocation.used.cpu}%</span>
                            </div>
                            <ProgressTrack>
                                <ProgressFill percent={cpuPercent} color={'rgb(59,130,246)'} />
                            </ProgressTrack>
                            <p css={tw`text-xs text-neutral-400`}>Total: {formatLimit(allocation.limits.cpu, '%')}</p>
                            <p css={tw`text-xs text-neutral-300`}>Available: {remainingCpu}</p>
                        </div>
                    </TitledGreyBox>

                    <TitledGreyBox title={'Memory Allocation'}>
                        <div css={tw`space-y-2`}>
                            <div css={tw`flex justify-between text-sm`}>
                                <span css={tw`text-neutral-400`}>Used</span>
                                <span css={tw`font-semibold`}>{formatGb(allocation.used.memory)}</span>
                            </div>
                            <ProgressTrack>
                                <ProgressFill percent={memoryPercent} color={'rgb(16,185,129)'} />
                            </ProgressTrack>
                            <p css={tw`text-xs text-neutral-400`}>Total: {formatLimitGb(allocation.limits.memory)}</p>
                            <p css={tw`text-xs text-neutral-300`}>Available: {remainingMemory}</p>
                        </div>
                    </TitledGreyBox>

                    <TitledGreyBox title={'Disk Allocation'}>
                        <div css={tw`space-y-2`}>
                            <div css={tw`flex justify-between text-sm`}>
                                <span css={tw`text-neutral-400`}>Used</span>
                                <span css={tw`font-semibold`}>{formatGb(allocation.used.disk)}</span>
                            </div>
                            <ProgressTrack>
                                <ProgressFill percent={diskPercent} color={'rgb(250,204,21)'} />
                            </ProgressTrack>
                            <p css={tw`text-xs text-neutral-400`}>Total: {formatLimitGb(allocation.limits.disk)}</p>
                            <p css={tw`text-xs text-neutral-300`}>Available: {remainingDisk}</p>
                        </div>
                    </TitledGreyBox>
                </div>
                {/* End Top Stats Grid */}

                <TitledGreyBox title={'Disk Usage'}>
                    <div css={tw`py-4`}>
                        <p css={tw`text-4xl font-bold text-yellow-400`}>{(allocation.used.disk / 1024).toFixed(1)} GB</p>
                        <p css={tw`text-xs text-neutral-400 mt-2`}>
                            of {allocation.limits.disk === 0 ? 'unlimited' : `${(allocation.limits.disk / 1024).toFixed(1)} GB`}
                        </p>
                    </div>
                </TitledGreyBox>
            </div>

            {/* Bottom: Resource Limits Bar */}
            <TitledGreyBox title={'Resource Usage'}>
                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4`}>
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
                </div>
            </TitledGreyBox>

            <DeleteConfirmModal
                visible={deleteModal.visible}
                serverName={deleteModal.serverName}
                onConfirm={handleDeleteConfirm}
                onModalDismissed={() => setDeleteModal({ visible: false, serverName: '', serverIdentifier: '' })}
            />

            {stats && (
                <CreateServerModal
                    visible={createModalVisible}
                    allocation={{
                        id: allocation.id,
                        name: allocation.name,
                        user_id: 0, // Not needed for modal
                        node_id: allocation.node.id,
                        node: allocation.node,
                        cpu: allocation.limits.cpu,
                        memory: allocation.limits.memory,
                        disk: allocation.limits.disk,
                        swap: 0,
                        io: 0,
                        database_limit: allocation.limits.databases,
                        allocation_limit: allocation.limits.allocations,
                        backup_limit: allocation.limits.backups,
                        port_range_start: null,
                        port_range_end: null,
                        allow_memory_overallocation: allocation.overallocation.memory,
                        allow_disk_overallocation: allocation.overallocation.disk,
                        allowed_nests: null,
                        allowed_eggs: null,
                        active: true,
                        servers_count: servers.length,
                        servers: servers.map((s) => ({
                            id: s.id,
                            uuid: s.uuid,
                            name: s.name,
                            identifier: s.identifier,
                        })),
                        used_resources: {
                            cpu: allocation.used.cpu,
                            memory: allocation.used.memory,
                            disk: allocation.used.disk,
                            databases: allocation.used.databases,
                            allocations: allocation.used.allocations,
                            backups: allocation.used.backups,
                            server_count: servers.length,
                        },
                        available_resources: {
                            cpu: allocation.available.cpu,
                            memory: allocation.available.memory,
                            disk: allocation.available.disk,
                            databases: allocation.limits.databases - allocation.used.databases,
                            allocations: allocation.limits.allocations - allocation.used.allocations,
                            backups: allocation.limits.backups - allocation.used.backups,
                        },
                    }}
                    onDismissed={() => {
                        setCreateModalVisible(false);
                        fetchStats();
                    }}
                />
            )}
        </PageContentBlock>
    );
}
