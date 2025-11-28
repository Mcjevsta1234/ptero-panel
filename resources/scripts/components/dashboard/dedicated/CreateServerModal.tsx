import React, { useState, useEffect } from 'react';
import Modal from '@/components/elements/Modal';
import tw from 'twin.macro';
import { DedicatedAllocation, Egg, CreateServerRequest } from '@/api/dedicated/types';
import { getFormData, getEggDetails, createDedicatedServer } from '@/api/dedicated';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import { Button } from '@/components/elements/button';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { useHistory } from 'react-router-dom';

interface Props {
    visible: boolean;
    allocation: DedicatedAllocation;
    onDismissed: () => void;
}

interface FormValues {
    name: string;
    nest_id: number | '';
    egg_id: number | '';
    cpu: number;
    memory: number;
    disk: number;
    port: number;
    environment: Record<string, string>;
}

export default ({ visible, allocation, onDismissed }: Props) => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [nests, setNests] = useState<any[]>([]);
    const [eggs, setEggs] = useState<any[]>([]);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [filteredEggs, setFilteredEggs] = useState<any[]>([]);

    const initialValues: FormValues = {
        name: '',
        nest_id: '',
        egg_id: '',
        cpu: Math.min(100, allocation.available_resources.cpu * 100),
        memory: Math.min(1024, allocation.available_resources.memory),
        disk: Math.min(5120, allocation.available_resources.disk),
        port: allocation.port_range_start ?? 0,
        environment: {},
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Server name is required').min(3).max(191),
        nest_id: Yup.number().required('Please select a server category'),
        egg_id: Yup.number().required('Please select server software'),
        cpu: Yup.number()
            .required()
            .min(1, 'Minimum 1% CPU')
            .max(allocation.available_resources.cpu * 100, `Maximum ${allocation.available_resources.cpu * 100}% available`),
        memory: Yup.number()
            .required()
            .min(128, 'Minimum 128 MB')
            .max(allocation.available_resources.memory, `Maximum ${allocation.available_resources.memory} MB available`),
        disk: Yup.number()
            .required()
            .min(512, 'Minimum 512 MB')
            .max(allocation.available_resources.disk, `Maximum ${allocation.available_resources.disk} MB available`),
        port: Yup.number()
            .required()
            .test('port-range', 'Port must be within allowed range', (value) => {
                if (allocation.port_range_start == null || allocation.port_range_end == null) return true;
                if (typeof value !== 'number') return false;
                return value >= allocation.port_range_start && value <= allocation.port_range_end;
            }),
    });

    useEffect(() => {
        if (visible) {
            setLoading(true);
            clearFlashes('dedicated:create');
            getFormData(allocation.id)
                .then(({ nests: nestsData }) => {
                    setNests(nestsData);
                    // Flatten eggs from all nests
                    const allEggs = nestsData.reduce((acc: any[], nest) => {
                        const eggsWithNest = nest.eggs.map((egg) => ({ ...egg, nest_name: nest.name }));
                        return acc.concat(eggsWithNest);
                    }, []);
                    setEggs(allEggs);
                })
                .catch((error) => clearAndAddHttpError({ key: 'dedicated:create', error }))
                .finally(() => setLoading(false));
        }
    }, [visible, allocation.id]);

    const handleNestChange = (nestId: number, setFieldValue: any) => {
        setFieldValue('nest_id', nestId);
        setFieldValue('egg_id', '');
        setSelectedEgg(null);
        const nest = nests.find(n => n.id === nestId);
        setFilteredEggs(nest ? nest.eggs : []);
    };

    const handleEggChange = async (eggId: number, setFieldValue: any, values: FormValues) => {
        setFieldValue('egg_id', eggId);
        try {
            const eggDetails = await getEggDetails(eggId);
            setSelectedEgg(eggDetails);
            
            // Initialize environment with default values
            const envDefaults: Record<string, string> = {};
            eggDetails.variables.forEach((variable) => {
                envDefaults[variable.env_variable] = variable.default_value || '';
            });
            setFieldValue('environment', envDefaults);
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        }
    };

    const submit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
        clearFlashes('dedicated:create');
        
        const request: CreateServerRequest = {
            allocation_id: allocation.id,
            name: values.name,
            egg_id: values.egg_id as number,
            cpu: values.cpu,
            memory: values.memory,
            disk: values.disk,
            databases: 0,
            allocations: 1,
            backups: 0,
        };

        try {
            await createDedicatedServer(request);
            onDismissed();
            history.push('/');
        } catch (error) {
            clearAndAddHttpError({ key: 'dedicated:create', error });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={submit}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Modal
                    visible={visible}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    onDismissed={onDismissed}
                >
                    <Form>
                        <h2 css={tw`text-2xl mb-6`}>Create Server</h2>
                        {loading ? (
                            <div css={tw`py-8`}>
                                <Spinner centered />
                            </div>
                        ) : (
                            <div css={tw`space-y-4`}>
                                {/* Server Name */}
                                <FormikFieldWrapper name={'name'} label={'Server Name'}>
                                    <Field as={Input} name={'name'} />
                                </FormikFieldWrapper>

                                {/* Server Software Category */}
                                <div>
                                    <Label>Server Category</Label>
                                    <Select
                                        value={values.nest_id}
                                        onChange={(e) => handleNestChange(Number(e.target.value), setFieldValue)}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {nests.map((nest) => (
                                            <option key={nest.id} value={nest.id}>
                                                {nest.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Server Software Selection */}
                                {filteredEggs.length > 0 && (
                                    <div>
                                        <Label>Server Software</Label>
                                        <Select
                                            value={values.egg_id}
                                            onChange={(e) => handleEggChange(Number(e.target.value), setFieldValue, values)}
                                        >
                                            <option value="">-- Select Software --</option>
                                            {filteredEggs.map((egg) => (
                                                <option key={egg.id} value={egg.id}>
                                                    {egg.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {/* Resource Allocation */}
                                <div css={tw`grid grid-cols-2 gap-4`}>
                                    <FormikFieldWrapper name={'cpu'} label={'CPU (%)'}>
                                        <Field as={Input} type={'number'} name={'cpu'} min={1} max={allocation.available_resources.cpu * 100} />
                                    </FormikFieldWrapper>
                                    <FormikFieldWrapper name={'memory'} label={'Memory (MB)'}>
                                        <Field as={Input} type={'number'} name={'memory'} min={128} step={128} max={allocation.available_resources.memory} />
                                    </FormikFieldWrapper>
                                </div>

                                <div css={tw`grid grid-cols-2 gap-4`}>
                                    <FormikFieldWrapper name={'disk'} label={'Disk (MB)'}>
                                        <Field as={Input} type={'number'} name={'disk'} min={512} step={512} max={allocation.available_resources.disk} />
                                    </FormikFieldWrapper>
                                    <FormikFieldWrapper name={'port'} label={'Port'}>
                                        <Field as={Input} type={'number'} name={'port'} min={allocation.port_range_start} max={allocation.port_range_end} />
                                    </FormikFieldWrapper>
                                </div>

                                {/* Environment Variables */}
                                {selectedEgg && selectedEgg.variables.length > 0 && (
                                    <div css={tw`border-t border-neutral-700 pt-4 mt-4`}>
                                        <h3 css={tw`text-lg mb-3`}>Environment Configuration</h3>
                                        <div css={tw`space-y-3`}>
                                            {selectedEgg.variables
                                                .filter((v) => v.user_viewable)
                                                .map((variable) => (
                                                    <div key={variable.env_variable}>
                                                        <Label>{variable.name}</Label>
                                                        {variable.description && (
                                                            <p css={tw`text-xs text-neutral-400 mb-1`}>{variable.description}</p>
                                                        )}
                                                        <Input
                                                            type={'text'}
                                                            value={values.environment[variable.env_variable] || ''}
                                                            onChange={(e) =>
                                                                setFieldValue(`environment.${variable.env_variable}`, e.target.value)
                                                            }
                                                            disabled={!variable.user_editable}
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div css={tw`flex justify-end space-x-4 mt-6`}>
                                    <Button.Text onClick={onDismissed} disabled={isSubmitting}>
                                        Cancel
                                    </Button.Text>
                                    <Button.Success type={'submit'} disabled={isSubmitting}>
                                        Create Server
                                    </Button.Success>
                                </div>
                            </div>
                        )}
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};
