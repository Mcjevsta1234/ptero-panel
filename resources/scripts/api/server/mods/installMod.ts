import http from '@/api/http';

export default (
    uuid: string,
    modId: number,
    fileId: number,
    type: string,
    source: string
): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/mods`, {
            mod_id: modId,
            file_id: fileId,
            type,
            source,
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
