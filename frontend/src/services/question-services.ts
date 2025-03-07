import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    listQuestion, searchQuestion
} = api;

const methods = {
    listQuestion: {
        url: listQuestion,
        method: 'get'
    },
    searchQuestion: {
        url: searchQuestion,
        method: 'get'
    }
} as const;

const questionService = registerServer<keyof typeof methods>(methods, request);

export default questionService;

