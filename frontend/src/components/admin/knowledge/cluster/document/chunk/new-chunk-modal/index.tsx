import { Typography } from "@mui/material";
import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React from "react";

interface NewChunkModalProps extends BasicModalProps {}

const NewChunkModal: React.FC<NewChunkModalProps> = ({ open, onClose }) => {
    return (
        <BaseModal open={open} title="New Chunk" onClose={onClose} onOk={() => {}}>
            <React.Fragment>

            </React.Fragment>
        </BaseModal>
    );
};

export default NewChunkModal;
