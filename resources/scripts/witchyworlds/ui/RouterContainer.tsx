import styled from 'styled-components/macro';
import tw from 'twin.macro';

export const RouterContainer = styled.div`
    ${tw`min-h-screen h-full bg-fixed bg-center bg-no-repeat`}
    background: linear-gradient(135deg, #0a0e27 0%, #0f2818 50%, #1a1429 100%);
    background-attachment: fixed;
    position: relative;
    
    &::before {
        content: '';
        position: fixed;
        inset: 0;
        background: 
            radial-gradient(circle at 20% 50%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(45, 106, 79, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.04) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
    }
    
    > * {
        position: relative;
        z-index: 1;
    }
`;
