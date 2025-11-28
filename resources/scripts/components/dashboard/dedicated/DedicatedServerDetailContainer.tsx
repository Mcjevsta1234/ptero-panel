import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import tw from 'twin.macro';
import { getAllocationStats, getFormData, getEggDetails, createDedicatedServer } from '@/api/dedicated';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import useFlash from '@/plugins/useFlash';
import { Button } from '@/components/elements/button';
import { Link } from 'react-router-dom';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import Field2 from '@/components/elements/Field';
import { Nest, Egg } from '@/api/dedicated/types';

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

interface CreateServerFormValues {
    name: string;
    nest_id: number | null;
    egg_id: number | null;
    memory: number;
    disk: number;
    cpu: number;
    databases: number;
    allocations: number;
    backups: number;
}

export default ({ match }: RouteComponentProps<{ id: string }>) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AllocationStats | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [nests, setNests] = useState<Nest[]>([]);
    const [selectedNest, setSelectedNest] = useState<number | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
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

    useEffect(() => {
        if (showCreateForm && nests.length === 0) {
            setLoadingFormData(true);
            getFormData(allocationId)
                .then((data) => setNests(data.nests))
                .catch((error) => clearAndAddHttpError({ key: 'dedicated:detail', error }))
                .finally(() => setLoadingFormData(false));
        }
    }, [showCreateForm, allocationId]);

    const handleEggSelect = async (eggId: number) => {
        if (!eggId) {
            setSelectedEgg(null);
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

            {/* Create Server Section */}
            <div css={tw`mb-6`}>
                {!showCreateForm ? (
                    <Button onClick={() => setShowCreateForm(true)} css={tw`w-full`}>
                        + Create New Server
                    </Button>
                ) : (
                    <TitledGreyBox title={'Create New Server'}>
                        {loadingFormData ? (
                            <div css={tw`py-8`}>
                                <Spinner centered />
                            </div>
                        ) : (
                            <Formik<CreateServerFormValues>
                                initialValues={{
                                    name: '',
                                    nest_id: null,
                                    egg_id: null,
                                    memory: 512,
                                    disk: 1024,
                                    cpu: 50,
                                    databases: 0,
                                    allocations: 1,
                                    backups: 0,
                                }}
                                onSubmit={handleCreateServer}
                                validate={(values) => {
                                    const errors: Record<string, string> = {};
                                    if (!values.name) errors.name = 'Server name is required';
                                    if (!values.nest_id) errors.nest_id = 'Please select a nest';
                                    if (!values.egg_id) errors.egg_id = 'Please select an egg';
                                    if (values.memory < 128) errors.memory = 'Minimum 128 MB';
                                    if (values.disk < 512) errors.disk = 'Minimum 512 MB';
                                    if (values.cpu < 0) errors.cpu = 'CPU cannot be negative';
                                    
                                    // Check against available resources
                                    if (allocation.available.memory !== -1 && values.memory > allocation.available.memory) {
                                        errors.memory = `Only ${allocation.available.memory} MB available`;
                                    }
                                    if (allocation.available.disk !== -1 && values.disk > allocation.available.disk) {
                                        errors.disk = `Only ${allocation.available.disk} MB available`;
                                    }
                                    if (allocation.available.cpu !== -1 && values.cpu > allocation.available.cpu) {
                                        errors.cpu = `Only ${allocation.available.cpu}% available`;
                                    }
                                    
                                    return errors;
                                }}
                            >
                                {({ values, setFieldValue, isSubmitting, errors, touched }) => (
                                    <Form>
                                        <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4`}>
                                            <Field2
                                                name="name"
                                                label="Server Name"
                                                type="text"
                                                placeholder="My Awesome Server"
                                            />

                                            <div>
                                                <label css={tw`block text-sm font-medium mb-2`}>Nest</label>
                                                <select
                                                    value={values.nest_id || ''}
                                                    onChange={(e) => {
                                                        const nestId = parseInt(e.target.value);
                                                        setFieldValue('nest_id', nestId);
                                                        setFieldValue('egg_id', null);
                                                        setSelectedNest(nestId);
                                                        setSelectedEgg(null);
                                                    }}
                                                    css={tw`w-full px-3 py-2 border border-neutral-600 bg-neutral-700 rounded text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400`}
                                                >
                                                    <option value="">Select a nest...</option>
                                                    {nests.map((nest) => (
                                                        <option key={nest.id} value={nest.id}>
                                                            {nest.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {touched.nest_id && errors.nest_id && (
                                                    <p css={tw`text-red-400 text-xs mt-1`}>{errors.nest_id}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label css={tw`block text-sm font-medium mb-2`}>Egg (Software)</label>
                                                <select
                                                    value={values.egg_id || ''}
                                                    disabled={!selectedNest}
                                                    onChange={(e) => {
                                                        const eggId = parseInt(e.target.value);
                                                        setFieldValue('egg_id', eggId);
                                                        handleEggSelect(eggId);
                                                    }}
                                                    css={tw`w-full px-3 py-2 border border-neutral-600 bg-neutral-700 rounded text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50`}
                                                >
                                                    <option value="">Select software...</option>
                                                    {selectedNest &&
                                                        nests
                                                            .find((n) => n.id === selectedNest)
                                                            ?.eggs.map((egg) => (
                                                                <option key={egg.id} value={egg.id}>
                                                                    {egg.name}
                                                                </option>
                                                            ))}
                                                </select>
                                                {touched.egg_id && errors.egg_id && (
                                                    <p css={tw`text-red-400 text-xs mt-1`}>{errors.egg_id}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4`}>
                                            <div>
                                                <Field2
                                                    name="memory"
                                                    label={`Memory (MB) - Available: ${allocation.available.memory === -1 ? 'Unlimited' : allocation.available.memory}`}
                                                    type="number"
                                                />
                                            </div>
                                            <div>
                                                <Field2
                                                    name="disk"
                                                    label={`Disk (MB) - Available: ${allocation.available.disk === -1 ? 'Unlimited' : allocation.available.disk}`}
                                                    type="number"
                                                />
                                            </div>
                                            <div>
                                                <Field2
                                                    name="cpu"
                                                    label={`CPU (%) - Available: ${allocation.available.cpu === -1 ? 'Unlimited' : allocation.available.cpu}`}
                                                    type="number"
                                                />
                                            </div>
                                        </div>

                                        <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4`}>
                                            <Field2
                                                name="databases"
                                                label="Database Limit"
                                                type="number"
                                            />
                                            <Field2
                                                name="allocations"
                                                label="Allocation Limit"
                                                type="number"
                                            />
                                            <Field2
                                                name="backups"
                                                label="Backup Limit"
                                                type="number"
                                            />
                                        </div>

                                        {selectedEgg && (
                                            <div css={tw`mb-4 p-4 bg-neutral-700 rounded border border-neutral-600`}>
                                                <p css={tw`text-sm font-semibold mb-2`}>About {selectedEgg.name}</p>
                                                <p css={tw`text-xs text-neutral-400 mb-2`}>{selectedEgg.description}</p>
                                                <p css={tw`text-xs text-neutral-500`}>
                                                    Docker Image: <code css={tw`bg-neutral-800 px-1 rounded`}>{selectedEgg.docker_image}</code>
                                                </p>
                                            </div>
                                        )}

                                        <div css={tw`flex gap-2 justify-end`}>
                                            <Button.Text
                                                type="button"
                                                onClick={() => {
                                                    setShowCreateForm(false);
                                                    setSelectedNest(null);
                                                    setSelectedEgg(null);
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button.Text>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? 'Creating...' : 'Create Server'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        )}
                    </TitledGreyBox>
                )}
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
