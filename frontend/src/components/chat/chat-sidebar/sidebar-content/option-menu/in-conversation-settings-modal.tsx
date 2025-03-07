import { Box, Button, Divider, Typography, useTheme } from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { Dialog } from "components/ui/dialog";
import LanguageSelect from "locales/language-select";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ColorModeSelect from "theme/color-mode-select";
import authorizationUtil from 'utils/authorization-util';

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {}

const InConversationSettingsModal = ({ visible, hideModal }: IProps) => {
    const { t } = useTranslation("");
    const [selectedTab, setSelectedTab] = useState<"general" | "profile">("general");
    const theme  = useTheme();
    const user = JSON.parse(
        authorizationUtil.getUserInfo() ||
            '{"avatar": null,"name": "Anonymous","email": ""}'
    );
    return (
        <Dialog
            title={t("setting.settings")}
            visible={visible}
            hideModal={hideModal}
            footer={false}
        >
            <Box display="flex" flexDirection="column" gap={3}>
                {/* Phần tab selection */}
                <Box display="flex" width="100%" gap={1}>
                    <Button 
                        fullWidth
                        onClick={() => setSelectedTab("general")}
                        sx={{
                            backgroundColor: selectedTab === "general" ? theme.palette.action.selected : ""
                        }}
                    >
                        {t("setting.general")}
                    </Button>
                    <Button 
                        fullWidth
                        onClick={() => setSelectedTab("profile")}
                        sx={{
                            backgroundColor: selectedTab === "profile" ? theme.palette.action.selected : ""
                        }}
                    >
                        {t("setting.profile")}
                    </Button>
                </Box>

                {/* Nội dung theo tab */}
                {selectedTab === "general" ? (
                    <>
                        <Box display="flex" alignItems="center">
                            <Typography flex={1}>{t("common.language")}</Typography>
                            <LanguageSelect />
                        </Box>
                        <Box display="flex" alignItems="center">
                            <Typography flex={1}>{t("common.theme")}</Typography>
                            <ColorModeSelect />
                        </Box>
                    </>
                ) : (
                    /* Thêm nội dung cho tab profile */
                    <>
                        <Box display="flex" alignContent="center">
                            <Typography flex={1}>{t("setting.username")}</Typography>
                            <Typography>{user.name}</Typography>
                        </Box>
                        <Divider />
                        <Box display="flex" alignContent="center">
                            <Typography flex={1}>{t("setting.email")}</Typography>
                            <Typography >{user.email}</Typography>
                        </Box>
                    </>
                )}
            </Box>
        </Dialog>
    );
};

export default InConversationSettingsModal;
