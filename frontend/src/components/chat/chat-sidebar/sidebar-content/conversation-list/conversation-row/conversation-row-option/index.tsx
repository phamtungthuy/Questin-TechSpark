import { Box } from "@mui/material";
import React from "react";
import { PencilIcon, ShareIcon, TrashIcon} from "@heroicons/react/24/outline";
import {EllipsisHorizontalIcon} from "@heroicons/react/24/solid";
import { IConversation } from "interfaces/database/conversation";
import { useSetModalState, useTranslate } from "hooks/common-hook";
import { Menu } from "components/ui/menu";
import { useRemoveNextConversation, useSetNextConversation } from "hooks/conversation-hook";
import RemoveConversationModal from "./remove-conversation-modal";
import SetConversationTitleModal from "./set-title-modal";
import ShareConversationModal from "./share-conversation-modal";

interface ChatRowOptionProps extends IConversation {}

const ChatRowOption: React.FC<ChatRowOptionProps> = ({
    id,
    name,
    ...params
}) => {
    const { t } = useTranslate("common");
    const { removeConversation } = useRemoveNextConversation();
    const { setConversation } = useSetNextConversation();
    const {
        visible: removeConversationVisible,
        showModal: showRemoveConversationModal,
        hideModal: hideRemoveConversationModal,
    } = useSetModalState();

    const {
        visible: changeTitleVisible,
        showModal: showChangeTitleModal,
        hideModal: hideChangeTitleModal,
    } = useSetModalState();


    const {
        visible: shareConversationVisible,
        showModal: showShareConversationModal,
        hideModal: hideShareConversationModal,
    } = useSetModalState();



    const menuItems = [
        {
            icon: <PencilIcon className="h-4 w-4"/>,
            label: t("edit"),
            onClick: showChangeTitleModal,
        },
        {
            icon: <TrashIcon className="h-4 w-4" />,
            label: t("delete"),
            onClick: showRemoveConversationModal,
        },
        {
            icon: <ShareIcon className="h-4 w-4" />,
            label: t("share"),
            onClick: showShareConversationModal,
        }
    ];

    return (
        <Box width="24px">
            <SetConversationTitleModal 
                visible={changeTitleVisible}
                hideModal={hideChangeTitleModal}
                onOk={(name) => setConversation({ name: name,
                    conversation_id: id,
                    is_new: false
                 })}
                name={name}
            />
            <RemoveConversationModal
                visible={removeConversationVisible}
                hideModal={hideRemoveConversationModal}
                onOk={() => removeConversation([id])}
                name={name}
            />
            <ShareConversationModal 
                visible={shareConversationVisible}
                hideModal={hideShareConversationModal}
                id={id}
                name={name}
            />
            <Menu
                items={menuItems}
                trigger={
                    <EllipsisHorizontalIcon
                        className="h-5 w-5"
                        onMouseOver={(e) => (e.currentTarget.style.color = "#000")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#a6a6a6")}
                    />
                }
                paperPosition={false}
            />
            
        </Box>
    );
};

export default ChatRowOption;
