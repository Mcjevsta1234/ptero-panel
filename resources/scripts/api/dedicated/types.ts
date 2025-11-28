export interface DedicatedAllocation {
    id: number;
    name: string | null;
    user_id: number;
    node_id: number;
    node: {
        id: number;
        name: string;
    };
    cpu: number;
    memory: number;
    disk: number;
    swap: number;
    io: number;
    backup_limit: number;
    allocation_limit: number;
    database_limit: number;
    port_range_start: number | null;
    port_range_end: number | null;
    allow_memory_overallocation: boolean;
    allow_disk_overallocation: boolean;
    allowed_nests: number[] | null;
    allowed_eggs: number[] | null;
    active: boolean;
    servers_count: number;
    servers: Array<{
        id: number;
        uuid: string;
        name: string;
        identifier: string;
    }>;
    used_resources: {
        cpu: number;
        memory: number;
        disk: number;
        databases: number;
        allocations: number;
        backups: number;
        server_count: number;
    };
    available_resources: {
        cpu: number;
        memory: number;
        disk: number;
        databases: number;
        allocations: number;
        backups: number;
    };
}

export interface Nest {
    id: number;
    name: string;
    description: string | null;
    eggs: Array<{
        id: number;
        name: string;
        description: string | null;
        nest_id: number;
    }>;
}

export interface Egg {
    id: number;
    nest_id: number;
    name: string;
    description: string | null;
    docker_image: string;
    startup: string;
    variables: EggVariable[];
}

export interface EggVariable {
    name: string;
    description: string;
    env_variable: string;
    default_value: string;
    rules: string;
    user_viewable: boolean;
    user_editable: boolean;
}

export interface CreateServerRequest {
    allocation_id: number;
    name: string;
    egg_id: number;
    cpu: number;
    memory: number;
    disk: number;
    databases: number;
    allocations: number;
    backups: number;
}
