import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

interface Props {
    hideDropdownArrow?: boolean;
}

const Select = styled.select<Props>`
    ${tw`shadow-none block p-3 pr-8 rounded-ui border w-full text-sm transition-all duration-300 ease-linear`};

    &,
    &:hover:not(:disabled),
    &:focus {
        ${tw`outline-none`};
    }

    -webkit-appearance: none;
    -moz-appearance: none;
    background-size: 1rem;
    background-repeat: no-repeat;
    background-position-x: calc(100% - 0.75rem);
    background-position-y: center;

    &::-ms-expand {
        display: none;
    }

    ${(props) =>
        !props.hideDropdownArrow &&
        css`
            background: linear-gradient(135deg, rgba(15, 40, 24, 0.3), rgba(10, 14, 39, 0.5));
            border: 1px solid rgba(167, 139, 250, 0.2);
            color: rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 20px rgba(107, 33, 168, 0.1);
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='%23a78bfa' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3e%3c/svg%3e ");

            &:hover:not(:disabled) {
                border-color: rgba(167, 139, 250, 0.4);
            }
            
            &:focus {
                border-color: rgba(6, 182, 212, 0.6);
                box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1), 0 0 20px rgba(6, 182, 212, 0.2);
            }
            
            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: rgba(15, 40, 24, 0.2);
            }
        `};
`;

export default Select;
