import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { CreditCardIcon, StatusOnlineIcon, ChatAlt2Icon, GlobeIcon, BookOpenIcon, LightningBoltIcon } from '@heroicons/react/solid';

const Container = styled.div`
    ${tw`grid grid-cols-2 gap-2`}
`;

const SocialLink = styled.a`
    ${tw`flex items-center gap-3 p-3 bg-gray-600 rounded-lg text-gray-200 hover:text-white hover:bg-gray-500 transition-all duration-150 no-underline`}

    & > svg {
        ${tw`w-5 h-5 text-witchyworlds flex-shrink-0`}
    }

    & > span {
        ${tw`text-sm font-medium`}
    }
`;

const Title = styled.h3`
    ${tw`text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2`}
`;

const SocialsSection = ({ className }: { className?: string }) => {
    const socialBilling = useStoreState((state) => state.witchyworlds.data?.socialBilling);
    const socialStatus = useStoreState((state) => state.witchyworlds.data?.socialStatus);
    const socialDiscord = useStoreState((state) => state.witchyworlds.data?.socialDiscord);
    const socialWebsite = useStoreState((state) => state.witchyworlds.data?.socialWebsite);
    const socialKnowledgebase = useStoreState((state) => state.witchyworlds.data?.socialKnowledgebase);
    const socialTrials = useStoreState((state) => state.witchyworlds.data?.socialTrials);

    const trialsUrl = (socialTrials && socialTrials.trim() !== '') ? socialTrials.trim() : 'https://trials.witchyworlds.top';

    const socialsOrdered = [
        { icon: GlobeIcon, label: 'Website', url: socialWebsite },
        { icon: LightningBoltIcon, label: 'Trials', url: trialsUrl },
        { icon: CreditCardIcon, label: 'Client Area', url: socialBilling },
        { icon: BookOpenIcon, label: 'Knowledgebase', url: socialKnowledgebase },
        { icon: StatusOnlineIcon, label: 'Status Page', url: socialStatus },
        { icon: ChatAlt2Icon, label: 'Discord', url: socialDiscord },
    ].filter(link => link.url && link.url.trim() !== '');

    if (socialsOrdered.length === 0) return null;

    return (
        <div className={`bg-gray-700 border border-gray-600 rounded-lg p-4 ${className || ''}`}>
            <Title>Quick Links</Title>
            <Container>
                {socialsOrdered.map((social, index) => (
                    <SocialLink
                        key={index}
                        href={social.url}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        <social.icon />
                        <span>{social.label}</span>
                    </SocialLink>
                ))}
            </Container>
        </div>
    );
};

export default SocialsSection;
