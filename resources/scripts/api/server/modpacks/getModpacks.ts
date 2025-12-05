import http from '@/api/http';

export interface Modpack {
    id: string;
    name: string;
    description: string;
    iconUrl: string | null;
    url: string | null;
    downloadCount: number;
}

export interface ModpacksResponse {
    data: Modpack[];
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

export default (uuid: string, searchQuery: string, pageSize: number, page: number): Promise<ModpacksResponse> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/modpacks`, {
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
