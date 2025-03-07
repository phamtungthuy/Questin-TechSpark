import { Box, Button, IconButton, Modal, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import UploadFile from "./upload-file";
import UploadUrl from "./upload-url";
import { useUploadNextDocument } from "hooks/document-hook";
interface AddDocumentModalProps {
    open: boolean;
    onClose: () => void;
}

enum UploadMode {
    File = "file",
    Url = "url"
}

const AddDocumentModal = ({
    open,
    onClose,
}: AddDocumentModalProps) => {
    const { uploadDocument } = useUploadNextDocument();
    const [files, setFiles] = useState<Array<File>>([]);
    const [urls, setUrls] = useState<Array<string>>(["http"]);
    const [searchParams] = useSearchParams();
    const cluster_id = searchParams.get('cluster_id');
    const kb_id = searchParams.get('id');
    const [uploadType, setUploadType] = useState(UploadMode.File);

    const handleUpload = async () => {
        if (uploadType === UploadMode.File) {
            handleUploadFile();
        } else {
            handleUploadUrl();
        }
    }

    const handleUploadFile = async () => {
        uploadDocument(files);
    }

    const handleUploadUrl = async () => {
        if (kb_id && cluster_id) {
        }
    }

    const handleChangeUploadType = (
        event: React.MouseEvent<HTMLElement>,
        newType: UploadMode
    ) => {
        setUploadType(newType);
    };

    useEffect(() => {
        setFiles([])
    }, [open])

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 500,
                    bgcolor: "background.paper",
                    borderRadius: "10px",
                    padding: "20px 32px",
                }}
            >
                <IconButton
                    sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                    }}
                    onClick={onClose}
                >
                    <ClearIcon />
                </IconButton>
                <Typography
                    variant="h5"
                    component="h2"
                    fontSize="20px"
                    fontWeight="bold"
                >
                    Upload File
                </Typography>
                <ToggleButtonGroup
                    color="primary"
                    value={uploadType}
                    exclusive
                    onChange={handleChangeUploadType}
                    aria-label="Platform"
                    sx={{
                        fontSize: "12px",
                        marginY: "8px"
                    }}
                >
                    <ToggleButton
                        size="small"
                        value={UploadMode.File}
                        sx={{padding: "4px 8px", fontSize: "12px"}}
                    >
                        File
                    </ToggleButton>
                    <ToggleButton
                        size="small"
                        value={UploadMode.Url}
                        sx={{padding: "4px 8px", fontSize: "12px"}}
                    >
                        Url
                    </ToggleButton>
                </ToggleButtonGroup>
                {uploadType === UploadMode.File && 
                    <UploadFile 
                        files={files}
                        setFiles={setFiles}
                    />
                }
                {uploadType === UploadMode.Url &&
                    <UploadUrl 
                        urls={urls}
                        setUrls={setUrls}
                    />
                }
                <Box marginTop="30px"
                    display="flex"
                    gap="10px"
                    sx={{
                        float: "right",
                    }}
                >
                    <Button
                        sx={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            fontWeight: "medium",
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button sx={{
                            borderRadius: "8px",
                            backgroundColor: "#1677ff",
                            color: "#fff",
                            fontWeight: "medium",
                            "&:hover": {
                                backgroundColor: "#1677ff",
                            },
                        }}
                        onClick={() => {
                            handleUpload();
                            onClose();
                        }}    
                    >
                        OK
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddDocumentModal;
