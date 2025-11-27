import styled from 'styled-components/macro';
import tw from 'twin.macro';

export const RouterContainer = styled.div`
    ${tw`min-h-screen h-full bg-gray-800 bg-fixed bg-center bg-no-repeat`}
    background-image: var(--background);
    background-size: cover;
`;
