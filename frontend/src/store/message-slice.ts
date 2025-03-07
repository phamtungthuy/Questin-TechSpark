import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageStatus } from "constants/message";
import {
    IMessageAnswer,
    IMessageQA,
    IMessage,
} from "interfaces/database/conversation";

interface IMessageState {
    messageListRecord: Record<string, IMessage[]>;
}

const initialState: IMessageState = {
    messageListRecord: {},
};

const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {
        setMessageItem: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                messages: IMessage[];
                replace?: true;
            }>
        ) => {
            const { conversation_id, messages, replace } = action.payload;
            if (replace) {
                state.messageListRecord[conversation_id] = messages;
                return;
            }
            const messageItems = state.messageListRecord[conversation_id] || [];
            messages.forEach((message) => {
                const index = messageItems.findIndex(
                    (msg) => msg.id === message.id
                );
                if (index !== -1) {
                    messageItems[index] = message;
                } else {
                    messageItems.unshift(message);
                }
            });
            state.messageListRecord[conversation_id] = messageItems;
        },
        addMessageItem: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                messages: IMessage[];
            }>
        ) => {
            const { conversation_id, messages } = action.payload;
            const messageItems = state.messageListRecord[conversation_id] || [];
            state.messageListRecord[conversation_id] = [
                ...messages,
                ...messageItems,
            ];
        },
        setMessageQA: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                message_id: string;
                qas: IMessageQA[];
            }>
        ) => {
            const { conversation_id, message_id, qas } = action.payload;
            const messageItems = state.messageListRecord[conversation_id] || {};
            const index = messageItems.findIndex(
                (msg) => msg.id === message_id
            );
            if (index !== -1) {
                messageItems[index].qas = qas;
            }
        },
        addMessageQA: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                message_id: string;
                qas: IMessageQA[];
            }>
        ) => {
            const { conversation_id, message_id, qas } = action.payload;
            const messageItems = state.messageListRecord[conversation_id] || {};
            const index = messageItems.findIndex(
                (msg) => msg.id === message_id
            );
            if (index !== -1) {
                messageItems[index].qas = [...messageItems[index].qas, ...qas];
            }
        },
        setMessageAnswer: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                message_id: string;
                qa_id: string;
                answer: IMessageAnswer[];
                replace?: true;
            }>
        ) => {
            const { conversation_id, message_id, qa_id, answer, replace = true } =
                action.payload;
            const messageItems = state.messageListRecord[conversation_id] || [];
            if (messageItems.length > 0 && replace) {
                if (messageItems[0].id === MessageStatus.Temporary) {
                    messageItems[0] = {
                        id: message_id,
                        message_id: message_id,
                        create_time: Date.now(),
                        create_date: new Date().toISOString(),
                        update_time: Date.now(),
                        update_date: new Date().toISOString(),
                        qas: [
                            {
                                id: qa_id,
                                message_id: message_id,
                                create_time: Date.now(),
                                create_date: new Date().toISOString(),
                                update_time: Date.now(),
                                update_date: new Date().toISOString(),
                                question: messageItems[0]["qas"][0]["question"],
                                answer: answer,
                            },
                        ],
                    };
                } else {
                    const qas = messageItems[0].qas || [];
                    if (qas.length > 0) {
                        const ans = messageItems[0].qas[qas.length - 1].answer;
                        ans[ans.length - 1] = answer[0];

                    }
                }
            } else {
                const index = messageItems.findIndex(
                    (msg) => msg.id === message_id
                );
                if (index !== -1) {
                    const qaIndex = messageItems[index].qas.findIndex(
                        (qa) => qa.id === qa_id
                    );
                    if (qaIndex !== -1) {
                        messageItems[index].qas[qaIndex].answer = answer;
                    } else {
                        messageItems[index].qas.push({
                            id: qa_id,
                            message_id: message_id,
                            create_time: Date.now(),
                            create_date: new Date().toISOString(),
                            update_time: Date.now(),
                            update_date: new Date().toISOString(),
                            question: "",
                            answer: answer,
                        });
                    }
                }
            }
        },
        addMessageAnswer: (
            state,
            action: PayloadAction<{
                conversation_id: string;
                message_id: string;
                qa_id: string;
                answer: IMessageAnswer[];
            }>
        ) => {
            const { conversation_id, message_id, qa_id, answer } =
                action.payload;
            const messageItems = state.messageListRecord[conversation_id] || {};
            const index = messageItems.findIndex(
                (msg) => msg.id === message_id
            );
            if (index !== -1) {
                const qaIndex = messageItems[index].qas.findIndex(
                    (qa) => qa.id === qa_id
                );
                if (qaIndex !== -1) {
                    messageItems[index].qas[qaIndex].answer = [
                        ...messageItems[index].qas[qaIndex].answer,
                        ...answer,
                    ];

                }
            }
        },
    },
});

export const {
    setMessageItem,
    addMessageItem,
    setMessageQA,
    addMessageQA,
    setMessageAnswer,
    addMessageAnswer,
} = messageSlice.actions;

export default messageSlice.reducer;
