import http from '@/api/http';
import { DedicatedAllocation, CreateServerRequest, Egg, Nest } from './types';

export const getAllocations = async (): Promise<DedicatedAllocation[]> => {
    const { data } = await http.get('/api/client/dedicated');
    return data.data;
};

export const getFormData = async (allocationId: number): Promise<{ nests: Nest[]; eggs: any[] }> => {
    const { data } = await http.get(`/api/client/dedicated/${allocationId}/create`);
    return data;
};

export const getEggDetails = async (eggId: number): Promise<Egg> => {
    const { data } = await http.get(`/api/client/dedicated/egg/${eggId}`);
    return data;
};

export const createDedicatedServer = async (request: CreateServerRequest): Promise<void> => {
    await http.post('/api/client/dedicated', request);
};
