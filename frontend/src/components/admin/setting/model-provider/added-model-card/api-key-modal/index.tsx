import { Box, Button, IconButton, Modal, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import settingsApis from "api/admin/setting-api";
import { useState } from "react";
import { toast } from "react-toastify";

interface SettingApiKeyModalProps {
    open: boolean;
    onClose: () => void;
    modelProviderId: number;
}

const SettingApiKeyModal = ({open, onClose, modelProviderId}: SettingApiKeyModalProps) => {
    const [apiKey, setApiKey] = useState<string>("");

    return (<Modal
        open={open}
        onClose={onClose}
    >
        <Box
            sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
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
                Modifier
            </Typography>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginY="25px"
            >
                <Box display="flex" alignItems="center" flex={1}>
                    <Typography color="red" marginRight="4px">
                        *
                    </Typography>
                    <Typography>Api-key</Typography>
                </Box>
                <TextField
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    fullWidth
                    inputProps={{
                        style: {
                            padding: 5,
                        },
                    }}
                    sx={{
                        flex: 2,
                        marginLeft: "10px",
                    }}
                />
            </Box>
            <Box
                marginTop="30px"
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
                <Button
                    sx={{
                        borderRadius: "8px",
                        backgroundColor: "#1677ff",
                        color: "#fff",
                        fontWeight: "medium",
                        "&:hover": {
                            backgroundColor: "#1677ff",
                        },
                    }}
                    onClick={async () => {
                        const response = await settingsApis.updateApiKey(modelProviderId, {
                            "api_key": apiKey
                        });
                        if (response.status === 200) {
                            toast.success("Updated api key successfully!");
                        } else {
                            toast.error(response.data.message);
                        }
                        onClose();
                    }}
                >
                    {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                    OK
                </Button>
            </Box>
        </Box>
    </Modal>)
}

export default SettingApiKeyModal;