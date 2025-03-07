import { Box } from "@mui/material";
import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
  loading: boolean;
  onOk: (name: string) => void;
}

const CreateAgentModal = ({ visible, hideModal, loading, onOk }: IProps) => {
  const handleOk = async () => {
    return onOk("asdsad");
  };

  return (
    <BaseModal
      title={"Create New Agent Flow"}
      open={visible}
      onOk={onOk}
      onClose={hideModal}
    >
      <Box></Box>
    </BaseModal>
  );
};

export default CreateAgentModal;
