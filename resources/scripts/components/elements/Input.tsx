import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    hasError?: boolean;
}

const checkboxStyle = css<Props>`
    ${tw`cursor-pointer appearance-none inline-block align-middle select-none flex-shrink-0 w-4 h-4 border rounded-sm`};
    background: linear-gradient(135deg, rgba(15, 40, 24, 0.3), rgba(10, 14, 39, 0.5));
    border-color: rgba(167, 139, 250, 0.3);
    color: rgba(6, 182, 212, 1);
    color-adjust: exact;
    background-origin: border-box;
    transition: all 150ms ease;

    &:checked {
        ${tw`border-transparent bg-no-repeat bg-center`};
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: currentColor;
        background-size: 100% 100%;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
    }

    &:focus {
        ${tw`outline-none`};
        border-color: rgba(6, 182, 212, 0.6);
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }
    
    &:hover {
        border-color: rgba(167, 139, 250, 0.5);
    }
`;

const inputStyle = css<Props>`
    // Reset to normal styling.
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`p-3 border rounded-ui text-sm transition-all duration-300`};
    background: linear-gradient(135deg, rgba(15, 40, 24, 0.3), rgba(10, 14, 39, 0.5));
    border: 1px solid rgba(167, 139, 250, 0.2);
    color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 20px rgba(107, 33, 168, 0.1);

    &::placeholder {
        color: rgba(167, 139, 250, 0.4);
    }

    & + .input-help {
        ${tw`mt-1 text-xs`};
        ${(props) => (props.hasError ? tw`text-red-400` : `color: rgba(167, 139, 250, 0.6);`)};
    }

    &:required,
    &:invalid {
        ${tw`shadow-none`};
    }

    &:not(:disabled):not(:read-only):hover {
        border-color: rgba(167, 139, 250, 0.4);
    }

    &:not(:disabled):not(:read-only):focus {
        border-color: rgba(6, 182, 212, 0.6);
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1), 0 0 20px rgba(6, 182, 212, 0.2);
        ${(props) => props.hasError && `
            border-color: rgba(239, 68, 68, 0.6);
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1), 0 0 20px rgba(239, 68, 68, 0.2);
        `};
    }

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`};
        background: rgba(15, 40, 24, 0.2);
    }

    ${(props) => props.hasError && `
        color: rgba(255, 255, 255, 0.9);
        border-color: rgba(239, 68, 68, 0.5);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(10, 14, 39, 0.5));
        
        &:hover {
            border-color: rgba(239, 68, 68, 0.6);
        }
    `};
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            ${tw`rounded-full`};
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
