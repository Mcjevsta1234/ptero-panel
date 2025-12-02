import http from '@/api/http';

export default (
    uuid: string,
    query: string,
    type: string,
    source: string
): Promise<{ data: any[]; source: string }> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mods/search`, {
            params: { query, type, source },
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
