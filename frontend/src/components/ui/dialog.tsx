import { IModalManagerChildrenProps } from "components/modal-manager";
import React from "react";
import {
    Button,
    Dialog as MuiDialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    styled,
    Box,
    CircularProgress,
    Typography,
    SxProps,
} from "@mui/material";
import { Cross1Icon } from "@radix-ui/react-icons";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    onOk?: (params?: any) => void;
    title: string;
    children: React.ReactElement;
    loading?: boolean;
    footer?: boolean;
    sx?: SxProps
}

const BootstrapDialog = styled(MuiDialog)(({ theme }) => ({
    "& .MuiDialogContent-root": {
        padding: theme.spacing(2),
        minWidth: 400
    },
    "& .MuiDialogActions-root": {
        padding: theme.spacing(1),
    },
}));

export const Dialog = ({
    visible,
    hideModal,
    onOk,
    title,
    children,
    loading = false,
    footer = true,
    sx
}: IProps) => {

    return (
        <BootstrapDialog
            open={visible}
            onClose={hideModal}
            sx={sx}
        >
            <DialogTitle>{title}</DialogTitle>
            <IconButton
                aria-label="close"
                onClick={hideModal}
                sx={(theme) => ({
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                    border: 0
                })}
            >
                <Cross1Icon className="h-4 w-4" />
            </IconButton>
            <DialogContent
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    width: "100%",
                }}
            >
                {children}
            </DialogContent>
            {footer && (
                <DialogActions sx={{ pb: 3, px: 3 }}>
                    <Button onClick={hideModal}>Cancel</Button>
                    <Button variant="contained" onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
                        event.preventDefault();
                        if (onOk) {
                            await onOk();
                        }
                        hideModal();
                    }}>
                        {loading ? (
                            <Box display="flex" gap="4px" alignItems="center">
                                <CircularProgress size="12px" />
                                <Typography>OK</Typography>
                            </Box>
                        ) : 'OK'}
                    </Button>
                </DialogActions>
            )}
        </BootstrapDialog>
    );
};
