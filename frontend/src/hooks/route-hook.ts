import { KnowledgeSearchParams } from "constants/knowledge";
import { size } from "lodash";
import { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export const useGetChatParams = () => {
    const { dialogId, conversationId } = useParams();

    return {
        dialogId: dialogId || "",
        conversationId: conversationId || "",
    };
};

export const useGetKnowledgeSearchParams = () => {
    const [searchParams] = useSearchParams();

    return {
        knowledgeId: searchParams.get(KnowledgeSearchParams.KnowledgeId) || "",
        clusterId: searchParams.get(KnowledgeSearchParams.ClusterId) || "",
        documentId: searchParams.get(KnowledgeSearchParams.DocumentId) || "",
    };
};

export const useGetPaginationParams = () => {
    const [currentQueryParameters] = useSearchParams();

    return {
        page: parseInt(currentQueryParameters.get("page") || "1"),
        size: parseInt(currentQueryParameters.get("size") || "10"),
    };
};

export const useSetPaginationParams = () => {
    const [queryParameters, setSearchParams] = useSearchParams();
    const setPaginationParams = useCallback(
        (page: number = 1, pageSize?: number) => {
            queryParameters.set("page", page.toString());
            if (pageSize) {
                queryParameters.set("size", pageSize.toString());
            }
            setSearchParams(queryParameters);
        },
        [setSearchParams, queryParameters]
    );

    return {
        setPaginationParams,
        page: Number(queryParameters.get("page") || 1),
        size: Number(queryParameters.get("size") || 10),
    }
};
