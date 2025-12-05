import React, { useEffect, useState } from 'react';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { ThemeModeSwitcher } from '@/witchyworlds/ui/ThemeModeSwitcher';

interface NavbarProps {
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

const Container = styled.div`
    ${tw`fixed top-0 left-0 w-full z-50 transition duration-300`}
    background: linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(26, 35, 50, 0.95) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    height: 4rem;
`;

export default ({ children }: NavbarProps) => {
    const [blurred, setBlurred] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setBlurred(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <Container className={`${blurred ? 'shadow-lg shadow-black/50' : ''}`}>
            <div css={tw`w-full flex items-center justify-between h-full px-4 sm:px-6 md:px-8 gap-4`}>
                <div css={tw`flex items-center gap-4`}>{children}</div>
                <div css={tw`flex items-center gap-4`}>
                    <SearchContainer />
                    <div css={tw`h-8 w-px bg-white/10`} />
                    <ThemeModeSwitcher />
                </div>
            </div>
        </Container>
    );
};
