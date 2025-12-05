import http from '@/api/http';

export interface ConfigFile {
    name: string;
    path: string;
    type: 'yaml' | 'properties' | 'json' | 'toml';
    sections: ConfigSection[];
}

export interface ConfigSection {
    name: string;
    options: ConfigOption[];
}

export interface ConfigOption {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'list' | 'object';
    description?: string;
    path: string; // dot notation path for nested values
}

export default async (uuid: string): Promise<ConfigFile[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/configs`);
    return data.data || [];
};
