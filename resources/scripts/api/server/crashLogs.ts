import http from '@/api/http';

export interface CrashLogEntry {
    filename: string;
    log_type: 'latest' | 'crash';
    mclo_url: string;
    uploaded_at: string;
}

export const getCrashLogs = (uuid: string): Promise<CrashLogEntry[]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/crash-logs`)
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};

export const saveCrashLog = (uuid: string, filename: string, logType: 'latest' | 'crash', mcloUrl: string): Promise<CrashLogEntry> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/crash-logs`, {
            filename,
            log_type: logType,
            mclo_url: mcloUrl,
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
