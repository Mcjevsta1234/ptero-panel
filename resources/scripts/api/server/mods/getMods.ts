import http from '@/api/http';

export interface Mod {
    id: string;
    name: string;
    description: string;
    icon: string | null;
    url: string | null;
    downloadCount: number;
}

export interface ModVersion {
    id: string;
    name: string;
    fileName: string;
    releaseType: string;
    fileLength: number;
    downloadUrl: string | null;
    gameVersions: string[];
}

export interface ModsResponse {
    data: Mod[];
    meta: {
        pagination: {
            total: number;
            count: number;
            per_page: number;
            current_page: number;
            total_pages: number;
        };
    };
}

export interface ModVersionsResponse {
    data: ModVersion[];
}

export const searchMods = (
    uuid: string,
    searchQuery: string,
    pageSize: number,
    page: number
): Promise<ModsResponse> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mods`, {
            params: {
                search_query: searchQuery,
                page_size: pageSize,
                page,
            },
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};

export const getModVersions = (uuid: string, modId: string): Promise<ModVersionsResponse> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mods/${modId}/versions`)
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};

export const downloadMod = (
    uuid: string,
    modId: string,
    fileId: string
): Promise<{ object: string; attributes: { completed_at: null } }> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/mods/download`, {
            mod_id: modId,
            file_id: fileId,
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
