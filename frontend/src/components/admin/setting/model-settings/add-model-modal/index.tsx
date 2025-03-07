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
import { IModalManagerChildrenProps } from "components/modal-manager";
import BaseModal from "components/base-modal";

interface SettingAddModelModalProps {
    open: boolean;
    onClose: () => void;
    modelProviderId: number;
}

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    loading: boolean;
    initialValue: string;
    llmFactory: string;
    onOk: (postBody: any) => void;
    showModal?(): void;
}

const SettingAddModelModal = ({
    visible,
    hideModal,
    llmFactory,
    loading,
    initialValue,
    onOk,
}: IProps) => {
    const [apiKey, setApiKey] = useState<string>("");
    const [baseUrl, setBaseUrl] = useState<string>("");
    const [modelName, setModelName] = useState<string>("");
    const [type, setType] = useState<string>("chat");

    const resetInput = () => {
        setBaseUrl("");
        setModelName("");
    };

    const handleOk = async () => {
        return onOk({
            llm_factory: llmFactory,
            llm_name: modelName,
            model_type: type,
            api_key: apiKey,
            api_base: baseUrl,
        })
    };

    return (
        <BaseModal
            title={"Add model"}
            open={visible}
            onClose={hideModal}
            onOk={handleOk}
        >
            <Box
                
            >
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
                        <Typography>Api key:</Typography>
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
                    <Box display="flex" alignItems="center">
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
                                <MenuItem value="chat">Chat</MenuItem>
                                <MenuItem value="embedding">Embedding</MenuItem>
                                <MenuItem value="rerank">Rerank</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Box>
        </BaseModal>
    );
};

export default SettingAddModelModal;
