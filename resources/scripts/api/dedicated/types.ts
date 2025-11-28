export interface DedicatedAllocation {
    id: number;
    user_id: number;
    node_id: number;
    node: {
        id: number;
        name: string;
    };
    cpu_limit: number;
    memory_limit: number;
    disk_limit: number;
    backup_limit: number;
    allocation_limit: number;
    database_limit: number;
    max_servers: number;
    port_range_start: number;
    port_range_end: number;
    allow_cpu_overallocation: boolean;
    allow_memory_overallocation: boolean;
    allow_disk_overallocation: boolean;
    allowed_nests: number[] | null;
    allowed_eggs: number[] | null;
    servers_count: number;
    used_resources: {
        cpu: number;
        memory: number;
        disk: number;
    };
    available_resources: {
        cpu: number;
        memory: number;
        disk: number;
    };
}

export interface Nest {
    id: number;
    name: string;
    description: string | null;
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
    port: number;
    environment: Record<string, string>;
}
