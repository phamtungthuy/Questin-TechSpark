import { configureStore } from "@reduxjs/toolkit";
import messageReducer from "./message-slice";
import conversationReducer from "./conversation-slice";
import knowledgeReducer from "./knowledge-slice";
import dialogReducer from "./dialog-slice";
import clusterReducer from "./cluster-slice";
import llmReducer from "./llm-slice";

export const store = configureStore({
  reducer: {
    message: messageReducer,
    conversation: conversationReducer,
    knowledge: knowledgeReducer,
    dialog: dialogReducer,
    cluster: clusterReducer,
    llm: llmReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
