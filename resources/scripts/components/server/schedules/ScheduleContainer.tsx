import React, { useEffect, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import { useHistory, useRouteMatch } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { httpErrorToHuman } from '@/api/http';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import getSchedulePresets, { SchedulePresetDto } from '@/api/server/schedules/getSchedulePresets';
import applySchedulePreset from '@/api/server/schedules/applySchedulePreset';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Button } from '@/components/elements/button/index';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Card from '@/witchyworlds/ui/Card';
import { ClockIcon } from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation('server/schedules');
    const match = useRouteMatch();
    const history = useHistory();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [presetVisible, setPresetVisible] = useState(false);
    const [presets, setPresets] = useState<SchedulePresetDto[]>([]);
    const [applying, setApplying] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes('schedules');
        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!presetVisible) return;
        getSchedulePresets(uuid)
            .then(setPresets)
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            });
    }, [presetVisible]);

    return (
        <ServerContentBlock title={t('title')}>
            <FlashMessageRender byKey={'schedules'} css={tw`mb-4`} />
            {!schedules.length && loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {schedules.length === 0 ? (
                        <Card>
                            <p css={tw`flex justify-center text-center text-sm text-gray-400`}>
                                <ClockIcon className='w-5 h-5 mr-1' />
                                {t('no-schedules')}
                            </p>
                        </Card>
                    ) : (
                        schedules.map((schedule) => (
                            <GreyRowBox
                                as={'a'}
                                key={schedule.id}
                                href={`${match.url}/${schedule.id}`}
                                css={tw`cursor-pointer mb-2 flex-wrap`}
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    history.push(`${match.url}/${schedule.id}`);
                                }}
                            >
                                <ScheduleRow schedule={schedule} />
                            </GreyRowBox>
                        ))
                    )}
                    <Can action={'schedule.create'}>
                        <div css={tw`mt-2 flex justify-end`}>
                            <EditScheduleModal visible={visible} onModalDismissed={() => setVisible(false)} />
                            <Button type={'button'} onClick={() => setVisible(true)}>
                                {t('create-schedule')}
                            </Button>
                            <Button.Text type={'button'} css={tw`ml-2`} onClick={() => setPresetVisible(true)}>
                                Use Preset
                            </Button.Text>
                        </div>
                    </Can>
                    {presetVisible && (
                        <div css={tw`fixed inset-0 flex items-center justify-center bg-black/50 z-50`}>
                            <div css={tw`bg-neutral-700 border border-neutral-600 rounded p-4 w-full max-w-2xl`}>
                                <h3 css={tw`text-lg text-neutral-100 mb-2`}>Apply Schedule Preset</h3>
                                <p css={tw`text-neutral-300 text-sm mb-3`}>Pick a preset to create a schedule with predefined tasks.</p>
                                <div css={tw`max-h-80 overflow-y-auto`}
                                >
                                    {presets.length === 0 ? (
                                        <p css={tw`text-neutral-400 text-sm`}>No presets available.</p>
                                    ) : (
                                        presets.map((p) => (
                                            <div key={p.id} css={tw`border border-neutral-600 rounded p-3 mb-2 bg-neutral-800`}>
                                                <div css={tw`flex items-center justify-between`}>
                                                    <div>
                                                        <p css={tw`text-neutral-100 font-medium`}>{p.name}</p>
                                                        {p.description && <p css={tw`text-neutral-300 text-sm`}>{p.description}</p>}
                                                    </div>
                                                    <Button
                                                        disabled={applying}
                                                        onClick={() => {
                                                            setApplying(true);
                                                            applySchedulePreset(uuid, p.id)
                                                                .then(() => getServerSchedules(uuid).then(setSchedules))
                                                                .then(() => setPresetVisible(false))
                                                                .catch((error) => addError({ key: 'schedules', message: httpErrorToHuman(error) }))
                                                                .finally(() => setApplying(false));
                                                        }}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                                {p.tasks && p.tasks.length > 0 && (
                                                    <div css={tw`mt-2 text-neutral-300 text-xs`}>
                                                        {p.tasks.length} task(s); cron: {p.cron.minute} {p.cron.hour} {p.cron.day_of_month} {p.cron.month} {p.cron.day_of_week}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div css={tw`text-right mt-3`}>
                                    <Button.Text onClick={() => setPresetVisible(false)}>Close</Button.Text>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};
