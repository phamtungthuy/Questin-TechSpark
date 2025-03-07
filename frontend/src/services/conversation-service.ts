import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    setConversation,
    listConversation,
    removeConversation,
    completion,
    completionSql,
    completionTitle
} = api;

const methods = {
    listConversation: {
        url: listConversation,
        method: 'get'
    },
    setConversation: {
        url: setConversation,
        method: 'post'
    },
    removeConversation: {
        url: removeConversation,
        method: 'post'
    },
    completion: {
        url: completion,
        method: 'post'
    },
    completionSql: {
        url: completionSql,
        method: 'post'
    },
    completionTitle: {
        url: completionTitle,
        method: 'post'
    }
} as const;

const conversationService = registerServer<keyof typeof methods>(methods, request);

export default conversationService;