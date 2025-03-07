import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const { testChunkRetrieval } = api;

const methods = {
    testChunkRetrieval: {
        url: testChunkRetrieval,
        method: "post",
    },
} as const;

const chunkService = registerServer<keyof typeof methods>(methods, request);

export default chunkService;
