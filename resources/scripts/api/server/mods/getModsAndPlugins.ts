import http from '@/api/http';

export default (uuid: string, type?: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mods`, {
            params: { type },
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
