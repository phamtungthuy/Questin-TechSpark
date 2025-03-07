import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IDialog } from "interfaces/database/dialog";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import dialogService from "services/dialog-service";
import { setDialog, setDialogList } from "store/dialog-slice";
import { AppDispatch, RootState } from "store/store";
import { useGetChatParams } from "./route-hook";
import { toast } from "react-toastify";

export const useFetchNextDialogList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const dialogList = useSelector(
        (state: RootState) => state.dialog.dialogList
    );
    const {
        data,
        isFetching: loading,
        refetch,
    } = useQuery<IDialog[]>({
        queryKey: ["fetchDialogList"],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async (...params) => {
            if (dialogList) {
                return dialogList;
            }

            const { data } = await dialogService.listDialog();

            if (data.retcode === 0) {
                const list: IDialog[] = data.data;
                dispatch(
                    setDialogList({
                        dialogList: list,
                    })
                );
                return list;
            }
            return [];
        },
    });

    return { data, loading, refetch };
};

export const useFetchManualDialog = () => {
    const dispatch = useDispatch<AppDispatch>();
    const dialogList = useSelector(
        (state: RootState) => state.dialog.dialogList
    );

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["fetchManualDialog"],
        gcTime: 0,
        mutationFn: async (dialogId: string) => {
            if (dialogList && dialogList.length > 0) {
                const dialog = dialogList.find((dia) => dia.id === dialogId);
                if (dialog) {
                    return dialog;
                }
            }
            const { data } = await dialogService.getDialog({ dialogId });
            if (data.retcode === 0) {
                await dispatch(
                    setDialog({
                        dialog: data.data
                    })
                )
                return data.data;
            }
            return {} as IDialog;
        },
    });

    return { data, loading, fetchDialog: mutateAsync };
};

export const useSetNextDialog = () => {
    const { dialogId } = useGetChatParams();
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["setDialog"],
        mutationFn: async (params: Record<string, any>) => {
            const { data } = await dialogService.setDialog({
                dialogId: dialogId,
                ...params,
            });
            if (data.retcode === 0) {
                toast.success("Created dialog successfully");
                await dispatch(
                    setDialog({
                        dialog: data.data,
                    })
                );
                queryClient.invalidateQueries({
                    queryKey: ["fetchDialogList"],
                });
            }
            return data;
        },
    });

    return { data, loading, setDialog: mutateAsync };
};
