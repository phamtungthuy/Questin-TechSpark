import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IDialog } from "interfaces/database/dialog";

interface IDialogState {
    dialogList: IDialog[] | null;
}

const initialState: IDialogState = {
    dialogList: null
};

const dialogSlice = createSlice({
    name: "dialog",
    initialState,
    reducers: {
        setDialogList: (state, action: PayloadAction<{
            dialogList: IDialog[];
        }>) => {
            const { dialogList } = action.payload;
            state.dialogList = dialogList;
        },
        setDialog: (state, action: PayloadAction<{
            dialog: IDialog;
        }>) => {
            if (!state.dialogList) state.dialogList = [];
            const { dialog } = action.payload;

            const index = state.dialogList.findIndex(
                (dia) => dia.id === dialog.id
            );
            if (index !== -1) {
                state.dialogList[index] = dialog;
            } else {
                state.dialogList.unshift(dialog);
            }
        },
        removeDialog: (state, action: PayloadAction<{
            dialog_ids: string[];
        }>) => {
            if (!state.dialogList) state.dialogList = [];
            const { dialog_ids } = action.payload;
            state.dialogList = state.dialogList.filter(dialog => !dialog_ids.includes(dialog.id));
        }
    },
});

export const {
    setDialogList,
    setDialog,
    removeDialog
} = dialogSlice.actions;

export default dialogSlice.reducer;