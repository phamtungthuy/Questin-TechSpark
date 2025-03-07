import {
    Avatar,
    Box,
    Divider,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { useState } from "react";
import AppsIcon from "@mui/icons-material/Apps";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import SettingApiKeyModal from "./api-key-modal";
import SettingAddModelModal from "./add-model-modal";
import settingsApis from "api/admin/setting-api";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import { LlmItem, useSelectLlmList } from "hooks/llm-hook";

interface ModelObjectProps {
    id: number;
    name: string;
    base_url: string;
    type: string;
}

interface SettingAddedModelProps {
    id: number;
    name: string;
    icon: string;
    description: string;
    models: Array<ModelObjectProps>;
}

interface IProps {
    item: LlmItem;
    clickApiKey: (llmFactory: string) => void;
}

const SettingAddedModel = ({
    id,
    name,
    icon,
    description,
    models,
}: SettingAddedModelProps) => {
    const [isShowModels, setIsShowModels] = useState(false);
    const [openSettingApiKeyModal, setOpenSettingApiKeyModal] = useState(false);
    const [openAddModelModal, setOpenAddModelModal] = useState(false);

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap="30px"
            padding="40px 30px"
            sx={{
                backgroundColor: "#e6e7eb",
                borderRadius: "20px",
            }}
        >
            <SettingApiKeyModal
                open={openSettingApiKeyModal}
                onClose={() => setOpenSettingApiKeyModal(false)}
                modelProviderId={id}
            />
            <SettingAddModelModal
                modelProviderId={id}
                open={openAddModelModal}
                onClose={() => setOpenAddModelModal(false)}
            />
            <Box width="100%" display="flex" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap="20px">
                    <Avatar src={icon} />
                    <Box>
                        <Typography fontWeight="bold">{name}</Typography>
                        <Typography>{description}</Typography>
                    </Box>
                </Box>
                <Box display="flex" flexDirection="column" gap="10px">
                    <Box display="flex" flexDirection="row" gap="10px">
                        <IconButton
                            sx={{
                                borderRadius: "10px",
                                backgroundColor: "#fff",
                                color: "#000",
                                padding: "5px 20px",
                                border: "1px solid #ccc",
                                "&:hover": {
                                    opacity: 0.7,
                                    backgroundColor: "#fff",
                                    color: "#000",
                                },
                            }}
                            onClick={() => setOpenSettingApiKeyModal(true)}
                        >
                            <Typography sx={{ marginRight: "10px" }}>
                                API-key
                            </Typography>
                            <SettingsIcon />
                        </IconButton>

                        <IconButton
                            sx={{
                                borderRadius: "10px",
                                backgroundColor: "#fff",
                                color: "#000",
                                padding: "5px 20px",
                                border: "1px solid #ccc",
                                "&:hover": {
                                    opacity: 0.7,
                                    backgroundColor: "#fff",
                                    color: "#000",
                                },
                            }}
                            onClick={() => setOpenAddModelModal(true)}
                        >
                            <Typography sx={{ marginRight: "10px" }}>
                                Add model
                            </Typography>
                            <AddIcon />
                        </IconButton>
                    </Box>
                    <IconButton
                        sx={{
                            borderRadius: "10px",
                            backgroundColor: "#fff",
                            color: "#000",
                            padding: "5px 20px",
                            border: "1px solid #ccc",
                            "&:hover": {
                                opacity: 0.7,
                                backgroundColor: "#fff",
                                color: "#000",
                            },
                        }}
                        onClick={() =>
                            setIsShowModels((isShowModels) => !isShowModels)
                        }
                    >
                        <Typography sx={{ marginRight: "10px" }}>
                            Show more models
                        </Typography>
                        <AppsIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box display={isShowModels ? "default" : "none"}>
                {models.map((model, idx) => (
                    <Box key={idx}>
                        <Box display="flex" gap="10px" alignItems="center">
                            <Tooltip title="model name">
                                <Typography>{model.name}</Typography>
                            </Tooltip>
                            <Tooltip title="base url">
                                <Typography
                                    sx={{
                                        backgroundColor: "#b8b8b8",
                                        color: "#fff",
                                        paddingX: "10px",
                                        borderRadius: "5px",
                                    }}
                                >
                                    {model.base_url}
                                </Typography>
                            </Tooltip>
                            <Tooltip title ="model type">
                                <Typography
                                    sx={{
                                        backgroundColor: "#dce2e6",
                                        paddingX: "10px",
                                        borderRadius: "5px",
                                    }}
                                >
                                    {model.type}
                                </Typography>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton onClick ={async () => {
                                    const response = await settingsApis.removeModel(model.id);
                                    if (response.status === 200) {

                                        if (models.length <= 1) {
                                            const removeModelProviderResponse = await settingsApis.removeModelProvider(id);

                                        }
                                    }
                                }}>
                                    <ClearIcon
                                        sx={{
                                            color: "red",
                                        }}
                                    />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Divider sx={{ marginY: "10px" }} />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default SettingAddedModel;
