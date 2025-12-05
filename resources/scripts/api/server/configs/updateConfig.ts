import http from '@/api/http';

export interface ConfigUpdate {
    path: string;
    key: string;
    value: any;
}

export default async (uuid: string, filePath: string, updates: ConfigUpdate[]): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/configs/update`, {
        file: filePath,
        updates,
    });
};
