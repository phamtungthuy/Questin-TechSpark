import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React from "react";

interface IProps extends BasicModalProps {}

const EditChunkModal: React.FC<IProps> = ({ open, onClose }) => {
    return (
        <BaseModal open={open} title="Edit Question" onClose={onClose} onOk={() => {}}>
            <React.Fragment>

            </React.Fragment>
        </BaseModal>
    );
};

export default EditChunkModal;
