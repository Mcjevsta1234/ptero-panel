import http from '@/api/http';

export default (
    uuid: string,
    modpackId: string,
    modpackVersionId: string,
    deleteServerFiles: boolean,
    minecraftVersion?: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/modpacks/install`, {
            modpack_id: modpackId,
            modpack_version_id: modpackVersionId,
            delete_server_files: deleteServerFiles,
            minecraft_version: minecraftVersion,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
