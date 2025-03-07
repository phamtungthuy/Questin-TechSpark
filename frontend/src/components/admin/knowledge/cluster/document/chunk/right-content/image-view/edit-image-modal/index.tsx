import { Box, Typography } from "@mui/material";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

interface ImageProps {
    location: string;
    description: string;
    chunk_id: string;
}

interface EditImageModalProps extends BasicModalProps {
    image: ImageProps;
    setImage: (image: ImageProps) => void;
    update: () => void;
}

const EditImageModal: React.FC<EditImageModalProps> = ({
    open,
    onClose,
    image,
    setImage,
    update
}) => {
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");

    const handleDeleteImage = async () => {
        if (kb_id) {
            const response = await knowledgebaseChunkApi.deleteImage(kb_id, image.chunk_id, image.location);
            if (response.status === 200) {
                toast.success(response.data.message);
                setTimeout(update, 1000);
                onClose();
            } else {
                toast.error(response.data.message)
            }
        }
    }

    return (
        <BaseModal open={open} title="Edit Image" onClose={onClose} onOk={() => {}}>
            <React.Fragment>

                <Box display="flex">
                    <Box
                        border="1px solid #e0e0e0"
                        padding="4px 8px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "#dc4e41",
                            },
                        }}
                        onClick={handleDeleteImage}
                    >
                        Delete
                    </Box>
                    <Box></Box>
                </Box>
            </React.Fragment>
        </BaseModal>
    );
};

export default EditImageModal;
