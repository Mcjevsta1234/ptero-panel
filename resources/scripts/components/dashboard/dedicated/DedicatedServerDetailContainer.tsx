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

const InfoCard = styled.div`
    ${tw`bg-neutral-700 rounded p-3 flex justify-between items-center`}
`;

const InfoLabel = styled.span`
    ${tw`text-neutral-400 text-sm`}
`;

const InfoValue = styled.span`
    ${tw`font-semibold text-neutral-100`}
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
    const [deleteModal, setDeleteModal] = useState<{ visible: boolean; serverName: string; serverUuid: string }>({
        visible: false,
        serverName: '',
        serverUuid: '',
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

    const handleDeleteClick = (serverName: string, serverUuid: string) => {
        setDeleteModal({ visible: true, serverName, serverUuid });
    };

    const handleDeleteConfirm = async () => {
        clearFlashes('dedicated:detail');
        try {
            await deleteDedicatedServer(deleteModal.serverUuid);
            addFlash({ 
                key: 'dedicated:detail', 
                type: 'success', 
                message: 'Server deleted successfully.' 
            });
            setDeleteModal({ visible: false, serverName: '', serverUuid: '' });
            fetchStats();
        } catch (error) {
            console.error('Delete error:', error);
            clearAndAddHttpError({ key: 'dedicated:detail', error });
        }
    };

    return (
        <PageContentBlock title={allocation.name || 'Dedicated Server'}>
            <div css={tw`mb-6 flex justify-between items-center`}>
                <Link to={'/account/dedicated'}>
                    <Button.Text>&larr; Back to Allocations</Button.Text>
                </Link>
                <div css={tw`flex items-center gap-3`}>
                    <p css={tw`text-xs text-neutral-400`}>Auto-refreshes every 30 seconds</p>
                    <Button onClick={() => setCreateModalVisible(true)} css={tw`px-4 py-2`}>
                        Create Server
                    </Button>
                </div>
            </div>

            {/* Top Row: Server Plan Info & Server List */}
            <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6`}>
                {/* Left: Server Plan - Nested info cards */}
                <TitledGreyBox title={'Server Plan'}>
                    <div css={tw`space-y-3`}>
                        <InfoCard>
                            <InfoLabel>CPU</InfoLabel>
                            <InfoValue>{allocation.limits.cpu === 0 ? 'Unlimited' : `${allocation.limits.cpu}%`}</InfoValue>
                        </InfoCard>
                        <InfoCard>
                            <InfoLabel>Memory</InfoLabel>
                            <InfoValue>{allocation.limits.memory === 0 ? 'Unlimited' : `${(allocation.limits.memory / 1024).toFixed(1)} GB`}</InfoValue>
                        </InfoCard>
                        <InfoCard>
                            <InfoLabel>Disk</InfoLabel>
                            <InfoValue>{allocation.limits.disk === 0 ? 'Unlimited' : `${(allocation.limits.disk / 1024).toFixed(1)} GB`}</InfoValue>
                        </InfoCard>
                        <InfoCard>
                            <InfoLabel>Databases</InfoLabel>
                            <InfoValue>{allocation.limits.databases === 0 ? 'Unlimited' : allocation.limits.databases}</InfoValue>
                        </InfoCard>
                        <InfoCard>
                            <InfoLabel>Allocations</InfoLabel>
                            <InfoValue>{allocation.limits.allocations === 0 ? 'Unlimited' : allocation.limits.allocations}</InfoValue>
                        </InfoCard>
                        <InfoCard>
                            <InfoLabel>Backups</InfoLabel>
                            <InfoValue>{allocation.limits.backups === 0 ? 'Unlimited' : allocation.limits.backups}</InfoValue>
                        </InfoCard>
                    </div>
                </TitledGreyBox>

                {/* Right: Server List */}
                <TitledGreyBox title={'Servers'}>
                    <div css={tw`space-y-3 max-h-[400px] overflow-y-auto`}>
                        {servers.length === 0 ? (
                            <div css={tw`flex items-center justify-center h-full min-h-[300px]`}>
                                <p css={tw`text-neutral-400 text-sm`}>No servers created yet</p>
                            </div>
                        ) : (
                            servers.map((s) => (
                                <div key={s.id} css={tw`bg-neutral-700 rounded p-4`}>
                                    <div css={tw`flex items-start justify-between mb-3`}>
                                        <div css={tw`flex-1`}>
                                            <Link 
                                                to={`/server/${s.identifier}`} 
                                                css={tw`text-base font-semibold text-neutral-100 hover:text-cyan-400 transition-colors`}
                                            >
                                                {s.name}
                                            </Link>
                                            <p css={tw`text-xs text-neutral-400 mt-1`}>{s.address ?? s.identifier}</p>
                                        </div>
                                        <div css={tw`flex items-center gap-2`}>
                                            <Link to={`/server/${s.identifier}`}>
                                                <Button.Text css={tw`text-xs px-3 py-1`}>Manage</Button.Text>
                                            </Link>
                                            <Button.Danger
                                                css={tw`text-xs px-3 py-1`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteClick(s.name, s.uuid);
                                                }}
                                            >
                                                Delete
                                            </Button.Danger>
                                        </div>
                                    </div>
                                    
                                    {/* Server specs in nested cards */}
                                    <div css={tw`grid grid-cols-2 gap-2`}>
                                        <InfoCard css={tw`py-2`}>
                                            <InfoLabel>CPU</InfoLabel>
                                            <InfoValue>{s.cpu}%</InfoValue>
                                        </InfoCard>
                                        <InfoCard css={tw`py-2`}>
                                            <InfoLabel>Memory</InfoLabel>
                                            <InfoValue>{(s.memory / 1024).toFixed(1)} GB</InfoValue>
                                        </InfoCard>
                                        <InfoCard css={tw`py-2`}>
                                            <InfoLabel>Disk</InfoLabel>
                                            <InfoValue>{(s.disk / 1024).toFixed(1)} GB</InfoValue>
                                        </InfoCard>
                                        <InfoCard css={tw`py-2`}>
                                            <InfoLabel>Egg</InfoLabel>
                                            <InfoValue css={tw`text-xs`}>{s.egg}</InfoValue>
                                        </InfoCard>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TitledGreyBox>
            </div>

            {/* Bottom Row: Usage Stats */}
            <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6`}>
                <TitledGreyBox title={'CPU Usage'}>
                    <div css={tw`py-4`}>
                        <p css={tw`text-4xl font-bold text-cyan-400`}>{allocation.used.cpu}%</p>
                        <p css={tw`text-xs text-neutral-400 mt-2`}>
                            of {allocation.limits.cpu === 0 ? 'unlimited' : `${allocation.limits.cpu}%`}
                        </p>
                    </div>
                </TitledGreyBox>

                <TitledGreyBox title={'Memory Usage'}>
                    <div css={tw`py-4`}>
                        <p css={tw`text-4xl font-bold text-green-400`}>{(allocation.used.memory / 1024).toFixed(1)} GB</p>
                        <p css={tw`text-xs text-neutral-400 mt-2`}>
                            of {allocation.limits.memory === 0 ? 'unlimited' : `${(allocation.limits.memory / 1024).toFixed(1)} GB`}
                        </p>
                    </div>
                </TitledGreyBox>

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
                onModalDismissed={() => setDeleteModal({ visible: false, serverName: '', serverUuid: '' })}
            />

            {stats && (
                <CreateServerModal
                    visible={createModalVisible}
                    allocation={{
                        id: allocation.id,
                        name: allocation.name,
                        node: allocation.node,
                        cpu: allocation.limits.cpu,
                        memory: allocation.limits.memory,
                        disk: allocation.limits.disk,
                        database_limit: allocation.limits.databases,
                        allocation_limit: allocation.limits.allocations,
                        backup_limit: allocation.limits.backups,
                        port_range_start: null,
                        port_range_end: null,
                        used_resources: allocation.used,
                        available_resources: allocation.available,
                        allow_memory_overallocation: allocation.overallocation.memory,
                        allow_disk_overallocation: allocation.overallocation.disk,
                        servers_count: servers.length,
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
