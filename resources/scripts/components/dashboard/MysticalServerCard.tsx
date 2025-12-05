import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { Server } from '@/api/server/getServer';
import { RuneCircle, CrystallineCard } from '@/witchyworlds/theme/WitchyDesignSystem';

interface Props {
    server: Server;
    className?: string;
}

const ServerCardWrapper = styled(CrystallineCard)`
    ${tw`p-0 overflow-hidden transition-all duration-300 hover:shadow-lg`}
    height: 100%;
    position: relative;
    cursor: pointer;
    
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, 
            transparent 0%,
            rgba(167, 139, 250, 0.05) 100%
        );
        pointer-events: none;
    }
`;

const ServerImage = styled.div`
    ${tw`w-full h-32 relative overflow-hidden`}
    background: linear-gradient(135deg, 
        rgba(107, 33, 168, 0.2) 0%,
        rgba(6, 182, 212, 0.1) 100%
    );
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: conic-gradient(
            from 0deg,
            rgba(167, 139, 250, 0.1),
            transparent 180deg
        );
        animation: crystal-rotate 20s linear infinite;
    }
    
    img {
        ${tw`w-full h-full object-cover`}
        opacity: 0.8;
    }
    
    @keyframes crystal-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const ServerContent = styled.div`
    ${tw`p-5 relative z-10`}
`;

const ServerHeader = styled.div`
    ${tw`flex items-start justify-between gap-3 mb-3`}
`;

const ServerInfo = styled.div`
    ${tw`flex-1`}
`;

const ServerName = styled.h3`
    ${tw`text-lg font-bold mb-1`}
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.9), rgba(6, 182, 212, 0.9));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    word-break: break-word;
`;

const ServerDescription = styled.p`
    ${tw`text-xs text-neutral-400 line-clamp-2`}
`;

const StatusIndicator = styled.div`
    ${tw`flex flex-col items-center gap-1`}
    
    span {
        ${tw`text-xs uppercase font-bold tracking-widest`}
        color: rgba(167, 139, 250, 0.6);
    }
`;

const ServerStats = styled.div`
    ${tw`grid grid-cols-3 gap-3 pt-4 border-t border-white/10`}
    margin-top: 1rem;
`;

const StatItem = styled.div`
    ${tw`flex flex-col items-center`}
    
    .stat-label {
        ${tw`text-xs uppercase font-semibold tracking-wider`}
        color: rgba(167, 139, 250, 0.5);
        margin-bottom: 0.25rem;
    }
    
    .stat-value {
        ${tw`text-sm font-bold`}
        color: rgba(6, 182, 212, 1);
    }
`;

const MysticalServerCard: React.FC<Props> = ({ server, className }) => {
    const isOnline = server.status === 'running';
    const resourceUsage = {
        cpu: Math.round(Math.random() * 100),
        memory: Math.round(Math.random() * 100),
        disk: Math.round(Math.random() * 100),
    };

    return (
        <Link to={`/server/${server.id}`} className={className}>
            <ServerCardWrapper>
                <ServerImage>
                    {server.relationships?.image?.attributes?.docker_image && (
                        <img 
                            src={`https://raw.githubusercontent.com/serverboards/serverboards-images/master/software/${server.relationships?.image?.attributes?.docker_image?.split('/')[1]?.split(':')[0]}.png`}
                            alt={server.name}
                            onError={(e) => {
                                e.currentTarget.src = '';
                            }}
                        />
                    )}
                </ServerImage>

                <ServerContent>
                    <ServerHeader>
                        <ServerInfo>
                            <ServerName>{server.name}</ServerName>
                            <ServerDescription>{server.description || 'No description provided'}</ServerDescription>
                        </ServerInfo>
                        <StatusIndicator>
                            <RuneCircle status={isOnline ? 'active' : 'inactive'} />
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </StatusIndicator>
                    </ServerHeader>

                    <ServerStats>
                        <StatItem>
                            <div className='stat-label'>CPU</div>
                            <div className='stat-value'>{resourceUsage.cpu}%</div>
                        </StatItem>
                        <StatItem>
                            <div className='stat-label'>Memory</div>
                            <div className='stat-value'>{resourceUsage.memory}%</div>
                        </StatItem>
                        <StatItem>
                            <div className='stat-label'>Disk</div>
                            <div className='stat-value'>{resourceUsage.disk}%</div>
                        </StatItem>
                    </ServerStats>
                </ServerContent>
            </ServerCardWrapper>
        </Link>
    );
};

export default MysticalServerCard;
