import styled from 'styled-components/macro';
import tw from 'twin.macro';

export const ContentContainer = styled.div`
    padding-top: 5rem;
    padding-bottom: 1.5rem;
    padding-right: 1rem;
    flex-direction: column;
    flex: 1;
    gap: 1.5rem;
    display: flex;
    
    @media (min-width: 1024px) {
        padding-left: 20rem;
    }
`;
