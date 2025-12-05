import styled from 'styled-components/macro';
import tw from 'twin.macro';

export const LogoContainer = styled.div`
    ${tw`flex gap-x-3 pb-5 items-center`}
    
    img {
        ${tw`transition-transform duration-300 hover:scale-110`}
        filter: drop-shadow(0 0 10px rgba(74, 157, 111, 0.3));
    }
`;
