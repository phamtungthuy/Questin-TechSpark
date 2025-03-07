import {
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";

interface SettingAddModelProviderModalProps {
    open: boolean;
    onClose: () => void;
    name: string;
    description: string;
}

const SettingAddModelProviderModal = ({
    open,
    onClose,
    name,
    description
}: SettingAddModelProviderModalProps) => {
    const [apiKey, setApiKey] = useState<string>("");
    const dispatch = useDispatch<AppDispatch>();
    return (
        <Modal open={open} onClose={onClose}>
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
                    Modify
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
                        fullWidth
                        inputProps={{
                            style: {
                                padding: 5,
                            },
                        }}
                        onChange={(e) => setApiKey(e.target.value)}
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
                            
                            onClose()
                        }}
                    >
                        {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                        OK
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default SettingAddModelProviderModal;
