import { Typography } from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { Dialog } from "components/ui/dialog";
import { useTranslate } from "hooks/common-hook";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    onOk: (params?: any) => void;
    name: string;
}

const RemoveConversationModal = ({
    visible,
    hideModal,
    onOk,
    name,
}: IProps) => {
    const { t } = useTranslate("conversation");

    const handleOk = () => {
        onOk();
        hideModal();
    }

    return (
        <Dialog
            title={t("deleteConversation")}
            visible={visible}
            hideModal={hideModal}
            onOk={handleOk}
        >
            <Typography>
                {t("deleteConversationTip")}
                <br></br>
                <strong>{name}</strong>
            </Typography>
        </Dialog>
    );
};

export default RemoveConversationModal;
