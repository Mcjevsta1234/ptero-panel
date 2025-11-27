import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import Card from '@/witchyworlds/ui/Card';
import { CreditCardIcon, StatusOnlineIcon, ChatAlt2Icon, GlobeIcon, BookOpenIcon, StarIcon } from '@heroicons/react/solid';

const Container = styled.div`
    ${tw`space-y-2 h-full flex flex-col`}
`;

const SocialLink = styled.a`
    ${tw`flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 hover:text-white hover:bg-gray-600 transition-all duration-150 no-underline`}

    & > svg {
        ${tw`w-5 h-5 text-witchyworlds flex-shrink-0`}
    }

    & > span {
        ${tw`text-sm font-medium`}
    }
`;

const Title = styled.h3`
    ${tw`text-lg font-semibold text-gray-100 mb-3`}
`;

const SocialsSection = ({ className }: { className?: string }) => {
    const socialBilling = useStoreState((state) => state.witchyworlds.data?.socialBilling);
    const socialStatus = useStoreState((state) => state.witchyworlds.data?.socialStatus);
    const socialDiscord = useStoreState((state) => state.witchyworlds.data?.socialDiscord);
    const socialWebsite = useStoreState((state) => state.witchyworlds.data?.socialWebsite);
    const socialKnowledgebase = useStoreState((state) => state.witchyworlds.data?.socialKnowledgebase);
    const socialCustomTitle = useStoreState((state) => state.witchyworlds.data?.socialCustomTitle);
    const socialCustomUrl = useStoreState((state) => state.witchyworlds.data?.socialCustomUrl);

    const socials = [
        { icon: CreditCardIcon, label: 'Billing Area', url: socialBilling },
        { icon: StatusOnlineIcon, label: 'Status Page', url: socialStatus },
        { icon: ChatAlt2Icon, label: 'Discord', url: socialDiscord },
        { icon: GlobeIcon, label: 'Website', url: socialWebsite },
        { icon: BookOpenIcon, label: 'Knowledgebase', url: socialKnowledgebase },
        { icon: StarIcon, label: socialCustomTitle || 'Custom Link', url: socialCustomUrl },
    ].filter((social) => social.url);

    if (socials.length === 0) return null;

    return (
        <Card className={className}>
            <Title>Quick Links</Title>
            <Container>
                {socials.map((social, index) => (
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
        </Card>
    );
};

export default SocialsSection;
