import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const { listKnowledge, setKnowledge, getKnowledge, removeKnowledge } = api;

const methods = {
    listKnowledge: {
        url: listKnowledge,
        method: "get",
    },
    setKnowledge: {
        url: setKnowledge,
        method: "post",
    },
    getKnowledge: {
        url: getKnowledge,
        method: "get"
    },
    rmKb: {
        url: removeKnowledge,
        method: "post"
    }
} as const;

const kbService = registerServer<keyof typeof methods>(methods, request);

export default kbService;
