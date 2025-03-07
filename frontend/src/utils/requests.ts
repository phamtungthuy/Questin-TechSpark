import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";
import i18n from "locales/config";
import { convertTheKeysOfTheObjectToSnake } from "./common-util";
import { toast } from "react-toastify";
import { ResponseType } from "interfaces/database/base";
import { Authorization } from "constants/authorization";
import authorizationUtil from "utils/authorization-util";
import { api_url } from "./api";

const FAILED_TO_FETCH = 'Failed to fetch';

const RetcodeMessage = {
    200: i18n.t("message.200"),
    201: i18n.t("message.201"),
    202: i18n.t("message.202"),
    204: i18n.t("message.204"),
    400: i18n.t("message.400"),
    401: i18n.t("message.401"),
    403: i18n.t("message.403"),
    404: i18n.t("message.404"),
    406: i18n.t("message.406"),
    410: i18n.t("message.410"),
    413: i18n.t("message.413"),
    422: i18n.t("message.422"),
    500: i18n.t("message.500"),
    502: i18n.t("message.502"),
    503: i18n.t("message.503"),
    504: i18n.t("message.504"),
};

type ResultCode =
    | 200
    | 201
    | 202
    | 204
    | 400
    | 401
    | 403
    | 404
    | 406
    | 410
    | 413
    | 422
    | 500
    | 502
    | 503
    | 504;

const request = axios.create({
    baseURL: api_url,
    timeout: 300000
});

const errorHandler = (error: AxiosError) => {
    const { response } = error;
    if (error.message === FAILED_TO_FETCH) {
        toast.error(
            "network error!"
        )
    } else {
        if (response && response.status) {
            const errorText =
            RetcodeMessage[response.status as ResultCode] || response.statusText;
            toast.error(errorText);
        }
    }
    return response;
}

request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (config.data) {
            config.data = convertTheKeysOfTheObjectToSnake(config.data);
        }
        if (config.params) {
            config.params = convertTheKeysOfTheObjectToSnake(config.params);
        }

        if (config.headers) {
            Object.keys(config.headers).forEach((key) => {
                config.headers.set(key, config.headers[key]);
            });
            config.headers.set(Authorization, `Bearer ${authorizationUtil.getToken()}`);
        }
        return config;
    },errorHandler);

request.interceptors.response.use(
    async (response: any) => {
        if (response.status === 413) {
            toast.error(RetcodeMessage[413]);
        } else if (response.status === 500) {
            toast.error(RetcodeMessage[500]);
        }

        if (response.config.responseType === "blob") {
            return response;
        }
        const data: ResponseType = response.data;
        if (data.retcode === 401 || data.retcode === 401) {
            await toast.error("Authorization has expired, please log in again");
            await authorizationUtil.removeAll();
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000)
        } else if (data.retcode !== 0) {
            toast.error(data.retmsg);
        }
        return response;
    }, errorHandler)

export default request;
