import styled from 'styled-components/macro';
import tw from 'twin.macro';

export const RouterContainer = styled.div`
    ${tw`min-h-screen h-full bg-fixed bg-center bg-no-repeat`}
    background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(74, 157, 111, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(107, 142, 96, 0.05) 0%, transparent 50%);
    background-size: cover, cover;
`;
