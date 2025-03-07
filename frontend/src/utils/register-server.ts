import omit from "lodash/omit";
import { AxiosInstance } from "axios";

type Service<T extends string> = Record<
    T,
    (params?: any, urlAppendix?: string) => any
>;

const Methods = ["post", "delete", "put"];

const registerServer = <T extends string>(
    opt: Record<T, { url: string; method: string }>,
    request: AxiosInstance
) => {
    const server: Service<T> = {} as Service<T>;

    for (let key in opt) {
        server[key] = (params?: any, urlAppendix?: string) => {
            let url = opt[key].url;
            const requestOptions = opt[key];
            if (urlAppendix) {
                url += `/${urlAppendix}`;
            }

            const method = requestOptions.method.toLowerCase();
            if (Methods.includes(method)) {
                return request({
                    url,
                    method,
                    data: params,
                });
            }

            if (method === "get") {
                return request.get(url, {
                    ...omit(requestOptions, ["method", "url"]),
                    params,
                });
            }
        };
    }

    return server;
};

export default registerServer;
