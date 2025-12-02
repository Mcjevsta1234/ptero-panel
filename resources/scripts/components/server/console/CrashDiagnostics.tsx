import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import { ExclamationCircleIcon, DocumentTextIcon, ClipboardCopyIcon } from '@heroicons/react/solid';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import http from '@/api/http';

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
    const [uploading, setUploading] = useState<string | null>(null);

    const status = ServerContext.useStoreState((state) => state.status.value);

    useEffect(() => {
        // Listen for server crashes/stops/restarts
        if (status === 'offline' || status === 'stopping') {
            fetchRecentLogs();
        }
    }, [status]);

    const fetchRecentLogs = async () => {
        try {
            const response = await http.get(`/api/client/servers/${uuid}/files/list`, {
                params: { directory: '/logs' }
            });
            
            const crashReports = response.data.filter((file: any) => 
                file.name.endsWith('.log') || file.name.includes('crash')
            ).slice(0, 5);

            setLogs(crashReports.map((file: any) => ({
                type: file.name.includes('crash') ? 'crash' : 'log',
                filename: file.name,
                timestamp: new Date(file.modified_at).toLocaleString(),
            })));
        } catch (error) {
            // Silently fail if logs directory doesn't exist
            console.log('Could not fetch logs:', error);
        }
    };

    const uploadToMcLogs = async (filename: string) => {
        setUploading(filename);
        clearFlashes('crash-diagnostics');

        try {
            // Read the log file
            const fileResponse = await http.get(`/api/client/servers/${uuid}/files/contents`, {
                params: { file: `/logs/${filename}` }
            });

            // Upload to mclo.gs
            const mclogsResponse = await fetch('https://api.mclo.gs/1/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `content=${encodeURIComponent(fileResponse.data)}`
            });

            const mclogsData = await mclogsResponse.json();

            if (mclogsData.success) {
                // Update the log entry with mclo.gs URL
                setLogs(prevLogs => prevLogs.map(log => 
                    log.filename === filename 
                        ? { ...log, mclogsUrl: mclogsData.url }
                        : log
                ));

                // Copy to clipboard
                navigator.clipboard.writeText(mclogsData.url);
            } else {
                throw new Error('Failed to upload to mclo.gs');
            }
        } catch (error: any) {
            clearAndAddHttpError({ key: 'crash-diagnostics', error });
        } finally {
            setUploading(null);
        }
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
    };

    if (logs.length === 0 && status !== 'offline' && status !== 'stopping') {
        return null;
    }

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
                            <CopyButton onClick={() => copyUrl(log.mclogsUrl!)}>
                                <ClipboardCopyIcon />
                                Copy Link
                            </CopyButton>
                        ) : (
                            <CopyButton 
                                onClick={() => uploadToMcLogs(log.filename)}
                                disabled={uploading === log.filename}
                            >
                                <ClipboardCopyIcon />
                                {uploading === log.filename ? 'Uploading...' : 'Upload'}
                            </CopyButton>
                        )}
                    </LogEntry>
                ))
            )}
        </Container>
    );
};

export default CrashDiagnostics;
