import { useSetModalState } from "hooks/common-hook";
import { useFetchManualDialog, useSetNextDialog } from "hooks/dialog-hook";
import { IDialog } from "interfaces/database/dialog";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import dialogService from "services/dialog-service";
import {
    setDialogList,
    setDialog,
    removeDialog,
} from "store/dialog-slice";
import { AppDispatch, RootState } from "store/store";
import { toast } from "react-toastify";


export const useEditDialog = () => {
    const [dialog, setDialog] = useState<IDialog>({} as IDialog);
    const { fetchDialog } = useFetchManualDialog();
    const { setDialog: submitDialog, loading } = useSetNextDialog();

    const {
        visible: dialogEditVisible,
        hideModal: hideDialogEditModal,
        showModal: showDialogEditModal,
    } = useSetModalState();

    const hideModal = useCallback(() => {
        setDialog({} as IDialog);
        hideDialogEditModal();
    }, [hideDialogEditModal]);

    const onDialogEditOk = useCallback(
        async (dialog: IDialog) => {
            const data = await submitDialog(dialog);
            if (data.retcode === 0) {
                hideModal();
            }
        },
        [submitDialog, hideModal]
    );

    const handleShowDialogEditModal = useCallback(
        async (dialogId?: string) => {
            if (dialogId) {
                const data = await fetchDialog(dialogId);
                if (data.retcode === 0) {
                    setDialog({
                        ...data.data,
                        dialog_id: dialogId
                    });
                }
            }
            showDialogEditModal();
        },
        [showDialogEditModal, fetchDialog]
    );
    
    const clearDialog = useCallback(() => {
        setDialog({} as IDialog);
    }, []);

    return {
        dialogSettingLoading: loading,
        initialDialog: dialog,
        onDialogEditOk,
        dialogEditVisible,
        hideDialogEditModal: hideModal,
        showDialogEditModal: handleShowDialogEditModal,
        clearDialog
    }
};

export const useRemoveDialog = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["removeDialog"],
        mutationFn: async (dialogIds: string[]) => {
            const { data } = await dialogService.removeDialog({
                dialogIds,
            });
            if (data.retcode === 0) {
                await dispatch(removeDialog({ dialog_ids: dialogIds }));
                toast.success("Xóa dialog thành công");
                queryClient.invalidateQueries({
                    queryKey: ["fetchDialogList"],
                });
            }
            return data.retcode;
        },
    });

    return { data, loading, removeDialog: mutateAsync };
};
