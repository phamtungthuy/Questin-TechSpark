import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ICluster } from "interfaces/database/knowledge";
import clusterService from "services/cluster-service";
import { useGetKnowledgeSearchParams } from "./route-hook";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "store/store";
import { useDispatch } from "react-redux";
import { removeCluster, setCluster, setClusterList } from "store/cluster-slice";
import { toast } from "react-toastify";

export const useFetchNextClusterList = () => {
    const { knowledgeId } = useGetKnowledgeSearchParams();
    const clusterListRecord = useSelector(
        (state: RootState) => state.cluster.clusterListRecord
    );
    const dispatch = useDispatch<AppDispatch>();

    const { data, isFetching: loading } = useQuery<ICluster[]>({
        queryKey: ["fetchClusterList"],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            if (clusterListRecord[knowledgeId]) {
                return clusterListRecord[knowledgeId];
            }
            const { data } = await clusterService.listCluster({
                kb_id: knowledgeId,
            });
            if (data.retcode === 0) {
                dispatch(
                    setClusterList({
                        kb_id: knowledgeId,
                        clusterList: data.data,
                    })
                );
                return data.data;
            }
            return data?.data || [];
        },
    });

    return { data, loading };
};

export const useSetNextCluster = () => {
    const { clusterId, knowledgeId } = useGetKnowledgeSearchParams();
    const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["setCluster"],
        mutationFn: async (params: Record<string, any>) => {
            const { data } = await clusterService.setCluster({
                kb_id: knowledgeId,
                cluster_id: clusterId,
                ...params,
            });
            if (data.retcode === 0) {
                toast.success("Created cluster successfully!");
                await dispatch(
                    setCluster({
                        kb_id: knowledgeId,
                        cluster: data.data,
                    })
                );
                queryClient.invalidateQueries({
                    queryKey: ["fetchClusterList"],
                });
            }
            return data;
        },
    });

    return { data, loading, setCluster: mutateAsync };
};

export const useRemoveNextCluster = () => {
    const queryClient = useQueryClient();
    const { knowledgeId } = useGetKnowledgeSearchParams();
    const dispatch = useDispatch<AppDispatch>();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["removeCluster"],
        mutationFn: async (clusterIds: string[]) => {
            const { data } = await clusterService.removeCluster({
                cluster_ids: clusterIds,
            });
            if (data.retcode === 0) {
                await dispatch(
                    removeCluster({
                        kb_id: knowledgeId,
                        cluster_ids: clusterIds,
                    })
                );
                toast.success("Deleted cluster successfully");
                queryClient.invalidateQueries({
                    queryKey: ["fetchClusterList"],
                });
            }
            return data.retcode;
        },
    });

    return { data, loading, removeCluster: mutateAsync };
};
