import React from 'react';
import tw from 'twin.macro';
import { DedicatedAllocation } from '@/api/dedicated/types';
import { Button } from '@/components/elements/button';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { bytesToString } from '@/lib/formatters';
import { Link } from 'react-router-dom';

interface Props {
    allocation: DedicatedAllocation;
    onCreateServer: () => void;
}

export default ({ allocation, onCreateServer }: Props) => {
    const used = allocation.used_resources;
    const available = allocation.available_resources;

    const getProgressColor = (used: number, limit: number, allowOverallocation: boolean) => {
        if (allowOverallocation) return 'bg-blue-500';
        const percentage = (used / limit) * 100;
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <TitledGreyBox title={allocation.name || allocation.node.name}>
            <div css={tw`space-y-3`}>
                {/* Server Count */}
                <div>
                    <div css={tw`flex justify-between text-sm mb-1`}>
                        <span css={tw`text-neutral-400`}>Servers</span>
                        <span css={tw`text-neutral-300`}>
                            {allocation.servers_count}
                        </span>
                    </div>
                </div>

                {/* CPU */}
                <div>
                    <div css={tw`flex justify-between text-sm mb-1`}>
                        <span css={tw`text-neutral-400`}>CPU</span>
                        <span css={tw`text-neutral-300`}>
                            {used.cpu}% / {allocation.cpu}%
                        </span>
                    </div>
                    <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                        <div
                            css={tw`h-2 rounded-full transition-all duration-300 bg-green-500`}
                            style={{ width: `${allocation.cpu > 0 ? Math.min((used.cpu / allocation.cpu) * 100, 100) : 0}%` }}
                        />
                    </div>
                    {available.cpu >= 0 && allocation.cpu > 0 && (
                        <p css={tw`text-xs text-neutral-500 mt-1`}>{available.cpu}% available</p>
                    )}
                </div>

                {/* Memory */}
                <div>
                    <div css={tw`flex justify-between text-sm mb-1`}>
                        <span css={tw`text-neutral-400`}>Memory</span>
                        <span css={tw`text-neutral-300`}>
                            {bytesToString(used.memory * 1024 * 1024)} / {bytesToString(allocation.memory * 1024 * 1024)}
                        </span>
                    </div>
                    <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                        <div
                            css={tw`h-2 rounded-full transition-all duration-300`}
                            className={getProgressColor(used.memory, allocation.memory, allocation.allow_memory_overallocation)}
                            style={{ width: `${Math.min((used.memory / allocation.memory) * 100, 100)}%` }}
                        />
                    </div>
                    {available.memory >= 0 && (
                        <p css={tw`text-xs text-neutral-500 mt-1`}>{bytesToString(available.memory * 1024 * 1024)} available</p>
                    )}
                </div>

                {/* Disk */}
                <div>
                    <div css={tw`flex justify-between text-sm mb-1`}>
                        <span css={tw`text-neutral-400`}>Disk</span>
                        <span css={tw`text-neutral-300`}>
                            {bytesToString(used.disk * 1024 * 1024)} / {bytesToString(allocation.disk * 1024 * 1024)}
                        </span>
                    </div>
                    <div css={tw`w-full bg-neutral-700 rounded-full h-2`}>
                        <div
                            css={tw`h-2 rounded-full transition-all duration-300`}
                            className={getProgressColor(used.disk, allocation.disk, allocation.allow_disk_overallocation)}
                            style={{ width: `${Math.min((used.disk / allocation.disk) * 100, 100)}%` }}
                        />
                    </div>
                    {available.disk >= 0 && (
                        <p css={tw`text-xs text-neutral-500 mt-1`}>{bytesToString(available.disk * 1024 * 1024)} available</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div css={tw`pt-2 space-y-2`}>
                    <Link to={`/account/dedicated/${allocation.id}`}>
                        <Button.Text css={tw`w-full`}>
                            View Details
                        </Button.Text>
                    </Link>
                    <Button.Success
                        css={tw`w-full`}
                        onClick={onCreateServer}
                        disabled={!allocation.active}
                    >
                        {allocation.active ? 'Create Server' : 'Allocation Inactive'}
                    </Button.Success>
                </div>
            </div>
        </TitledGreyBox>
    );
};
