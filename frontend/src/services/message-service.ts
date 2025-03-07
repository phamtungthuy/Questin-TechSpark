import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    listMessage,
    feedbackMessage,
    setQAMessage,
    feebackGuestMessage,
    listShareMessage
} = api;

const methods = {
    listMessage: {
        url: listMessage,
        method: 'get'
    },
    feedback: {
        url: feedbackMessage,
        method: 'post'
    },
    setQAMessage: {
        url:  setQAMessage,
        method: 'post'
    },
    feedbackGuestMessage: {
        url: feebackGuestMessage,
        method: 'post'
    },
    listShareMessage: {
        url: listShareMessage,
        method: 'get'
    }
} as const;

const messageService = registerServer<keyof typeof methods>(methods, request);

export default messageService;