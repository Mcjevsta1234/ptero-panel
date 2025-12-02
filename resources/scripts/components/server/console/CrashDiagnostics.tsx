import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { ExclamationCircleIcon, DocumentTextIcon, ClipboardCopyIcon } from '@heroicons/react/solid';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import http from '@/api/http';
import { getCrashLogs, saveCrashLog } from '@/api/server/crashLogs';

const Container = styled.div`
    ${tw`bg-gray-700 border border-gray-600 rounded-lg p-4`}
`;

const Title = styled.h3`
    ${tw`text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2`}
`;

const LogEntry = styled.div`
    ${tw`flex items-center justify-between p-3 bg-gray-600 rounded-lg mb-2 hover:bg-gray-500 transition-all duration-150`}
`;

const LogInfo = styled.div`
    ${tw`flex items-center gap-3 flex-1`}
`;

const LogIcon = styled.div<{ type: 'crash' | 'log' }>`
    ${tw`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
    ${props => props.type === 'crash' ? tw`bg-red-500/20` : tw`bg-blue-500/20`}
    
    svg {
        ${tw`w-5 h-5`}
        ${props => props.type === 'crash' ? tw`text-red-400` : tw`text-blue-400`}
    }
`;

const LogDetails = styled.div`
    ${tw`flex-1`}
`;

const LogType = styled.div`
    ${tw`text-sm font-medium text-gray-200`}
`;

const LogTime = styled.div`
    ${tw`text-xs text-gray-400`}
`;

const CopyButton = styled.button`
    ${tw`flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-all duration-150`}
    
    svg {
        ${tw`w-4 h-4`}
    }

    &:disabled {
        ${tw`bg-gray-500 cursor-not-allowed`}
    }
`;

const EmptyState = styled.div`
    ${tw`text-center py-8 text-gray-400 text-sm`}
`;

interface CrashLog {
    type: 'crash' | 'log';
    filename: string;
    timestamp: string;
    mclogsUrl?: string;
}

const CrashDiagnostics = ({ className }: { className?: string }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [logs, setLogs] = useState<CrashLog[]>([]);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const prevStatusRef = React.useRef<string | null>(null);

    // Load stored logs on mount
    useEffect(() => {
        loadStoredLogs();
    }, []);

    useEffect(() => {
        // Check if server just stopped/crashed
        const prevStatus = prevStatusRef.current;
        const justStopped = (prevStatus === 'running' || prevStatus === 'starting') && 
                           (status === 'offline' || status === 'stopping');

        if (justStopped) {
            // Server just crashed/stopped - immediately upload latest.log
            autoUploadLatestLog();
        }

        prevStatusRef.current = status;
    }, [status]);

    const loadStoredLogs = async () => {
        try {
            const storedLogs = await getCrashLogs(uuid);
            
            if (storedLogs.length > 0) {
                setLogs(storedLogs.map(log => ({
                    type: log.log_type === 'crash' ? 'crash' : 'log',
                    filename: log.filename,
                    timestamp: new Date(log.uploaded_at).toLocaleString(),
                    mclogsUrl: log.mclo_url,
                })));
            }
        } catch (error) {
            console.log('Could not load stored logs:', error);
        }
    };

    const autoUploadLatestLog = async () => {
        try {
            const logList: CrashLog[] = [];

            // Upload latest.log
            try {
                const fileResponse = await http.get(`/api/client/servers/${uuid}/files/contents`, {
                    params: { file: '/logs/latest.log' }
                });

                const mclogsResponse = await fetch('https://api.mclo.gs/1/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `content=${encodeURIComponent(fileResponse.data)}`
                });

                const mclogsData = await mclogsResponse.json();

                if (mclogsData.success) {
                    // Save to database
                    await saveCrashLog(uuid, 'latest.log', 'latest', mclogsData.url);

                    logList.push({
                        type: 'log',
                        filename: 'latest.log',
                        timestamp: new Date().toLocaleString(),
                        mclogsUrl: mclogsData.url,
                    });
                }
            } catch (error) {
                console.log('Could not upload latest.log:', error);
            }

            // Try to get and upload recent crash reports (within last 5 minutes)
            try {
                const crashResponse = await http.get(`/api/client/servers/${uuid}/files/list`, {
                    params: { directory: '/crash-reports' }
                });
                
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                
                const recentCrashFiles = crashResponse.data
                    .filter((file: any) => {
                        const fileTime = new Date(file.modified_at).getTime();
                        return fileTime >= fiveMinutesAgo && 
                               (file.name.endsWith('.txt') || file.name.endsWith('.log'));
                    })
                    .slice(0, 2);

                // Upload each crash report
                for (const crashFile of recentCrashFiles) {
                    try {
                        const crashContent = await http.get(`/api/client/servers/${uuid}/files/contents`, {
                            params: { file: `/crash-reports/${crashFile.name}` }
                        });

                        const mclogsResponse = await fetch('https://api.mclo.gs/1/log', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: `content=${encodeURIComponent(crashContent.data)}`
                        });

                        const mclogsData = await mclogsResponse.json();

                        if (mclogsData.success) {
                            // Save to database
                            await saveCrashLog(uuid, `crash-reports/${crashFile.name}`, 'crash', mclogsData.url);

                            logList.push({
                                type: 'crash',
                                filename: `crash-reports/${crashFile.name}`,
                                timestamp: new Date(crashFile.modified_at).toLocaleString(),
                                mclogsUrl: mclogsData.url,
                            });
                        }
                    } catch (error) {
                        console.log(`Could not upload crash report ${crashFile.name}:`, error);
                    }
                }
            } catch (error) {
                // No crash reports, that's fine
            }

            setLogs(logList);
        } catch (error) {
            console.log('Could not auto-upload logs:', error);
        }
    };

    return (
        <Container className={className}>
            <Title>
                <ExclamationCircleIcon css={tw`w-5 h-5 text-yellow-400`} />
                Crash Diagnostics
            </Title>

            {logs.length === 0 ? (
                <EmptyState>
                    No recent crash reports or logs found
                </EmptyState>
            ) : (
                logs.map((log, index) => (
                    <LogEntry key={index}>
                        <LogInfo>
                            <LogIcon type={log.type}>
                                {log.type === 'crash' ? <ExclamationCircleIcon /> : <DocumentTextIcon />}
                            </LogIcon>
                            <LogDetails>
                                <LogType>{log.filename}</LogType>
                                <LogTime>{log.timestamp}</LogTime>
                            </LogDetails>
                        </LogInfo>
                        
                        {log.mclogsUrl ? (
                            <CopyButton onClick={() => window.open(log.mclogsUrl, '_blank')}>
                                <DocumentTextIcon />
                                Open Log
                            </CopyButton>
                        ) : (
                            <CopyButton disabled>
                                <ClipboardCopyIcon />
                                Waiting...
                            </CopyButton>
                        )}
                    </LogEntry>
                ))
            )}
        </Container>
    );
};

export default CrashDiagnostics;
