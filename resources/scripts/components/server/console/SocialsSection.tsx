import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { CreditCardIcon, StatusOnlineIcon, ChatAlt2Icon, GlobeIcon, BookOpenIcon, StarIcon, LightningBoltIcon } from '@heroicons/react/solid';

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
    const socialCustomTitle = useStoreState((state) => state.witchyworlds.data?.socialCustomTitle);
    const socialCustomUrl = useStoreState((state) => state.witchyworlds.data?.socialCustomUrl);
    const socialCustom2Title = useStoreState((state) => state.witchyworlds.data?.socialCustom2Title);
    const socialCustom2Url = useStoreState((state) => state.witchyworlds.data?.socialCustom2Url);
    const socialCustom3Title = useStoreState((state) => state.witchyworlds.data?.socialCustom3Title);
    const socialCustom3Url = useStoreState((state) => state.witchyworlds.data?.socialCustom3Url);
    const socialCustom4Title = useStoreState((state) => state.witchyworlds.data?.socialCustom4Title);
    const socialCustom4Url = useStoreState((state) => state.witchyworlds.data?.socialCustom4Url);

    const socials = [
        { icon: CreditCardIcon, label: 'Billing Area', url: socialBilling },
        { icon: StatusOnlineIcon, label: 'Status Page', url: socialStatus },
        { icon: ChatAlt2Icon, label: 'Discord', url: socialDiscord },
        { icon: GlobeIcon, label: 'Website', url: socialWebsite },
        { icon: BookOpenIcon, label: 'Knowledgebase', url: socialKnowledgebase },
        { icon: LightningBoltIcon, label: 'Trials', url: socialTrials },
    ];

    // Add custom links if they have URLs (show with custom title or default label)
    if (socialCustomUrl && socialCustomUrl.trim() !== '') {
        socials.push({ icon: StarIcon, label: socialCustomTitle || 'Custom Link', url: socialCustomUrl });
    }
    if (socialCustom2Url && socialCustom2Url.trim() !== '') {
        socials.push({ icon: StarIcon, label: socialCustom2Title || 'Custom Link 2', url: socialCustom2Url });
    }
    if (socialCustom3Url && socialCustom3Url.trim() !== '') {
        socials.push({ icon: StarIcon, label: socialCustom3Title || 'Custom Link 3', url: socialCustom3Url });
    }
    if (socialCustom4Url && socialCustom4Url.trim() !== '') {
        socials.push({ icon: StarIcon, label: socialCustom4Title || 'Custom Link 4', url: socialCustom4Url });
    }

    // Filter out empty URLs from the main links
    const filteredSocials = socials.filter((social) => social.url && social.url.trim() !== '');

    if (filteredSocials.length === 0) return null;

    return (
        <div className={`bg-gray-700 border border-gray-600 rounded-lg p-4 ${className || ''}`}>
            <Title>Quick Links</Title>
            <Container>
                {filteredSocials.map((social, index) => (
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
