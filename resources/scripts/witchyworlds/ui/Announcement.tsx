import React from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Md2React from '@/witchyworlds/ui/Md2React';
import { BellIcon, CheckIcon, ExclamationIcon, InboxInIcon, InformationCircleIcon } from '@heroicons/react/solid';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Container = styled.div`
    ${tw`px-2`}
`;

const AlertContainer = styled.div`
    ${tw`mx-auto w-full flex items-center gap-x-3 max-w-[1200px] p-3 mt-2 rounded-ui text-gray-100 !border-t-0 !border-r-0 !border-b-0 !border-l-4`}
`;

const Announcement = () => {
    const alertType = useStoreState((state: ApplicationStore) => state.witchyworlds.data!.alertType);
    const alertMessage = useStoreState((state: ApplicationStore) => state.witchyworlds.data!.alertMessage);
    return (
        <Container>
            {alertType !== 'disabled' ? (
                <AlertContainer
                    className={`
               ${
                   alertType === 'info'
                       ? 'bg-blue-500/10 border-blue-500'
                       : alertType === 'announcement'
                       ? 'bg-witchyworlds/10 border-witchyworlds'
                       : alertType === 'danger'
                       ? 'bg-danger/10 border-danger'
                       : alertType === 'success'
                       ? 'bg-success/10 border-success'
                       : alertType === 'warning'
                       ? 'bg-yellow-500/10 border-yellow-500'
                       : ''
               }
            `}
                >
                    <div>
                        {alertType === 'info' ? (
                            <InformationCircleIcon className='h-5 w-5 font-bold !text-blue-500' />
                        ) : alertType === 'announcement' ? (
                            <BellIcon className='h-5 w-5 font-bold !text-witchyworlds' />
                        ) : alertType === 'danger' ? (
                            <InboxInIcon className='h-5 w-5 font-bold !text-danger/50' />
                        ) : alertType === 'success' ? (
                            <CheckIcon className='h-5 w-5 font-bold !text-success/50' />
                        ) : alertType === 'warning' ? (
                            <ExclamationIcon className='h-5 w-5 font-bold !text-yellow-500' />
                        ) : (
                            ''
                        )}
                    </div>
                    <div>
                        <Md2React markdown={alertMessage} />
                    </div>
                </AlertContainer>
            ) : (
                ''
            )}
        </Container>
    );
};

export default Announcement;
