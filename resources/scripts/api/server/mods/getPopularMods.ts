import http from '@/api/http';

export default (uuid: string, type: string, source: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mods/popular`, {
            params: { type, source },
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
