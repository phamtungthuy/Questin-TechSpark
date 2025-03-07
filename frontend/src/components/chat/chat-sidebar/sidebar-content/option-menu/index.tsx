import { Box, Stack, Typography } from "@mui/material";
import MenuButton from "components/menu-button";
import { Avatar, getAvatarFallback } from "components/ui/avatar";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import authorizationUtil from "utils/authorization-util";
import { Menu } from "components/ui/menu";
import { TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import RemoveAllConversationsModal from "./remove-all-conversations-modal";
import { useSetModalState, useTranslate } from "hooks/common-hook";
import InConversationSettingsModal from "./in-conversation-settings-modal";

const OptionMenu = () => {
    const user = JSON.parse(
        authorizationUtil.getUserInfo() ||
            '{"avatar": null,"name": "Anonymous","email": ""}'
    );
    const { t } = useTranslate("conversation");

    const {
        visible: removeAllConversationVisible,
        showModal: showRemoveAllConversationModal,
        hideModal: hideRemoveAllConversationModal,
    } = useSetModalState();

    const {
        visible: inConversationSettingsVisible,
        showModal: showInConversationSettingsModal,
        hideModal: hideInConversationSettingsModal,
    } = useSetModalState();
    

    const menuItems = [
        {
            icon: <Cog6ToothIcon className="h-5 w-5" />,
            label: t("settings"),
            onClick: showInConversationSettingsModal,
        },
        {
            icon: <TrashIcon className="h-5 w-5" />,
            label: t("deleteAllConversations"),
            onClick: showRemoveAllConversationModal,
        },
    ];

    return (
        <Stack
            direction="row"
            sx={{
                paddingY: 2,
                gap: 1,
                alignItems: "center",
                borderTop: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                maxWidth: "100%",
            }}
        >

            <RemoveAllConversationsModal
                visible={removeAllConversationVisible}
                hideModal={hideRemoveAllConversationModal}
            />
            <InConversationSettingsModal 
                visible={inConversationSettingsVisible}
                hideModal={hideInConversationSettingsModal}
            />
            <Avatar
                sizes="small"
                fallback={getAvatarFallback(user.name)}
                src={user.avatar}
                sx={{ width: 36, height: 36 }}
            />
            <Box sx={{ mr: "auto" }}>
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, lineHeight: "16px" }}
                >
                    {user.name}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        maxWidth: "100px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                    }}
                >
                    {user.email}
                </Typography>
            </Box>
            <Menu
                items={menuItems}
                trigger={
                    <MenuButton>
                        <MoreVertIcon />
                    </MenuButton>
                }
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                paperPosition={false}
            />
        </Stack>
    );
};

export default OptionMenu;
