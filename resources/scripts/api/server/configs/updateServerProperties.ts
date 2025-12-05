import http from '@/api/http';
import { ServerPropertiesData } from './getServerProperties';

export default async (uuid: string, properties: ServerPropertiesData): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/configs/server-properties`, { properties });
};
