import { Typography } from "@mui/material";
import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React from "react";

interface NewImageModalProps extends BasicModalProps {

}

const NewImageModal: React.FC<NewImageModalProps> = ({ open, onClose }) => {
    return (
        <BaseModal open={open} title="New Image" onClose={onClose} onOk={() => {}}>
            <React.Fragment>
            </React.Fragment>
        </BaseModal>
    );
};

export default NewImageModal;