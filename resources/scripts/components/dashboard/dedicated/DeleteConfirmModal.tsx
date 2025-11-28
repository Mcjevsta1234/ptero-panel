import React from 'react';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button';
import asModal from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';

interface Props {
    serverName: string;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<Props> = ({ serverName, onConfirm }) => {
    const { dismiss } = React.useContext(ModalContext);

    const handleConfirm = () => {
        onConfirm();
        dismiss();
    };

    return (
        <div css={tw`p-6`}>
            <h2 css={tw`text-2xl font-bold mb-4 text-neutral-100`}>Delete Server</h2>
            <p css={tw`text-neutral-300 mb-6`}>
                Are you sure you want to delete <span css={tw`font-semibold text-red-400`}>{serverName}</span>?
                This action cannot be undone and all data will be permanently lost.
            </p>
            <div css={tw`flex justify-end gap-3`}>
                <Button.Text onClick={dismiss} css={tw`px-6`}>
                    Cancel
                </Button.Text>
                <Button.Danger onClick={handleConfirm} css={tw`px-6`}>
                    Delete Server
                </Button.Danger>
            </div>
        </div>
    );
};

export default asModal<Props>()(DeleteConfirmModal);
