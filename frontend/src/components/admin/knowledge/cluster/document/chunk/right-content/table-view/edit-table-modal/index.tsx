import { Typography } from "@mui/material";
import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React from "react";

interface EditTableModalProps extends BasicModalProps {}

const EditTableModal: React.FC<EditTableModalProps> = ({ open, onClose }) => {
    return (
        <BaseModal title="Edit table" open={open} onClose={onClose} onOk={() => {}}>
            <React.Fragment>
                <Typography
                    variant="h5"
                    component="h2"
                    fontSize="20px"
                    fontWeight="bold"
                    marginBottom="10px"
                >
                    Edit Table
                </Typography>
            </React.Fragment>
        </BaseModal>
    );
};

export default EditTableModal;
