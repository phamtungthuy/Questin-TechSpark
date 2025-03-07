import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IConversation } from "interfaces/database/conversation";

interface IConversationState {
    conversationListRecord: Record<string, IConversation[]>;
}

const initialState: IConversationState = {
    conversationListRecord: {},
};

const conversationSlice = createSlice({
    name: "conversation",
    initialState,
    reducers: {
        updateConversationList: (
            state,
            action: PayloadAction<{
                dialog_id: string;
                conversationList: IConversation[];
            }>
        ) => {
            const { dialog_id, conversationList } = action.payload;
            state.conversationListRecord[dialog_id] = conversationList;
        },
        updateConversation: (
            state,
            action: PayloadAction<{
                dialog_id: string;
                conversation: IConversation;
            }>
        ) => {
            const { dialog_id, conversation } = action.payload;
            if (state.conversationListRecord[dialog_id]) {
                const index = state.conversationListRecord[dialog_id].findIndex(
                    (conv) => conv.id === conversation.id
                );
                if (index !== -1) {
                    state.conversationListRecord[dialog_id][index] = {
                        ...state.conversationListRecord[dialog_id][index],
                        ...conversation
                    };
                } else {
                    state.conversationListRecord[dialog_id].unshift(conversation);
                }
            } else {
                state.conversationListRecord[dialog_id] = []
            }
        },
        removeConversationList: (
            state,
            action: PayloadAction<{
                dialog_id: string;
                conversation_ids: string[];
            }>
        ) => {
            const { dialog_id, conversation_ids } = action.payload;

            state.conversationListRecord[dialog_id] =
                state.conversationListRecord[dialog_id].filter(
                    (conv) => !conversation_ids.includes(conv.id)
                );
        },
    },
});

export const {
    updateConversationList,
    updateConversation,
    removeConversationList,
} = conversationSlice.actions;

export default conversationSlice.reducer;
