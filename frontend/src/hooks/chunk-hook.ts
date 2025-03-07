import { useMutation, useMutationState } from "@tanstack/react-query";
import {
    useGetKnowledgeSearchParams,
    useSetPaginationParams,
} from "./route-hook";
import chunkService from "services/chunk-service";
import { ITestingResult } from "interfaces/database/knowledge";

export const useTestChunkRetrieval = () => {
    const { knowledgeId } = useGetKnowledgeSearchParams();
    const { page, size: pageSize } = useSetPaginationParams();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["testChunk"],
        gcTime: 0,
        mutationFn: async (values: any) => {
            const { data } = await chunkService.testChunkRetrieval({
                ...values,
                kb_id: values.kb_id ?? knowledgeId,
                page,
                size: pageSize,
            });
            if (data.retcode === 0) {
                const res = data.data;
                return {
                    ...res,
                    documents: res.doc_aggs,
                };
            }
            return (
                data?.data ?? {
                    chunks: [],
                    documents: [],
                    total: 0,
                }
            );
        },
    });
    return {
        data: data ?? { chunks: [], documents: [], total: 0 },
        loading,
        testChunk: mutateAsync,
    };
};


export const useSelectTestingResult = (): ITestingResult => {
    const data = useMutationState({
        filters: { mutationKey: ["testChunk"] },
        select: (mutation) => {
            return mutation.state.data;
        }
    });
    return ((data.at(-1)) ?? {
        chunks: [],
        documents: [],
        total: 0
    }) as ITestingResult;
}