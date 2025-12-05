import http from '@/api/http';

export interface ServerPropertiesData {
    [key: string]: string | number | boolean;
}

export default async (uuid: string): Promise<ServerPropertiesData> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/configs/server-properties`);
    return data;
};
