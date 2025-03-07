import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    listCluster,
    setCluster,
    removeCluster
} = api;

const methods = {
    listCluster: {
        url: listCluster,
        method: 'get'
    },
    setCluster: {
        url: setCluster,
        method: 'post'
    },
    removeCluster: {
        url: removeCluster,
        method: 'post'
    }
} as const;

const clusterService = registerServer<keyof typeof methods>(methods, request);

export default clusterService;
