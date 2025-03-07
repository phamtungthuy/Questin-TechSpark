import { Typography } from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { Dialog } from "components/ui/dialog";
import { useTranslate } from "hooks/common-hook";
import { useRemoveAllConversation } from "hooks/conversation-hook";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
}

const RemoveAllConversationsModal = ({ 
    visible,
    hideModal
} : IProps) => {
    const { t } = useTranslate("conversation");

    const { loading, removeAllConversation } = useRemoveAllConversation();
    return (<Dialog title={t("deleteAllConversations")}
        visible={visible}
        hideModal={hideModal}
        onOk={removeAllConversation}
        loading={loading}
    >
        <Typography color="error">
            {t("deleteAllConversationsTip")}
        </Typography>
    </Dialog>)
}

export default RemoveAllConversationsModal;