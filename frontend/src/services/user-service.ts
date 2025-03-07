import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const {
    login,
    register, 
    googleLogin,
    getTenantInfo
} = api;

const methods = {
    login: {
        url: login,
        method: 'post'
    },
    register: {
        url: register,
        method: 'post'
    },
    googleLogin: {
        url: googleLogin,
        method: 'get'
    },
    getTenantInfo: {
        url: getTenantInfo,
        method: 'get'
    }
} as const;

const userService = registerServer<keyof typeof methods>(methods, request);

export default userService;