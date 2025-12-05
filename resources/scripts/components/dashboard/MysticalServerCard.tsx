import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { Server } from '@/api/server/getServer';
import { bytesToString } from '@/lib/formatters';

interface Props {
    server: Server;
    className?: string;
}

const ServerCardWrapper = styled(Link)`
    ${tw`block p-0 overflow-hidden transition-all duration-300 relative`}
    background: linear-gradient(135deg, 
        rgba(15, 40, 24, 0.4) 0%,
        rgba(10, 14, 39, 0.6) 100%
    );
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 16px;
    text-decoration: none;
    min-height: 200px;
    
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 16px;
        padding: 1px;
        background: linear-gradient(135deg, 
            rgba(107, 33, 168, 0.3),
            rgba(6, 182, 212, 0.2),
            transparent
        );
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    &:hover::before {
        opacity: 1;
    }
    
    &:hover {
        border-color: rgba(167, 139, 250, 0.4);
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(107, 33, 168, 0.2),
                    0 0 40px rgba(6, 182, 212, 0.1);
    }
`;

const ServerHeader = styled.div`
    ${tw`p-6 pb-4 border-b`}
    border-color: rgba(167, 139, 250, 0.1);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(107, 33, 168, 0.15), transparent 70%);
        pointer-events: none;
    }
`;

const ServerTitleRow = styled.div`
    ${tw`flex items-start justify-between gap-3 mb-2`}
    position: relative;
    z-index: 1;
`;

const ServerName = styled.h3`
    ${tw`text-lg font-bold mb-1`}
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%,
        rgba(167, 139, 250, 0.8) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    word-break: break-word;
    line-height: 1.3;
`;

const StatusBadge = styled.div<{ status: 'online' | 'offline' | 'starting' | 'stopping' | 'suspended' | 'installing' }>`
    ${tw`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 flex-shrink-0`}
    ${({ status }) => {
        switch (status) {
            case 'online':
                return `
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    color: rgba(16, 185, 129, 1);
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
                `;
            case 'starting':
                return `
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
                    border: 1px solid rgba(59, 130, 246, 0.4);
                    color: rgba(59, 130, 246, 1);
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
                `;
            case 'stopping':
                return `
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
                    border: 1px solid rgba(251, 191, 36, 0.4);
                    color: rgba(251, 191, 36, 1);
                    box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
                `;
            case 'suspended':
            case 'installing':
                return `
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
                    border: 1px solid rgba(239, 68, 68, 0.4);
                    color: rgba(239, 68, 68, 1);
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
                `;
            default:
                return `
                    background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.1));
                    border: 1px solid rgba(107, 114, 128, 0.4);
                    color: rgba(156, 163, 175, 1);
                `;
        }
    }}
    
    .pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }
`;

const ServerNode = styled.div`
    ${tw`text-xs uppercase tracking-wider mt-1`}
    color: rgba(167, 139, 250, 0.5);
    font-weight: 600;
`;

const ServerBody = styled.div`
    ${tw`p-6`}
`;

const ResourceGrid = styled.div`
    ${tw`grid grid-cols-2 gap-4`}
`;

const ResourceItem = styled.div`
    ${tw`flex flex-col gap-1`}
`;

const ResourceLabel = styled.div`
    ${tw`text-xs uppercase font-semibold tracking-wider flex items-center gap-2`}
    color: rgba(167, 139, 250, 0.6);
`;

const ResourceValue = styled.div`
    ${tw`text-lg font-bold`}
    background: linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(167, 139, 250, 0.8));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const ResourceBar = styled.div<{ percent: number }>`
    ${tw`w-full h-1.5 rounded-full overflow-hidden mt-1`}
    background: rgba(107, 33, 168, 0.2);
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${({ percent }) => Math.min(percent, 100)}%;
        background: linear-gradient(90deg, 
            rgba(6, 182, 212, 0.8),
            rgba(167, 139, 250, 0.8)
        );
        border-radius: 9999px;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
    }
`;

const MysticalServerCard: React.FC<Props> = ({ server, className }) => {
    // Check server status
    const isSuspended = server.status === 'suspended';
    const isInstalling = server.status === 'installing';
    const isTransferring = server.isTransferring;
    
    // Determine display status
    const getStatus = (): 'online' | 'offline' | 'starting' | 'stopping' | 'suspended' | 'installing' => {
        if (isSuspended) return 'suspended';
        if (isInstalling) return 'installing';
        if (isTransferring) return 'starting';
        return 'offline'; // Default to offline since we don't have real-time stats
    };

    const status = getStatus();
    const statusText = isSuspended ? 'Suspended' 
        : isInstalling ? 'Installing' 
        : isTransferring ? 'Transferring' 
        : 'Offline';

    // Convert limits to GB
    const memoryGB = (server.limits.memory / 1024).toFixed(1);
    const diskGB = (server.limits.disk / 1024).toFixed(1);

    return (
        <ServerCardWrapper to={`/server/${server.id}`} className={className}>
            <ServerHeader>
                <ServerTitleRow>
                    <div css={tw`flex-1`}>
                        <ServerName>{server.name}</ServerName>
                        <ServerNode>{server.node}</ServerNode>
                    </div>
                    <StatusBadge status={status}>
                        <span className='pulse'></span>
                        {statusText}
                    </StatusBadge>
                </ServerTitleRow>
            </ServerHeader>

            <ServerBody>
                <ResourceGrid>
                    <ResourceItem>
                        <ResourceLabel>
                            <svg css={tw`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                            Memory
                        </ResourceLabel>
                        <ResourceValue>{memoryGB} GB</ResourceValue>
                        <ResourceBar percent={0} />
                    </ResourceItem>
                    
                    <ResourceItem>
                        <ResourceLabel>
                            <svg css={tw`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                            </svg>
                            Disk
                        </ResourceLabel>
                        <ResourceValue>{diskGB} GB</ResourceValue>
                        <ResourceBar percent={0} />
                    </ResourceItem>
                    
                    <ResourceItem>
                        <ResourceLabel>
                            <svg css={tw`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            CPU
                        </ResourceLabel>
                        <ResourceValue>{server.limits.cpu}%</ResourceValue>
                        <ResourceBar percent={0} />
                    </ResourceItem>
                    
                    <ResourceItem>
                        <ResourceLabel>
                            <svg css={tw`w-4 h-4`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                            Allocations
                        </ResourceLabel>
                        <ResourceValue>{server.allocations.length}</ResourceValue>
                    </ResourceItem>
                </ResourceGrid>
            </ServerBody>
        </ServerCardWrapper>
    );
};

export default MysticalServerCard;
