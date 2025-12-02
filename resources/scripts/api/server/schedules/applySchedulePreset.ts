import http from '@/api/http';

export default async (uuid: string, presetId: number, name?: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/schedule-presets/apply`, {
        preset_id: presetId,
        name,
    });
};
