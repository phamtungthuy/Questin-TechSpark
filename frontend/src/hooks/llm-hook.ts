import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResponseGetType } from "interfaces/database/base";
import { IFactory, ILLM, IMyLlmValue } from "interfaces/database/llm";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import llmService from "services/llm-services";
import { setLLMList } from "store/llm-slice";
import { AppDispatch, RootState } from "store/store";
import { sortLLmFactoryListBySpecifiedOrder } from "utils/common-util";

export const useFetchNextLLMList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const llmList = useSelector((state: RootState) => state.llm.llmList);
    const { data, isFetching: loading } = useQuery<ILLM[]>({
        queryKey: ["fetchLLMLList"],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            if (llmList) {
                return llmList;
            }

            const { data } = await llmService.listLLM();
            if (data.retcode === 0) {
                dispatch(
                    setLLMList({
                        llmList: data.data,
                    })
                );
                return data.data;
            }
            return data?.data || [];
        },
    });

    return { data, loading };
};

export type LlmItem = { name: string; logo: string } & IMyLlmValue;

export const useFetchMyLlmList = (): ResponseGetType<
    Record<string, IMyLlmValue>
> => {
    const { data, isFetching: loading } = useQuery({
        queryKey: ["myLlmList"],
        initialData: {},
        gcTime: 0,
        queryFn: async () => {
            const { data } = await llmService.myLLM();

            return data?.data ?? {};
        },
    });

    return { data, loading };
};

export const useFetchLlmFactoryList = (): ResponseGetType<IFactory[]> => {
    const { data, isFetching: loading } = useQuery({
        queryKey: ["factoryList"],
        initialData: [],
        gcTime: 0,
        queryFn: async () => {
            const { data } = await llmService.listFactory();

            return data?.data ?? [];
        },
    });

    return { data, loading };
};

export const useSelectLlmList = () => {
    const { data: myLlmList, loading: myLlmListLoading } = useFetchMyLlmList();
    const { data: factoryList, loading: factoryListLoading } =
        useFetchLlmFactoryList();

    const nextMyLlmList: Array<LlmItem> = useMemo(() => {
        return Object.entries(myLlmList).map(([key, value]) => ({
            name: key,
            logo: factoryList.find((x) => x.name === key)?.logo ?? "",
            ...value,
        }));
    }, [myLlmList, factoryList]);

    const nextFactoryList = useMemo(() => {
        const currentList = factoryList.filter((x) =>
            Object.keys(myLlmList).every((y) => y !== x.name)
        );
        return sortLLmFactoryListBySpecifiedOrder(currentList);
    }, [factoryList, myLlmList]);

    return {
        myLlmList: nextMyLlmList,
        factoryList: nextFactoryList,
        loading: myLlmListLoading || factoryListLoading,
    };
};

export interface IApiKeySavingParams {
    llm_factory: string;
    api_key: string;
    llm_name?: string;
    model_type?: string;
    base_url?: string;
}

export const useSaveApiKey = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["saveApiKey"],
        mutationFn: async (params: IApiKeySavingParams) => {
            const { data } = await llmService.setApiKey(params);
            if (data.retcode === 0) {
                toast.success("Modify success");
                queryClient.invalidateQueries({ queryKey: ["myLlmList"] });
                queryClient.invalidateQueries({ queryKey: ["factoryList"] });
            }
            return data.retcode;
        },
    });

    return { data, loading, saveApiKey: mutateAsync };
};

export const useAddModel = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["addModel"],
        mutationFn: async (params: IApiKeySavingParams) => {
            const { data } = await llmService.addLLM(params);
            if (data.retcode === 0) {
                toast.success("Added model successfully");
                queryClient.invalidateQueries({ queryKey: ["myLlmList"] });
                queryClient.invalidateQueries({ queryKey: ["factoryList"] });
            }
            return data.retcode;
        },
    });

    return { data, loading, addModel: mutateAsync}
};
