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
    available: { cpu: number; memory: number; disk: number };
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
    environment: Record<string, string>;
}

const CreateServerInlineForm = ({ allocationId, available, onCreated }: Props) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [loading, setLoading] = useState(true);
    const [nests, setNests] = useState<any[]>([]);
    const [filteredEggs, setFilteredEggs] = useState<any[]>([]);
    const [selectedEgg, setSelectedEgg] = useState<any | null>(null);

    const initialValues: FormValues = {
        name: '',
        nest_id: '',
        egg_id: '',
        docker_image: '',
        cpu: Math.min(100, available.cpu * 100),
        memory: Math.min(1024, available.memory),
        disk: Math.min(5120, available.disk),
        environment: {},
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Server name is required').min(3).max(191),
        nest_id: Yup.number().required('Please select a server category'),
        egg_id: Yup.number().required('Please select server software'),
        cpu: Yup.number().required().min(1).max(available.cpu * 100),
        memory: Yup.number().required().min(128).max(available.memory),
        disk: Yup.number().required().min(512).max(available.disk),
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
                databases: 0,
                allocations: 1,
                backups: 0,
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

                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    <div>
                                        <Label>CPU (%)</Label>
                                        <Field as={Input} type={'number'} name={'cpu'} min={1} max={available.cpu * 100} />
                                    </div>
                                    <div>
                                        <Label>Memory (MB)</Label>
                                        <Field as={Input} type={'number'} name={'memory'} min={128} step={128} max={available.memory} />
                                    </div>
                                    <div>
                                        <Label>Disk (MB)</Label>
                                        <Field as={Input} type={'number'} name={'disk'} min={512} step={512} max={available.disk} />
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
