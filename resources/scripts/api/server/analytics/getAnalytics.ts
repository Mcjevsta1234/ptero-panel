import http from '@/api/http';

export interface ServerAnalytics {
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    network_rx: number;
    network_tx: number;
}

export default (uuid: string, period: string): Promise<ServerAnalytics[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/analytics`, {
            params: { period },
        })
            .then(({ data }) => resolve(data.data || []))
            .catch(reject);
    });
};
