import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import userService from "services/user-service";
import { toast } from "react-toastify";
import authorizationUtil from "utils/authorization-util";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export interface ILoginRequestBody {
    email: string;
    password: string;
}

export interface IRegisterRequestBody extends ILoginRequestBody {
    nickname: string;
}

export const useLoginWithGoogle = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["login"],
        mutationFn: async (params: { redirect_uri: string; code: string }) => {
            const response = await userService.googleLogin(params);
            const res = response.data;

            if (res.retcode === 0) {
                const { data } = res;
                toast.success(t("message.logged"));
                const authorization = response.headers.get("authorization");
                const token = data.access_token;
                const isAdmin = data.is_superuser;
                const userInfo = {
                    avatar: data.avatar,
                    name: data.nickname,
                    email: data.email,
                };
                authorizationUtil.setItems({
                    Authorization: authorization,
                    userInfo: JSON.stringify(userInfo),
                    Token: token,
                    isAdmin: isAdmin,
                });
                navigate("/")
                
            }
            return res.retcode;
        },
    });

    return { data, loading, googleLogin: mutateAsync };
};

export const useLogin = () => {
    const { t } = useTranslation();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["login"],
        mutationFn: async (params: { email: string; password: string }) => {
            const response = await userService.login(params);
            const res = response.data;

            if (res.retcode === 0) {
                const { data } = res;
                toast.success(t("message.logged"));
                const authorization = response.headers.get("authorization");
                const token = data.access_token;
                const isAdmin = data.is_superuser;
                const userInfo = {
                    avatar: data.avatar,
                    name: data.nickname,
                    email: data.email,
                };
                authorizationUtil.setItems({
                    Authorization: authorization,
                    userInfo: JSON.stringify(userInfo),
                    Token: token,
                    isAdmin: isAdmin,
                });
            }
            return res.retcode;
        },
    });

    return { data, loading, login: mutateAsync };
};

export const useRegister = () => {
    const { t } = useTranslation();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["register"],
        mutationFn: async (params: {
            email: string;
            password: string;
            nickname: string;
        }) => {
            const { data = {} } = await userService.register(params);
            if (data.retcode === 0) {
                toast.success(t("message.registered"));
            }
            return data.retcode;
        },
    });

    return { data, loading, register: mutateAsync };
};

export const useAuth = () => {
    const [isLogin, setIsLogin] = useState<boolean | null>(null);

    useEffect(() => {
        setIsLogin(!!authorizationUtil.getAuthorization());
    }, []);

    return { isLogin };
};

export const useAdminAuth = () => {
    const [isLogin, setIsLogin] = useState<boolean | null>(null);
    useEffect(() => {
        setIsLogin(!!authorizationUtil.getIsAdmin());
    }, []);

    return { isLogin };
};
