import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import tw from 'twin.macro';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Spinner from '@/components/elements/Spinner';
import { getAllocations } from '@/api/dedicated';
import { DedicatedAllocation } from '@/api/dedicated/types';
import AllocationCard from './AllocationCard';
// Removed modal-based creation: creation is handled on the stats page.
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';

export default ({ location }: RouteComponentProps) => {
    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState<DedicatedAllocation[]>([]);
    // Creation is no longer handled here; only list and link to detail.
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes('dedicated');
        setLoading(true);
        getAllocations()
            .then((data) => setAllocations(data))
            .catch((error) => clearAndAddHttpError({ key: 'dedicated', error }))
            .finally(() => setLoading(false));
    }, []);

    // No-op: creation moved to detail page.

    if (loading) {
        return (
            <PageContentBlock title={'Dedicated Servers'}>
                <Spinner size={'large'} centered />
            </PageContentBlock>
        );
    }

    if (allocations.length === 0) {
        return (
            <PageContentBlock title={'Dedicated Servers'}>
                <TitledGreyBox title={'No Allocations'}>
                    <p css={tw`text-neutral-400 text-center text-sm`}>
                        You don't have any dedicated server allocations yet. Contact an administrator to get started.
                    </p>
                </TitledGreyBox>
            </PageContentBlock>
        );
    }

    return (
        <>
            <PageContentBlock title={'Dedicated Servers'}>
                <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
                    {allocations.map((allocation) => (
                        <AllocationCard
                            key={allocation.id}
                            allocation={allocation}
                            onCreateServer={undefined}
                        />
                    ))}
                </div>
            </PageContentBlock>
            {/* CreateServerModal removed; creation is inline on the detail page. */}
        </>
    );
};
