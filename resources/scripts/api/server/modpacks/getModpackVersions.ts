import http from '@/api/http';

export interface ModpackVersion {
    id: string;
    name: string;
    gameVersions: string[];
    fileDate: string;
}

export default (uuid: string, modpackId: string): Promise<ModpackVersion[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/modpacks/versions`, {
            params: {
                modpack_id: modpackId,
            },
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
