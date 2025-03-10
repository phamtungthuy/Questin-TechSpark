import { Authorization, Token, UserInfo, IsAdmin } from "constants/authorization";

const KeySet = [Authorization, Token, UserInfo, IsAdmin];

const storage = {
    getAuthorization: () => {
        return localStorage.getItem(Authorization);
    },
    getToken: () => {
        return localStorage.getItem(Token);
    },
    getUserInfo: () => {
        return localStorage.getItem(UserInfo);
    },
    getIsAdmin: () => {
        return localStorage.getItem(IsAdmin) === "true";
    },
    setAuthorization: (value: string) => {
        localStorage.setItem(Authorization, value);
    },
    setToken: (value: string) => {
        localStorage.setItem(Token, value);
    },
    setUserInfo: (value: string | Record<string, unknown>) => {
        let valueStr =
            typeof value !== "string" ? JSON.stringify(value) : value;
        localStorage.setItem(UserInfo, valueStr);
    },
    setItems: (pairs: Record<string, string>) => {
        Object.entries(pairs).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    },
    removeAuthorization: () => {
        localStorage.removeItem(Authorization);
    },
    removeAll: () => {
        KeySet.forEach((x) => {
            localStorage.removeItem(x);
        });
    },
};

export default storage;
