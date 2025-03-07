import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    listDocument,
    uploadDocument,
    runDocument,
    removeDocument,
    changeDocumentParser
} = api;

const methods = {
    listDocument: {
        url: listDocument,
        method: 'get'
    },
    uploadDocument: {
        url: uploadDocument,
        method: 'post'
    },
    runDocument: {
        url: runDocument,
        method: 'post'
    },
    removeDocument: {
        url: removeDocument,
        method: 'post'
    },
    changeDocumentParser: {
        url: changeDocumentParser,
        method: 'post'
    }
} as const;

const documentService = registerServer<keyof typeof methods>(methods, request);

export default documentService;