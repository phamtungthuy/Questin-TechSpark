import {
    Box,
    Button,
    FormControl,
    IconButton,
    MenuItem,
    Modal,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useState } from "react";
import settingsApis from "api/admin/setting-api";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";

interface SettingAddModelModalProps {
    open: boolean;
    onClose: () => void;
    modelProviderId: number;
}

const SettingAddModelModal = ({
    open,
    onClose,
    modelProviderId,
}: SettingAddModelModalProps) => {
    const [baseUrl, setBaseUrl] = useState<string>("");
    const [modelName, setModelName] = useState<string>("");
    const dispatch = useDispatch<AppDispatch>();
    const [type, setType] = useState<string>("LLM");

    const resetInput = () => {
        setBaseUrl("");
        setModelName("");
    };

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
                    Add Model
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
                        <Typography>Base url:</Typography>
                    </Box>
                    <TextField
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
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
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginY="25px"
                >
                    <Box display="flex" alignItems="center" flex={1}>
                        <Typography color="red" marginRight="4px">
                            *
                        </Typography>
                        <Typography>Model name:</Typography>
                    </Box>
                    <TextField
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
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
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginY="25px"
                    gap="20px"
                >
                    <Box display="flex" alignItems="center" >
                        <Typography color="red" marginRight="4px">
                            *
                        </Typography>
                        <Typography>Model Type:</Typography>
                    </Box>
                    <Box flex="1">
                        <FormControl fullWidth variant="outlined" size="small">
                            <Select
                                MenuProps={{
                                    MenuListProps: {
                                        disablePadding: true,
                                    },
                                }}
                                value={type}
                                sx={{
                                    flex: 2,
                                    marginTop: "10px",
                                }}
                                onChange={(e) => {
                                    setType(e.target.value);
                                }}
                            >
                                <MenuItem value="LLM">LLM</MenuItem>
                                <MenuItem value="VLM">VLM</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
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
                            const response = await settingsApis.addModel({
                                base_url: baseUrl,
                                name: modelName,
                                type: type,
                                provider: modelProviderId,
                            });
                            if (response.status === 200) {
                            }
                            resetInput();
                            onClose();
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

export default SettingAddModelModal;
