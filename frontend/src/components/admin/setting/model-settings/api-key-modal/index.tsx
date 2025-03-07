import { IModalManagerChildrenProps } from "components/modal-manager";
import { ApiKeyPostBody } from "../interface";
import BaseModal from "components/base-modal";
import { useTranslate } from "hooks/common-hook";
import { Box, FormControl, TextField, Typography } from "@mui/material";
import { useState } from "react";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    loading: boolean;
    initialValue: string;
    llmFactory: string;
    onOk: (postBody: ApiKeyPostBody) => void;
    showModal?(): void;
}

const ApiKeyModal = ({
    visible,
    hideModal,
    llmFactory,
    loading,
    initialValue,
    onOk,
}: IProps) => {
    const { t } = useTranslate("setting");
    const [apiKey, setApiKey] = useState<string>("");
    
    const handleOk = async () => {
        console.log({
            api_key: apiKey,
            llm_factory: llmFactory
        })
        return onOk({
            api_key: apiKey,
            llm_factory: llmFactory
        })
    };

    return (
        <BaseModal
            title={t("modify")}
            onClose={hideModal}
            open={visible}
            onOk={handleOk}
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
        </BaseModal>
    );
};

export default ApiKeyModal;