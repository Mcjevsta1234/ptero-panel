import React, { useEffect, useState, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import PowerButtons from '@/components/server/console/PowerButtons';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import Can from '@/components/elements/Can';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Card from '@/witchyworlds/ui/Card';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Title from '@/witchyworlds/ui/Title';
// Removed StatBlock usage for compact inline stats layout
import { useStoreState } from 'easy-peasy';
import Blur from '@/witchyworlds/ui/Blur';
import { useTranslation } from 'react-i18next';
import { FaFloppyDisk, FaGlobe, FaHashtag, FaMemory, FaMicrochip } from 'react-icons/fa6';

type Stats = Record<'memory' | 'cpu' | 'disk', number>;

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'text-xs text-gray-300'}>/ {limit || <>&infin;</>}</span>
    </>
);
    return (
        <Container>
            <Card className={`!p-4 !px-6 mx-auto w-full max-w-[1200px] !bg-gray-700`}>
                {/* Compact top bar: left info, right actions */}
                <div className='flex items-center justify-between gap-4 flex-wrap mb-2'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        <Title className='text-2xl'>{name}</Title>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-ui tracking-wide uppercase ${statusBadge.class}`}>
                            {statusBadge.text}
                        </span>
                        {rootAdmin && (
                            // eslint-disable-next-line react/jsx-no-target-blank
                            <a href={`/admin/servers/view/${serverId}`} target={'_blank'} className='h-5 w-5 text-gray-300'>
                                <ExternalLinkIcon />
                            </a>
                        )}
                    </div>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className='flex gap-2' />
                    </Can>
                </div>
                {/* Inline stats row */}
                <div className='flex items-center gap-5 flex-wrap text-sm'>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaGlobe className='w-4 h-4 text-gray-400' />
                        <CopyOnClick text={allocation}>
                            <Blur className='text-sm'>{allocation}</Blur>
                        </CopyOnClick>
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaMicrochip className='w-4 h-4 text-gray-400' />
                        {status === 'offline' ? (
                            <Limit limit={textLimits.cpu}>0%</Limit>
                        ) : (
                            <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                        )}
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaMemory className='w-4 h-4 text-gray-400' />
                        {status === 'offline' ? (
                            <Limit limit={textLimits.memory}>0 MiB</Limit>
                        ) : (
                            <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                        )}
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaFloppyDisk className='w-4 h-4 text-gray-400' />
                        <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
                    </div>
                    <div className='flex items-center gap-1 text-gray-200'>
                        <FaHashtag className='w-4 h-4 text-gray-400' />
                        <CopyOnClick text={id}>
                            <span>{id}</span>
                        </CopyOnClick>
                    </div>
                </div>
            </Card>
        </Container>
    );
                <div className='flex items-center gap-3 flex-wrap mb-4'>
                    <Title className='text-3xl'>{name}</Title>
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-ui tracking-wide uppercase ${statusBadge.class}`}
                    >
                        {statusBadge.text}
                    </span>
                    {rootAdmin && (
                        // eslint-disable-next-line react/jsx-no-target-blank
                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'} className='h-5 w-5 text-gray-300'>
                            <ExternalLinkIcon />
                        </a>
                    )}
                </div>

                {/* Stats Row */}
                <div className='flex items-center gap-2 flex-wrap mb-6'>
                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaGlobe />
                        </span>
                        <CopyOnClick text={allocation}>
                            <Blur className={`text-sm text-gray-100`}>{allocation}</Blur>
                        </CopyOnClick>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaMicrochip />
                        </span>
                        <span className='text-sm text-gray-100'>
                            {status === 'offline' ? (
                                <Limit limit={textLimits.cpu}>0%</Limit>
                            ) : (
                                <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                            )}
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaMemory />
                        </span>
                        <span className='text-sm text-gray-100'>
                            {status === 'offline' ? (
                                <Limit limit={textLimits.memory}>0 MiB</Limit>
                            ) : (
                                <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                            )}
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaFloppyDisk />
                        </span>
                        <span className='text-sm text-gray-100'>
                            <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
                        </span>
                    </StatBlock>

                    <StatBlock className='bg-gray-800 border-gray-600'>
                        <span className='w-5 text-gray-300'>
                            <FaHashtag />
                        </span>
                        <CopyOnClick text={id}>
                            <span className='text-sm text-gray-100'>{id}</span>
                        </CopyOnClick>
                    </StatBlock>
                </div>
                {/* Actions Row */}
                <div className='flex w-full justify-end'>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className='grid grid-cols-3 gap-2' />
                    </Can>
                </div>
            </Card>
        </Container>
    );
};
export default TopServerDetails;
