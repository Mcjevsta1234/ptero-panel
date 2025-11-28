import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import useFlash from '@/plugins/useFlash';
import { getFormData, getEggDetails, createDedicatedServer } from '@/api/dedicated';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface Props {
    allocationId: number;
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
        databases: number;
        allocations: number;
        backups: number;
    };
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
    environment: Record<string, string>;
}

const getAvailable = (limit: number, used: number): number | null => {
    if (limit === 0) return null;
    return Math.max(limit - used, 0);
};

const formatAvailable = (value: number | null, suffix = '') => (value === null ? 'Unlimited' : `${value}${suffix}`);

const clampInitial = (available: number | null, fallback: number) => {
    if (available === null) return fallback;
    if (available <= 0) return 0;
    return Math.min(fallback, available);
};

const CreateServerInlineForm = ({ allocationId, limits, used, onCreated }: Props) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [loading, setLoading] = useState(true);
    const [nests, setNests] = useState<any[]>([]);
    const [filteredEggs, setFilteredEggs] = useState<any[]>([]);
    const [selectedEgg, setSelectedEgg] = useState<any | null>(null);

    const availableCpu = getAvailable(limits.cpu, used.cpu);
    const availableMemory = getAvailable(limits.memory, used.memory);
    const availableDisk = getAvailable(limits.disk, used.disk);
    const availableDatabases = getAvailable(limits.databases, used.databases);
    const availableAllocations = getAvailable(limits.allocations, used.allocations);
    const availableBackups = getAvailable(limits.backups, used.backups);

    const initialValues: FormValues = {
        name: '',
        nest_id: '',
        egg_id: '',
        docker_image: '',
        cpu: clampInitial(availableCpu, 100),
        memory: clampInitial(availableMemory, 1024),
        disk: clampInitial(availableDisk, 5120),
        databases: clampInitial(availableDatabases, 0),
        allocations: clampInitial(availableAllocations, 1),
        backups: clampInitial(availableBackups, 0),
        environment: {},
    };

    const limitedNumber = (message: string, availableValue: number | null) =>
        availableValue === null
            ? Yup.number().required().min(0, 'Value must be positive')
            : Yup.number().required().min(0, 'Value must be positive').max(availableValue, message.replace('{max}', String(availableValue)));

    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Server name is required').min(3).max(191),
        nest_id: Yup.number().required('Please select a server category'),
        egg_id: Yup.number().required('Please select server software'),
        cpu: Yup.number()
            .required('CPU is required')
            .min(1, 'Minimum 1% CPU')
            .test('cpu-max', '', function (value) {
                if (availableCpu === null || typeof value !== 'number') return true;
                return value <= availableCpu || this.createError({ message: `Maximum ${availableCpu}% available` });
            }),
        memory: Yup.number()
            .required('Memory is required')
            .min(128, 'Minimum 128 MB')
            .test('memory-max', '', function (value) {
                if (availableMemory === null || typeof value !== 'number') return true;
                return value <= availableMemory || this.createError({ message: `Maximum ${availableMemory} MB available` });
            }),
        disk: Yup.number()
            .required('Disk is required')
            .min(512, 'Minimum 512 MB')
            .test('disk-max', '', function (value) {
                if (availableDisk === null || typeof value !== 'number') return true;
                return value <= availableDisk || this.createError({ message: `Maximum ${availableDisk} MB available` });
            }),
        databases: Yup.number()
            .required('Databases is required')
            .min(0, 'Cannot be negative')
            .test('db-max', '', function (value) {
                if (availableDatabases === null || typeof value !== 'number') return true;
                return value <= availableDatabases || this.createError({ message: `Maximum ${availableDatabases} available` });
            }),
        allocations: Yup.number()
            .required('Allocations is required')
            .min(0, 'Cannot be negative')
            .test('alloc-max', '', function (value) {
                if (availableAllocations === null || typeof value !== 'number') return true;
                return value <= availableAllocations || this.createError({ message: `Maximum ${availableAllocations} available` });
            }),
        backups: Yup.number()
            .required('Backups is required')
            .min(0, 'Cannot be negative')
            .test('backup-max', '', function (value) {
                if (availableBackups === null || typeof value !== 'number') return true;
                return value <= availableBackups || this.createError({ message: `Maximum ${availableBackups} available` });
            }),
    });

    useEffect(() => {
        setLoading(true);
        clearFlashes('dedicated:create');
        getFormData(allocationId)
            .then(({ nests }) => setNests(nests || []))
            .catch((error) => clearAndAddHttpError({ key: 'dedicated:create', error }))
            .finally(() => setLoading(false));
    }, [allocationId]);

    const handleNestChange = (nestId: number, setFieldValue: any) => {
        setFieldValue('nest_id', nestId);
        setFieldValue('egg_id', '');
        setSelectedEgg(null);
        const nest = nests.find((n) => n.id === nestId);
        setFilteredEggs(nest ? nest.eggs : []);
    };

    const handleEggChange = async (eggId: number, setFieldValue: any, values: FormValues) => {
        setFieldValue('egg_id', eggId);
        try {
            const eggDetails = await getEggDetails(eggId);
            setSelectedEgg(eggDetails);
            if (eggDetails.docker_images && Object.keys(eggDetails.docker_images).length > 0) {
                const firstImage = Object.values(eggDetails.docker_images)[0] as string;
                setFieldValue('docker_image', firstImage);
            }
            const envDefaults: Record<string, string> = {};
            eggDetails.variables.forEach((variable: any) => {
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
            });
            addFlash({ key: 'dedicated:detail', type: 'success', message: 'Server created successfully.' });
            resetForm();
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
                <div css={tw`py-6`}><Spinner centered /></div>
            ) : (
                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={submit}>
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div css={tw`space-y-4`}>
                                <div>
                                    <Label>Server Name</Label>
                                    <Field as={Input} name={'name'} />
                                </div>

                                <div>
                                    <Label>Server Category</Label>
                                    <Select
                                        value={values.nest_id}
                                        onChange={(e) => handleNestChange(Number(e.target.value), setFieldValue)}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {nests.map((nest) => (
                                            <option key={nest.id} value={nest.id}>{nest.name}</option>
                                        ))}
                                    </Select>
                                </div>

                                {filteredEggs.length > 0 && (
                                    <div>
                                        <Label>Server Software</Label>
                                        <Select
                                            value={values.egg_id}
                                            onChange={(e) => handleEggChange(Number(e.target.value), setFieldValue, values)}
                                        >
                                            <option value="">-- Select Software --</option>
                                            {filteredEggs.map((egg) => (
                                                <option key={egg.id} value={egg.id}>{egg.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {selectedEgg && selectedEgg.docker_images && Object.keys(selectedEgg.docker_images).length > 0 && (
                                    <div>
                                        <Label>Docker Image</Label>
                                        <Select
                                            value={values.docker_image}
                                            onChange={(e) => setFieldValue('docker_image', e.target.value)}
                                        >
                                            {Object.entries(selectedEgg.docker_images).map(([label, image]: any) => (
                                                <option key={image} value={image}>{label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                                    <div>
                                        <Label>CPU (%)</Label>
                                        <Field as={Input} type={'number'} name={'cpu'} min={1} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableCpu, '%')}</p>
                                    </div>
                                    <div>
                                        <Label>Memory (MB)</Label>
                                        <Field as={Input} type={'number'} name={'memory'} min={128} step={128} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableMemory, ' MB')}</p>
                                    </div>
                                    <div>
                                        <Label>Disk (MB)</Label>
                                        <Field as={Input} type={'number'} name={'disk'} min={512} step={512} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableDisk, ' MB')}</p>
                                    </div>
                                </div>

                                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                                    <div>
                                        <Label>Databases</Label>
                                        <Field as={Input} type={'number'} name={'databases'} min={0} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableDatabases)}</p>
                                    </div>
                                    <div>
                                        <Label>Allocations</Label>
                                        <Field as={Input} type={'number'} name={'allocations'} min={0} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableAllocations)}</p>
                                    </div>
                                    <div>
                                        <Label>Backups</Label>
                                        <Field as={Input} type={'number'} name={'backups'} min={0} />
                                        <p css={tw`text-xs text-neutral-500 mt-1`}>Available: {formatAvailable(availableBackups)}</p>
                                    </div>
                                </div>

                                {/* Environment variables */}
                                {selectedEgg && selectedEgg.variables && selectedEgg.variables.length > 0 && (
                                    <div css={tw`border-t border-neutral-700 pt-4 mt-4`}>
                                        <h3 css={tw`text-lg mb-3`}>Environment Configuration</h3>
                                        <div css={tw`space-y-3`}>
                                            {selectedEgg.variables.filter((v: any) => v.user_viewable).map((variable: any) => (
                                                <div key={variable.env_variable}>
                                                    <Label>{variable.name}</Label>
                                                    {variable.description && (
                                                        <p css={tw`text-xs text-neutral-400 mb-1`}>{variable.description}</p>
                                                    )}
                                                    <Input
                                                        type={'text'}
                                                        value={values.environment[variable.env_variable] || ''}
                                                        onChange={(e) => setFieldValue(`environment.${variable.env_variable}`, e.target.value)}
                                                        disabled={!variable.user_editable}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div css={tw`flex justify-end`}>
                                    <Button.Success type={'submit'} disabled={isSubmitting}>Create Server</Button.Success>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </TitledGreyBox>
    );
};

export default CreateServerInlineForm;
