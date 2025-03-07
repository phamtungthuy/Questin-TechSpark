import { Box } from "@mui/material";
import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    onOk: (params: any) => void;
}

const RemoveModelModal = ({ visible,
    hideModal,
    onOk
}: IProps) => {
    return (<BaseModal
        title={"Remove Model"}
        open={visible}
        onOk={onOk}
        onClose={hideModal}
    >
        <Box>

        </Box>
    </BaseModal>)  
};

export default RemoveModelModal;