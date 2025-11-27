import React, { useEffect, useState } from 'react';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

interface NavbarProps {
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

const Container = styled.div`
    ${tw`fixed top-0 left-0 w-full h-16 z-50 transition duration-300`}
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
        <Container className={`${blurred ? 'backdrop-blur-lg shadow' : ''}`}>
            <div className='w-full mt-1 flex items-center justify-between h-full px-4 sm:px-6 md:px-8'>
                <div className='flex items-center gap-4'>{children}</div>
                <div className='flex grow-0 shrink-0 md:basis-56 order-last justify-end'>
                    <SearchContainer />
                </div>
            </div>
        </Container>
    );
};
