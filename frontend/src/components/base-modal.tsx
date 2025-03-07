import {
    Box,
    Button,
    IconButton,
    Modal,
    SxProps,
    Typography,
} from "@mui/material";
import React from "react";
import ClearIcon from "@mui/icons-material/Clear";

interface IProps {
    open: boolean;
    onClose: () => void;
    onOk: (params?: any) => void;
    children: React.ReactElement;
    title: string;
    sx?: SxProps;
}

const BaseModal: React.FC<IProps> = ({
    open,
    onClose,
    onOk,
    children,
    title,
    sx,
}) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    ...{
                        position: "absolute",
                        top: "10%",
                        left: "50%",
                        transform: "translateX( -50%)",
                        width: 500,
                        bgcolor: "background.paper",
                        borderRadius: "10px",
                        padding: "20px 32px",
                        display: "flex",
                        flexDirection: "column",
                    },
                    ...sx,
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
                    marginBottom="10px"
                >
                    {title}
                </Typography>
                    {children}
                <Box
                    marginTop="30px"
                    display="flex"
                    justifyContent="flex-end"
                    gap="10px"
                >
                    <Button
                        sx={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            fontWeight: "medium",
                            paddingY: "4px",
                            color: "#000",
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        sx={{
                            borderRadius: "8px",
                            backgroundColor: "#1677ff",
                            color: "#fff",
                            fontWeight: "medium",
                            paddingY: "4px",
                            "&:hover": {
                                backgroundColor: "#1677ff",
                            },
                        }}
                        onClick={() => {
                            onOk();
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

export default BaseModal;
