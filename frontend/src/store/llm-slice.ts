import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILLM } from "interfaces/database/llm";

interface ILLMState {
  llmList: ILLM[] | null;
}

const initialState: ILLMState = {
  llmList: null,
};

const llmSlice = createSlice({
  name: "llm",
  initialState,
  reducers: {
    setLLMList: (
      state,
      action: PayloadAction<{
        llmList: ILLM[];
      }>
    ) => {
      const { llmList } = action.payload;
      state.llmList = llmList;
    },
  },
});

export const { setLLMList } = llmSlice.actions;

export default llmSlice.reducer;
