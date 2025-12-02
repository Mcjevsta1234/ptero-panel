import http from '@/api/http';

export default (uuid: string, modId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${uuid}/mods/${modId}`)
            .then(() => resolve())
            .catch(reject);
    });
};
