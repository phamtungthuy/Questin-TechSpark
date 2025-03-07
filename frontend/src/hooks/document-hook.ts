import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetKnowledgeSearchParams } from "./route-hook";
import { IDocumentInfo } from "interfaces/database/document";
import documentService from "services/document-service";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { IChangeParserConfigRequestBody } from "interfaces/request/document";

export const useFetchNextDocumentList = () => {
    const { clusterId } = useGetKnowledgeSearchParams();
    const { data, isFetching: loading } = useQuery<{
        docs: IDocumentInfo[];
        total: number;
    }>({
        queryKey: ["fetchDocumentList", clusterId],
        initialData: {
            docs: [],
            total: 0,
        },
        refetchInterval: 15000,
        queryFn: async () => {
            const { data } = await documentService.listDocument({
                clusterId,
            });
            if (data.retcode === 0) {
                return data.data;
            }
            return {
                docs: [],
                total: 0,
            };
        },
    });
    return {
        loading,
        documents: data.docs,
    };
};

export const useUploadNextDocument = () => {
    const queryClient = useQueryClient();
    const { clusterId, knowledgeId } = useGetKnowledgeSearchParams();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["uploadDocument"],
        mutationFn: async (fileList: File[]) => {
            const formData = new FormData();
            formData.append("kb_id", knowledgeId);
            formData.append("cluster_id", clusterId);
            fileList.forEach((file: File) => {
                formData.append("file", file);
            });
            try {
                const { data } = await documentService.uploadDocument(formData);
                if (data.retcode === 0) {
                    toast.success("Uploaded file successfully!");
                    queryClient.invalidateQueries({
                        queryKey: ["fetchDocumentList"],
                    });
                }
                return data.data;
            } catch (error) {
                console.warn(error);
                return {};
            }
        },
    });

    return { uploadDocument: mutateAsync, loading, data };
};

export const useRemoveNextDocument = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["removeDocument"],
        mutationFn: async (documentIds: string | string[]) => {
            const { data } = await documentService.removeDocument({
                doc_id: documentIds,
            });
            if (data.retcode === 0) {
                toast.success(t("message.deleted"));
                queryClient.invalidateQueries({
                    queryKey: ["fetchDocumentList"],
                });
            }
            return data.retcode;
        },
    });

    return { data, loading, removeDocument: mutateAsync };
};

export const useRunNextDocument = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["runDocument"],
        mutationFn: async ({
            documentIds,
            run,
        }: {
            documentIds: string[];
            run: number;
        }) => {
            const { data } = await documentService.runDocument({
                doc_ids: documentIds,
                run,
            });
            if (data.retcode === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["fetchDocumentList"],
                });
                toast.success(t("message.operated"));
            }

            return data.retcode;
        },
    });

    return { runDocument: mutateAsync, loading, data };
};

export const useHandleRunDocument = (id: string) => {
    const { runDocument, loading } = useRunNextDocument();
    const [currentId, setCurrentid] = useState<string>("");
    const isLoading = loading && currentId !== "" && currentId === id;

    const handleRunDocument = async (
        documentId: string,
        isRunning: boolean
    ) => {
        if (isLoading) {
            return;
        }
        setCurrentid(documentId);
        try {
            await runDocument({
                documentIds: [documentId],
                run: isRunning ? 2 : 1,
            });
            setCurrentid("");
        } catch (error) {
            setCurrentid("");
        }
    };

    return {
        handleRunDocument,
        loading: isLoading,
    };
};

export const useSetNextDocumentParser = () => {
    const queryClient = useQueryClient();

    const {
        data,
        isPending: loading,
        mutateAsync,
    } = useMutation({
        mutationKey: ["setDocumentParser"],
        mutationFn: async ({
            parserId,
            documentId,
            parserConfig,
        }: {
            parserId: string;
            documentId: string;
            parserConfig: IChangeParserConfigRequestBody;
        }) => {
            const { data } = await documentService.changeDocumentParser({
                parser_id: parserId,
                doc_id: documentId,
                parser_config: parserConfig
            });
            if (data.retcode === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["fetchDocumentList"],
                });

                toast.success("Change successfully!")
            }
            return data.retcode;
        },
    });

    return { setDocumentParser: mutateAsync, data, loading };
};
