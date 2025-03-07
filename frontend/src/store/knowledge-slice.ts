import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IKnowledge } from "interfaces/database/knowledge";

interface IKnowledgeState {
    knowledgeList: IKnowledge[] | null;
}

const initialState: IKnowledgeState = {
    knowledgeList: null
};

const knowledgeSlice = createSlice({
    name: "knowledge",
    initialState,
    reducers: {
        setKnowledgeList: (state, action: PayloadAction<{
            knowledgeList: IKnowledge[];
        }>) => {
            const { knowledgeList } = action.payload;
            state.knowledgeList = knowledgeList;
        },
        setKnowledge: (state, action: PayloadAction<{
            knowledge: IKnowledge
        }>) => {
            if (!state.knowledgeList) state.knowledgeList = [];
            const { knowledge } = action.payload;

            const index = state.knowledgeList.findIndex(
                (kb) => kb.id === knowledge.id
            );
            if (index !== -1) {
                state.knowledgeList[index] = knowledge;
            } else {
                state.knowledgeList.unshift(knowledge);
            }
        },
        removeKnowledge: (state, action: PayloadAction<{
            kb_ids: string[];
        }>) => {
            if (!state.knowledgeList) state.knowledgeList = [];
            const { kb_ids } = action.payload;
            state.knowledgeList = state.knowledgeList.filter(kb => !kb_ids.includes(kb.id));
        }
    },
});

export const {
    setKnowledgeList,
    setKnowledge,
    removeKnowledge
} = knowledgeSlice.actions;

export default knowledgeSlice.reducer;
