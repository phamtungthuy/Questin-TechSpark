import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IKnowledge } from "interfaces/database/knowledge";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import kbService from "services/knowledge-service";
import {
    removeKnowledge,
    setKnowledge,
    setKnowledgeList,
} from "store/knowledge-slice";
import { AppDispatch, RootState } from "store/store";
import { useGetKnowledgeSearchParams } from "./route-hook";
import { toast } from "react-toastify";

export const useFetchNextKnowledgeList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const knowledgeList = useSelector(
        (state: RootState) => state.knowledge.knowledgeList
    );
    const { data, isFetching: loading, refetch } = useQuery<IKnowledge[]>({
        queryKey: ["fetchKnowledgeList"],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            if (knowledgeList) {
                return knowledgeList;
            }

            const { data } = await kbService.listKnowledge();
            if (data.retcode === 0) {
                dispatch(
                    setKnowledgeList({
                        knowledgeList: data.data,
                    })
                );
                return data.data;
            }
            return data?.data || [];
        },
    });

    return { data, loading, refetch };
};

export const useFetchCurrentKnowledge = () => {
    const knowledgeList = useSelector(
        (state: RootState) => state.knowledge.knowledgeList
    );
    const { knowledgeId } = useGetKnowledgeSearchParams();
    const dispatch = useDispatch<AppDispatch>();
    const { data, isFetching: loading } = useQuery<IKnowledge | null>({
        queryKey: ["fetchCurrentKnowledge"],
        initialData: null,
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            if (!knowledgeList) {
                const { data } = await kbService.listKnowledge();
                if (data.retcode === 0) {
                    dispatch(
                        setKnowledgeList({
                            knowledgeList: data.data,
                        })
                    );
                    return data.data.find(
                        (kb: IKnowledge) => kb.id === knowledgeId
                    );
                }
                return null;
            }

            return knowledgeList.find((kb) => kb.id === knowledgeId) || null;
        },
    });

    return { data, loading };
};

export const useSetNextKnowledge = () => {
    const { knowledgeId } = useGetKnowledgeSearchParams();
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["setKnowledge"],
        mutationFn: async (params: Record<string, any>) => {
            const { data } = await kbService.setKnowledge({
                kb_id: knowledgeId,
                ...params,
            });
            if (data.retcode === 0) {
                toast.success("Created knowledge successfully");
                await dispatch(
                    setKnowledge({
                        knowledge: data.data,
                    })
                );
                queryClient.invalidateQueries({
                    queryKey: ["fetchKnowledgeList"],
                });
            }
            return data;
        },
    });

    return { data, loading, setKnowledge: mutateAsync };
};

export const useRemoveKnowledge = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["removeKnowledge"],
        mutationFn: async (kbIds: string[]) => {
            const { data } = await kbService.rmKb({ kb_ids: kbIds });
            if (data.retcode === 0) {
                await dispatch(removeKnowledge({
                    kb_ids: kbIds
                }))
                toast.success("Deleted knowledge successfully");
                queryClient.invalidateQueries({
                    queryKey: ["fetchKnowledgeList"],
                });
            }
            return data.retcode;
        },
    });

    return { data, loading, removeKnowledge: mutateAsync };
};
