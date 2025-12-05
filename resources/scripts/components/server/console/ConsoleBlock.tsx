import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Console from '@/components/server/console/Console';
import { CrystallineCard } from '@/witchyworlds/theme/WitchyDesignSystem';

const Container = styled(CrystallineCard)`
    ${tw`p-2 overflow-hidden`}
    background: linear-gradient(135deg, 
        rgba(15, 40, 24, 0.8) 0%,
        rgba(10, 14, 39, 0.8) 100%
    );
    border: 1px solid rgba(107, 33, 168, 0.3);
    box-shadow: 0 0 30px rgba(107, 33, 168, 0.15), inset 0 0 30px rgba(6, 182, 212, 0.05);
    
    /* Console scrollbar styling */
    .xterm {
        background: transparent;
    }
    
    .xterm-screen {
        background: transparent;
    }
    
    .xterm-viewport {
        background: transparent;
    }
    
    /* Glowing terminal text effect */
    .xterm-char {
        text-shadow: 0 0 5px rgba(6, 182, 212, 0.3);
    }
`;

const ConsoleBlock = () => {
    return (
        <Container>
            <Console />
        </Container>
    );
};

export default ConsoleBlock;
