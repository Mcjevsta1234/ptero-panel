import http from '@/api/http';

export interface SchedulePresetTaskDto {
    sequence_id: number;
    action: string;
    payload: string | null;
    time_offset: number;
    continue_on_failure: boolean;
}

export interface SchedulePresetDto {
    id: number;
    name: string;
    description?: string | null;
    cron: {
        minute: string;
        hour: string;
        day_of_month: string;
        month: string;
        day_of_week: string;
    };
    only_when_online: boolean;
    tasks: SchedulePresetTaskDto[];
}

export default async (uuid: string): Promise<SchedulePresetDto[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/schedule-presets`);
    return data.data as SchedulePresetDto[];
};
