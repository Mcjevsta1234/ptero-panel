import React, { useCallback, useEffect, useMemo, useState } from 'react';
import tw from 'twin.macro';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import useFlash from '@/plugins/useFlash';
import { createDedicatedServer, getEggDetails, getFormData } from '@/api/dedicated';
import { AllocationPort, Egg, Nest } from '@/api/dedicated/types';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface ResourceTotals {
    cpu: number;
    memory: number;
    disk: number;
    databases: number;
    allocations: number;
    backups: number;
}

interface Props {
    allocationId: number;
    limits: ResourceTotals;
    used: ResourceTotals;
    onCreated: () => void;
}

interface FormValues {
    name: string;
    nest_id: number | '';
    egg_id: number | '';
    docker_image: string;
    cpu: number;
    memory: number;
    disk: number;
    databases: number;
    allocations: number;
    backups: number;
    allocation_port_id: number | '';
    environment: Record<string, string>;
}

type AvailableValue = number | 'Unlimited';

const computeAvailable = (limit: number, used: number): AvailableValue => {
    if (limit === 0) {
        return 'Unlimited';
    }

    return Math.max(limit - used, 0);
};

const formatAvailable = (value: AvailableValue, suffix = ''): string => {
    if (value === 'Unlimited') {
        return 'Unlimited';
    }

    return `${value}${suffix}`;
};

const defaultResourceValue = (limit: number, used: number, fallback: number): number => {
    if (limit === 0) {
        return fallback;
    }

    const remaining = limit - used;
    return remaining > 0 ? remaining : fallback;
};

const createValidationSchema = (portRequired: boolean) =>
    Yup.object().shape({
        name: Yup.string().required('A server name is required.'),
        nest_id: Yup.number().typeError('Select a category.').required('Select a category.'),
        egg_id: Yup.number().typeError('Select a game version.').required('Select a game version.'),
        cpu: Yup.number().required().min(1),
        memory: Yup.number().required().min(128),
        disk: Yup.number().required().min(512),
        databases: Yup.number().required().min(0),
        allocations: Yup.number().required().min(0),
        backups: Yup.number().required().min(0),
        docker_image: Yup.string().nullable(),
        allocation_port_id: Yup.mixed<number | ''>().test(
            'port-required',
            'Select a primary port.',
            (value) => !portRequired || typeof value === 'number'
        ),
    });

const CreateServerInlineForm: React.FC<Props> = ({ allocationId, limits, used, onCreated }) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    const [loading, setLoading] = useState(true);
    const [nests, setNests] = useState<Nest[]>([]);
    const [filteredEggs, setFilteredEggs] = useState<Nest['eggs']>([]);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [ports, setPorts] = useState<AllocationPort[]>([]);
    const [defaultPort, setDefaultPort] = useState<number | ''>('');

    const availableCpu = useMemo(() => computeAvailable(limits.cpu, used.cpu), [limits.cpu, used.cpu]);
    const availableMemory = useMemo(() => computeAvailable(limits.memory, used.memory), [limits.memory, used.memory]);
    const availableDisk = useMemo(() => computeAvailable(limits.disk, used.disk), [limits.disk, used.disk]);
    const availableDatabases = useMemo(() => computeAvailable(limits.databases, used.databases), [limits.databases, used.databases]);
    const availableAllocations = useMemo(() => computeAvailable(limits.allocations, used.allocations), [limits.allocations, used.allocations]);
    const availableBackups = useMemo(() => computeAvailable(limits.backups, used.backups), [limits.backups, used.backups]);

    const initialValues = useMemo<FormValues>(() => ({
        name: '',
        nest_id: '',
        egg_id: '',
        docker_image: '',
        cpu: defaultResourceValue(limits.cpu, used.cpu, 100),
        memory: defaultResourceValue(limits.memory, used.memory, 1024),
        disk: defaultResourceValue(limits.disk, used.disk, 10240),
        databases: 0,
        allocations: 0,
        backups: 0,
        allocation_port_id: defaultPort,
        environment: {},
    }), [defaultPort, limits, used]);

    const validationSchema = useMemo(() => createValidationSchema(ports.length > 0), [ports.length]);

    const loadFormOptions = useCallback((withSpinner = false) => {
        if (withSpinner) {
            setLoading(true);
        }

        clearFlashes('dedicated:create');
        getFormData(allocationId)
            .then(({ nests: nestData, ports: availablePorts }) => {
                setNests(nestData || []);
                setFilteredEggs([]);
                setSelectedEgg(null);
                setPorts(availablePorts || []);
                setDefaultPort(availablePorts && availablePorts.length > 0 ? availablePorts[0].id : '');
            })
            .catch((error) => clearAndAddHttpError({ key: 'dedicated:create', error }))
            .finally(() => {
                if (withSpinner) {
                    setLoading(false);
                }
            });
    }, [allocationId, clearAndAddHttpError, clearFlashes]);

    useEffect(() => {
        loadFormOptions(true);
    }, [loadFormOptions]);

    const handleNestChange = (rawValue: string, setFieldValue: FormikHelpers<FormValues>['setFieldValue']) => {
        const nextNestId = rawValue ? Number(rawValue) : '';
        setFieldValue('nest_id', nextNestId);
        setFieldValue('egg_id', '');
        setFieldValue('environment', {});
        setSelectedEgg(null);

        if (typeof nextNestId === 'number') {
            const nest = nests.find((n) => n.id === nextNestId);
            setFilteredEggs(nest ? nest.eggs : []);
        } else {
            setFilteredEggs([]);
        }
    };

    const handleEggChange = async (rawValue: string, setFieldValue: FormikHelpers<FormValues>['setFieldValue']) => {
        if (!rawValue) {
            setFieldValue('egg_id', '');
            setFieldValue('environment', {});
            setFieldValue('docker_image', '');
            setSelectedEgg(null);
            return;
        }

        const eggId = Number(rawValue);
        setFieldValue('egg_id', eggId);

        try {
            const eggDetails = await getEggDetails(eggId);
            setSelectedEgg(eggDetails);

            if (eggDetails.docker_images && Object.keys(eggDetails.docker_images).length > 0) {
                const firstImage = Object.values(eggDetails.docker_images)[0] as string;
                setFieldValue('docker_image', firstImage);
            }

            const envDefaults: Record<string, string> = {};
            eggDetails.variables.forEach((variable) => {
                envDefaults[variable.env_variable] = variable.default_value || '';
            });

            setFieldValue('environment', envDefaults);
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        }
    };

    const submit = async (values: FormValues, { setSubmitting, resetForm }: FormikHelpers<FormValues>) => {
        clearFlashes('dedicated:create');
        try {
            await createDedicatedServer({
                allocation_id: allocationId,
                name: values.name,
                egg_id: values.egg_id as number,
                docker_image: values.docker_image || undefined,
                cpu: values.cpu,
                memory: values.memory,
                disk: values.disk,
                databases: values.databases,
                allocations: values.allocations,
                backups: values.backups,
                swap: 1024,
                io: 500,
                allocation_port_id: typeof values.allocation_port_id === 'number' ? values.allocation_port_id : undefined,
            });

            addFlash({ key: 'dedicated:detail', type: 'success', message: 'Server created successfully.' });
            resetForm();
            setSelectedEgg(null);
            setFilteredEggs([]);
            loadFormOptions();
            onCreated();
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <TitledGreyBox title={'Create Server'}>
            {loading ? (
                <div css={tw`py-6`}>
                    <Spinner centered />
                </div>
            ) : (
                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={submit} enableReinitialize>
                    {({ isSubmitting, values, setFieldValue }) => {
                        const eggSelectDisabled = !values.nest_id;
                        const eggsForSelect = eggSelectDisabled ? [] : filteredEggs;
                        const portUnavailable = ports.length === 0;

                        return (
                            <Form>
                                <div css={tw`space-y-4`}>
                                    <div>
                                        <Label>Server Name</Label>
                                        <Field as={Input} name={'name'} />
                                    </div>

                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={values.nest_id === '' ? '' : String(values.nest_id)}
                                            onChange={(e) => handleNestChange(e.target.value, setFieldValue)}
                                        >
                                            <option value="">-- Select Category --</option>
                                            {nests.map((nest) => (
                                                <option key={nest.id} value={nest.id}>
                                                    {nest.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Game Version</Label>
                                        <Select
                                            value={values.egg_id === '' ? '' : String(values.egg_id)}
                                            disabled={eggSelectDisabled}
                                            onChange={(e) => handleEggChange(e.target.value, setFieldValue)}
                                        >
                                            <option value="">{eggSelectDisabled ? 'Select a category first' : '-- Select Game Version --'}</option>
                                            {eggsForSelect.map((egg) => (
                                                <option key={egg.id} value={egg.id}>
                                                    {egg.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Primary Port</Label>
                                        <Select
                                            value={values.allocation_port_id === '' ? '' : String(values.allocation_port_id)}
                                            disabled={portUnavailable}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFieldValue('allocation_port_id', val ? Number(val) : '');
                                            }}
                                        >
                                            {portUnavailable ? (
                                                <option value="">No ports available</option>
                                            ) : (
                                                ports.map((port) => (
                                                    <option key={port.id} value={port.id}>
                                                        {port.display}
                                                    </option>
                                                ))
                                            )}
                                        </Select>
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>
                                            {portUnavailable
                                                ? 'No free ports remain on this allocation.'
                                                : 'Only ports assigned to you on this node are shown.'}
                                        </p>
                                    </div>

                                    {selectedEgg && selectedEgg.docker_images && Object.keys(selectedEgg.docker_images).length > 0 && (
                                        <div>
                                            <Label>Docker Image</Label>
                                            <Select
                                                value={values.docker_image}
                                                onChange={(e) => setFieldValue('docker_image', e.target.value)}
                                            >
                                                {Object.entries(selectedEgg.docker_images).map(([label, image]) => (
                                                    <option key={image} value={image}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}

                                    <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                                        <div>
                                            <Label>CPU (%)</Label>
                                            <Field as={Input} type={'number'} name={'cpu'} min={1} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableCpu, '%')}
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Memory (MB)</Label>
                                            <Field as={Input} type={'number'} name={'memory'} min={128} step={128} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableMemory, ' MB')}
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Disk (MB)</Label>
                                            <Field as={Input} type={'number'} name={'disk'} min={512} step={512} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableDisk, ' MB')}
                                            </p>
                                        </div>
                                    </div>

                                    <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                                        <div>
                                            <Label>Databases</Label>
                                            <Field as={Input} type={'number'} name={'databases'} min={0} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableDatabases)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Allocations</Label>
                                            <Field as={Input} type={'number'} name={'allocations'} min={0} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableAllocations)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Backups</Label>
                                            <Field as={Input} type={'number'} name={'backups'} min={0} />
                                            <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                Available: {formatAvailable(availableBackups)}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedEgg && selectedEgg.variables && selectedEgg.variables.length > 0 && (
                                        <div css={tw`border-t border-neutral-700 pt-4 mt-4`}>
                                            <h3 css={tw`text-lg mb-3`}>Environment Configuration</h3>
                                            <div css={tw`space-y-3`}>
                                                {selectedEgg.variables
                                                    .filter((variable) => variable.user_viewable)
                                                    .map((variable) => (
                                                        <div key={variable.env_variable}>
                                                            <Label>{variable.name}</Label>
                                                            {variable.description && (
                                                                <p css={tw`text-xs text-neutral-400 mb-1`}>
                                                                    {variable.description}
                                                                </p>
                                                            )}
                                                            <Input
                                                                type={'text'}
                                                                value={values.environment[variable.env_variable] || ''}
                                                                onChange={(e) =>
                                                                    setFieldValue(
                                                                        `environment.${variable.env_variable}`,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                disabled={!variable.user_editable}
                                                            />
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <div css={tw`flex justify-end`}>
                                        <Button.Success type={'submit'} disabled={isSubmitting || portUnavailable}>
                                            Create Server
                                        </Button.Success>
                                    </div>
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            )}
        </TitledGreyBox>
    );
};

export default CreateServerInlineForm;
