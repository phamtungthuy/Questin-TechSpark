import { Box } from "@mui/material";
import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { useTranslate } from "hooks/common-hook";
import CreateAgentModal from "./create-agent-modal";
import { useCallback, useState } from "react";

interface IProps extends Omit<IModalManagerChildrenProps, 'showModal'> {
    loading: boolean;
    onOk: (name: string, templatedId: string) => void;
    showModal?(): void;
}

const AgentTemplateModal = ({
    visible,
    hideModal,
    loading,
    onOk
}: IProps) => {
    const { t } = useTranslate('flow');
    const [checkedId, setCheckedId] = useState<string>("");
    
    const handleOk = useCallback(async (name: string) => {
        return onOk(name, checkedId)
    }, [onOk, checkedId]);



    return (<BaseModal
        title={t('createGraph')}
        open={visible}
        onClose={hideModal}
        onOk={() => {}}
        sx={{
            width: "100vw",
            height: "100vh"
        }}
    >
        <Box>
            <CreateAgentModal 
                visible={false}
                hideModal={hideModal}
                loading={loading}
                onOk={handleOk}
            />
        </Box>
    </BaseModal>)
}

export default AgentTemplateModal;