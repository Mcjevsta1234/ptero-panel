import React, { useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import SearchContainer from '@/components/dashboard/search/SearchContainer';

interface NavbarProps {
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

const MysticalNavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 5rem;
  z-index: 50;
  background: linear-gradient(90deg, 
    rgba(10, 14, 39, 0.95) 0%,
    rgba(15, 40, 24, 0.4) 50%,
    rgba(10, 14, 39, 0.95) 100%
  );
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent,
      rgba(167, 139, 250, 0.05) 50%,
      transparent
    );
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(6, 182, 212, 0.2) 20%,
      rgba(167, 139, 250, 0.2) 50%,
      rgba(6, 182, 212, 0.2) 80%,
      transparent
    );
  }
`;

const NavContent = styled.div`
  ${tw`w-full h-full flex items-center justify-between px-6 md:px-8`}
  position: relative;
  z-index: 1;
  gap: 1.5rem;
`;

const NavSection = styled.div`
  ${tw`flex items-center`}
  gap: 1.5rem;
`;

const Divider = styled.div`
  width: 1px;
  height: 2rem;
  background: linear-gradient(180deg, 
    transparent,
    rgba(167, 139, 250, 0.3),
    transparent
  );
`;

export default ({ children }: NavbarProps) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <MysticalNavbarContainer
            style={{
                boxShadow: scrolled 
                    ? '0 0 30px rgba(167, 139, 250, 0.15)' 
                    : 'none',
            }}
        >
            <NavContent>
                <NavSection>
                    {children}
                </NavSection>
                <NavSection>
                    <SearchContainer />
                </NavSection>
            </NavContent>
        </MysticalNavbarContainer>
    );
};
