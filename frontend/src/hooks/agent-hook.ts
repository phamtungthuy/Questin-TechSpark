import { useSetModalState } from "./common-hook";

export const useSaveAgentFlow = () => {
    const {
      visible,
      hideModal,
      showModal
    }= useSetModalState();
    return {
      visible,
      hideModal,
      showModal
    }
  }
  
  