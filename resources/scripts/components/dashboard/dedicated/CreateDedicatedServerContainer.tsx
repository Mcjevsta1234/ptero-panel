import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import useFlash from '@/plugins/useFlash';
import { createDedicatedServer, getEggDetails, getFormData, getAllocationStats } from '@/api/dedicated';
import { AllocationPort, Egg, Nest } from '@/api/dedicated/types';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button';
import PageContentBlock from '@/components/elements/PageContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import FlashMessageRender from '@/components/FlashMessageRender';

interface ResourceTotals {
    cpu: number;
    memory: number;
    disk: number;
    databases: number;
    allocations: number;
    backups: number;
}

interface AllocationData {
    id: number;
    name: string;
    limits: ResourceTotals;
    used: ResourceTotals;
}

interface FormValues {
    name: string;
    description: string;
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
    startup: string;
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
    return remaining > 0 ? Math.min(remaining, fallback) : fallback;
};

const createValidationSchema = (portRequired: boolean, selectedEgg: Egg | null) => {
    const schema: any = {
        name: Yup.string().required('A server name is required.'),
        description: Yup.string().max(191),
        nest_id: Yup.number().typeError('Select a category.').required('Select a category.'),
        egg_id: Yup.number().typeError('Select a version.').required('Select a version.'),
        cpu: Yup.number().required().min(1, 'Minimum 1 core'),
        memory: Yup.number().required().min(1, 'Minimum 1 GB'),
        disk: Yup.number().required().min(1, 'Minimum 1 GB'),
        databases: Yup.number().required().min(0),
        allocations: Yup.number().required().min(1),
        backups: Yup.number().required().min(0),
        docker_image: Yup.string().nullable(),
        startup: Yup.string().required('Startup command is required.'),
        allocation_port_id: Yup.mixed<number | ''>().test(
            'port-required',
            'Select a primary port.',
            (value) => !portRequired || typeof value === 'number'
        ),
    };

    // Add validation for egg variables - must be nested under environment object
    if (selectedEgg && selectedEgg.variables) {
        const envSchema: any = {};
        
        selectedEgg.variables.forEach((variable) => {
            if (variable.user_editable) {
                const rules = variable.rules.split('|');
                let validator = Yup.string();

                rules.forEach((rule) => {
                    if (rule === 'required') {
                        validator = validator.required(`${variable.name} is required.`);
                    }
                    if (rule.startsWith('max:')) {
                        const max = parseInt(rule.split(':')[1]);
                        validator = validator.max(max, `${variable.name} must be at most ${max} characters.`);
                    }
                    if (rule.startsWith('min:')) {
                        const min = parseInt(rule.split(':')[1]);
                        validator = validator.min(min, `${variable.name} must be at least ${min} characters.`);
                    }
                });

                envSchema[variable.env_variable] = validator;
            }
        });

        schema.environment = Yup.object().shape(envSchema);
    }

    return Yup.object().shape(schema);
};

export default function CreateDedicatedServerContainer() {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { id } = useParams<{ id: string }>();
    const allocationId = parseInt(id as string, 10);
    const history = useHistory();

    const [loading, setLoading] = useState(true);
    const [allocation, setAllocation] = useState<AllocationData | null>(null);
    const [nests, setNests] = useState<Nest[]>([]);
    const [filteredEggs, setFilteredEggs] = useState<Nest['eggs']>([]);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [ports, setPorts] = useState<AllocationPort[]>([]);
    const [defaultPort, setDefaultPort] = useState<number | ''>('');

    const availableCpu = useMemo(() => allocation ? computeAvailable(allocation.limits.cpu, allocation.used.cpu) : 0, [allocation]);
    const availableMemory = useMemo(() => allocation ? computeAvailable(allocation.limits.memory, allocation.used.memory) : 0, [allocation]);
    const availableDisk = useMemo(() => allocation ? computeAvailable(allocation.limits.disk, allocation.used.disk) : 0, [allocation]);
    const availableDatabases = useMemo(() => allocation ? computeAvailable(allocation.limits.databases, allocation.used.databases) : 0, [allocation]);
    const availableAllocations = useMemo(() => allocation ? computeAvailable(allocation.limits.allocations, allocation.used.allocations) : 0, [allocation]);
    const availableBackups = useMemo(() => allocation ? computeAvailable(allocation.limits.backups, allocation.used.backups) : 0, [allocation]);

    const initialValues = useMemo<FormValues>(() => ({
        name: '',
        description: '',
        nest_id: '',
        egg_id: '',
        docker_image: '',
        cpu: allocation ? Math.max(1, Math.floor(defaultResourceValue(allocation.limits.cpu, allocation.used.cpu, 100) / 100)) : 1,
        memory: allocation ? Math.max(1, Math.floor(defaultResourceValue(allocation.limits.memory, allocation.used.memory, 1024) / 1024)) : 1,
        disk: allocation ? Math.max(10, Math.floor(defaultResourceValue(allocation.limits.disk, allocation.used.disk, 10240) / 1024)) : 10,
        databases: 0,
        allocations: 1,
        backups: 0,
        allocation_port_id: defaultPort,
        startup: '',
        environment: {},
    }), [defaultPort, allocation]);

    const validationSchema = useMemo(() => createValidationSchema(ports.length > 0, selectedEgg), [ports.length, selectedEgg]);

    const loadData = useCallback(async () => {
        setLoading(true);
        clearFlashes('dedicated:create');
        
        try {
            const [statsData, formData] = await Promise.all([
                getAllocationStats(allocationId),
                getFormData(allocationId)
            ]);

            setAllocation({
                id: statsData.allocation.id,
                name: statsData.allocation.name,
                limits: statsData.allocation.limits,
                used: statsData.allocation.used,
            });
            setNests(formData.nests || []);
            setPorts(formData.ports || []);
            setDefaultPort(formData.ports && formData.ports.length > 0 ? formData.ports[0].id : '');
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        } finally {
            setLoading(false);
        }
    }, [allocationId, clearAndAddHttpError, clearFlashes]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNestChange = (rawValue: string, setFieldValue: FormikHelpers<FormValues>['setFieldValue']) => {
        const nextNestId = rawValue ? Number(rawValue) : '';
        setFieldValue('nest_id', nextNestId);
        setFieldValue('egg_id', '');
        setFieldValue('environment', {});
        setFieldValue('startup', '');
        setSelectedEgg(null);

        if (typeof nextNestId === 'number') {
            const nest = nests.find((n) => n.id === nextNestId);
            setFilteredEggs(nest ? nest.eggs : []);
        } else {
            setFilteredEggs([]);
        }
    };

    const handleEggChange = async (
        rawValue: string,
        setFieldValue: FormikHelpers<FormValues>['setFieldValue'],
        validateForm: () => Promise<any>,
        setSubmitting: (isSubmitting: boolean) => void,
        setErrors: (errors: any) => void
    ) => {
        if (!rawValue) {
            setFieldValue('egg_id', '');
            setFieldValue('environment', {});
            setFieldValue('docker_image', '');
            setFieldValue('startup', '');
            setSelectedEgg(null);
            setErrors({});
            return;
        }

        const eggId = Number(rawValue);
        setFieldValue('egg_id', eggId);

        try {
            const eggDetails = await getEggDetails(eggId);
            console.log('Egg details loaded:', eggDetails);
            console.log('Egg variables:', eggDetails.variables);
            setSelectedEgg(eggDetails);

            // Set default docker image
            if (eggDetails.docker_images && Object.keys(eggDetails.docker_images).length > 0) {
                const firstImage = Object.values(eggDetails.docker_images)[0] as string;
                setFieldValue('docker_image', firstImage);
            }

            // Set startup command
            setFieldValue('startup', eggDetails.startup || '');

            // Set default environment variables - set each field individually & validate
            eggDetails.variables.forEach((variable) => {
                console.log(`Setting ${variable.env_variable} = ${variable.default_value}`);
                setFieldValue(`environment.${variable.env_variable}`, variable.default_value || '');
            });

            // Clear previous environment errors & revalidate form
            setErrors((prev: any) => {
                const cleaned: any = { ...prev };
                Object.keys(cleaned).forEach((k) => {
                    if (k.startsWith('environment.') || k === 'environment') delete cleaned[k];
                });
                return cleaned;
            });
            await validateForm();
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        }
    };

    const submit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
        console.log('Submit called with values:', values);
        clearFlashes('dedicated:create');
        try {
            console.log('Sending create request...');
            await createDedicatedServer({
                allocation_id: allocationId,
                name: values.name,
                description: values.description,
                egg_id: values.egg_id as number,
                docker_image: values.docker_image || undefined,
                cpu: values.cpu * 100, // Convert cores to %
                memory: values.memory * 1024, // Convert GB to MB
                disk: values.disk * 1024, // Convert GB to MB
                databases: values.databases,
                allocations: values.allocations,
                backups: values.backups,
                swap: 1024,
                io: 500,
                allocation_port_id: typeof values.allocation_port_id === 'number' ? values.allocation_port_id : undefined,
                startup: values.startup,
                environment: values.environment,
            });

            console.log('Server created successfully');
            addFlash({ key: 'dedicated:create', type: 'success', message: 'Server created successfully.' });
            history.push(`/account/dedicated/${allocationId}`);
        } catch (error) {
            console.error('Create server error:', error);
            clearAndAddHttpError({ key: 'dedicated:create', error });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !allocation) {
        return (
            <PageContentBlock title={'Create Server'}>
                <div css={tw`py-12`}>
                    <Spinner size={'large'} centered />
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={`Create Server - ${allocation.name}`}>
            <FlashMessageRender byKey={'dedicated:create'} css={tw`mb-4`} />
            
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={submit} enableReinitialize>
                {({ isSubmitting, values, setFieldValue, errors, submitForm, isValid, validateForm, setSubmitting, setErrors }) => {
                    const eggSelectDisabled = !values.nest_id;
                    const eggsForSelect = eggSelectDisabled ? [] : filteredEggs;
                    const portUnavailable = ports.length === 0;

                    console.log('Formik render - isValid:', isValid, 'isSubmitting:', isSubmitting, 'errors:', errors);

                    return (
                        <Form>
                            <div css={tw`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                                {/* Left Column - Basic Settings */}
                                <div css={tw`lg:col-span-2 space-y-6`}>
                                    <TitledGreyBox title={'Basic Information'}>
                                        <div css={tw`space-y-4`}>
                                            <div>
                                                <Label>Server Name</Label>
                                                <Field as={Input} name={'name'} />
                                            </div>

                                            <div>
                                                <Label>Description (Optional)</Label>
                                                <Field as={Input} name={'description'} />
                                            </div>
                                        </div>
                                    </TitledGreyBox>

                                    <TitledGreyBox title={'Game Selection'}>
                                        <div css={tw`space-y-4`}>
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
                                                <Label>Version</Label>
                                                <Select
                                                    value={values.egg_id === '' ? '' : String(values.egg_id)}
                                                    disabled={eggSelectDisabled}
                                                    onChange={(e) => handleEggChange(e.target.value, setFieldValue, validateForm, setSubmitting, setErrors)}
                                                >
                                                    <option value="">{eggSelectDisabled ? 'Select a category first' : '-- Select Version --'}</option>
                                                    {eggsForSelect.map((egg) => (
                                                        <option key={egg.id} value={egg.id}>
                                                            {egg.name}
                                                        </option>
                                                    ))}
                                                </Select>
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
                                        </div>
                                    </TitledGreyBox>

                                    {selectedEgg && (
                                        <>
                                            <TitledGreyBox title={'Startup Configuration'}>
                                                <div>
                                                    <Label>Startup Command</Label>
                                                    <Field as={Input} name={'startup'} />
                                                    <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                        Edit the command used to start your server. Variables are replaced automatically.
                                                    </p>
                                                </div>
                                            </TitledGreyBox>

                                            {selectedEgg.variables && selectedEgg.variables.filter((v) => v.user_viewable).length > 0 && (
                                                <TitledGreyBox title={'Environment Variables'}>
                                                    <div css={tw`space-y-4`}>
                                                        {selectedEgg.variables
                                                            .filter((variable) => variable.user_viewable)
                                                            .map((variable) => (
                                                                <div key={variable.env_variable}>
                                                                    <Label>
                                                                        {variable.name}
                                                                        {variable.rules.includes('required') && <span css={tw`text-red-400 ml-1`}>*</span>}
                                                                    </Label>
                                                                    {variable.description && (
                                                                        <p css={tw`text-xs text-neutral-400 mb-2`}>
                                                                            {variable.description}
                                                                        </p>
                                                                    )}
                                                                    <Field
                                                                        as={Input}
                                                                        type={'text'}
                                                                        name={`environment.${variable.env_variable}`}
                                                                        disabled={!variable.user_editable}
                                                                    />
                                                                    {errors.environment && (errors.environment as any)[variable.env_variable] && (
                                                                        <p css={tw`text-xs text-red-400 mt-1`}>
                                                                            {(errors.environment as any)[variable.env_variable]}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </TitledGreyBox>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Right Column - Resource Allocation */}
                                <div>
                                    <TitledGreyBox title={'Resource Allocation'}>
                                        <div css={tw`space-y-4`}>
                                            <div>
                                                <Label>CPU (Cores)</Label>
                                                <Field as={Input} type={'number'} name={'cpu'} min={1} step={1} />
                                                <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                    Available: {availableCpu === 'Unlimited' ? 'Unlimited' : `${Math.floor((availableCpu as number) / 100)} cores`}
                                                </p>
                                            </div>
                                            <div>
                                                <Label>Memory (GB)</Label>
                                                <Field as={Input} type={'number'} name={'memory'} min={1} step={1} />
                                                <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                    Available: {availableMemory === 'Unlimited' ? 'Unlimited' : `${Math.floor((availableMemory as number) / 1024)} GB`}
                                                </p>
                                            </div>
                                            <div>
                                                <Label>Disk (GB)</Label>
                                                <Field as={Input} type={'number'} name={'disk'} min={1} step={1} />
                                                <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                    Available: {availableDisk === 'Unlimited' ? 'Unlimited' : `${Math.floor((availableDisk as number) / 1024)} GB`}
                                                </p>
                                            </div>
                                            <div>
                                                <Label>Databases</Label>
                                                <Field as={Input} type={'number'} name={'databases'} min={0} />
                                                <p css={tw`text-xs text-neutral-500 mt-1`}>
                                                    Available: {formatAvailable(availableDatabases)}
                                                </p>
                                            </div>
                                            <div>
                                                <Label>Allocations</Label>
                                                <Field as={Input} type={'number'} name={'allocations'} min={1} />
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
                                    </TitledGreyBox>

                                    <div css={tw`mt-6 flex gap-3`}>
                                        <Button.Text onClick={() => history.push(`/account/dedicated/${allocationId}`)} css={tw`flex-1`}>
                                            Cancel
                                        </Button.Text>
                                        <Button.Success 
                                            type={'button'} 
                                            disabled={isSubmitting} 
                                            onClick={() => {
                                                    console.log('Create button clicked');
                                                console.log('Current form values:', values);
                                                console.log('Environment object:', values.environment);
                                                console.log('Current form errors:', errors);
                                                console.log('Is form valid:', isValid);
                                                submitForm();
                                            }} 
                                            css={tw`flex-1`}
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Server'}
                                        </Button.Success>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </PageContentBlock>
    );
}
