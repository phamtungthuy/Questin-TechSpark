import { OutlinedInput, Typography } from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { Dialog } from "components/ui/dialog";
import { useTranslate } from "hooks/common-hook";
import { useState } from "react";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    onOk: (params?: any) => void;
    name: string;
}

const SetConversationTitleModal = ({
    visible,
    hideModal,
    onOk,
    name,
}: IProps) => {
    const { t } = useTranslate("conversation");
    const [title, setTitle] = useState<string>(name);

    const handleOk = () => {
        onOk(title);
        hideModal();
    }

    return (<Dialog
        title={t("setConversationTitle")}
        visible={visible}
        hideModal={hideModal}
        onOk={handleOk}
    >
        <>
            <Typography>{t("setConversationTitleTip")}</Typography>
            <OutlinedInput 
                autoFocus
                required
                margin="dense"
                fullWidth
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                }}
            />
        </>
    </Dialog>)
}

export default SetConversationTitleModal;
