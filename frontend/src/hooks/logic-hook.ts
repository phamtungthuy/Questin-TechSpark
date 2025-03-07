import { FormControlState, PaginationProps } from "@mui/material";
import { IKnowledgeFile } from "interfaces/database/knowledge";
import { useCallback, useMemo, useState } from "react";
import { useTranslate } from "./common-hook";
import { useSetPaginationParams } from "./route-hook";

export const useSetSelectedRecord = <T = IKnowledgeFile>() => {
    const [currentRecord, setCurrentRecord] = useState<T>({} as T);

    const setRecord = (record: T) => {
        setCurrentRecord(record);
    };

    return { currentRecord, setRecord };
};

const ChunkTokenNumMap = {
    naive: 128,
    knowledge_graph: 8192,
};

export const useHandleChunkMethodSelectChange = (form: any) => {
    const handleChange = useCallback(
        (value: string) => {
            if (value in ChunkTokenNumMap) {
                form.setFieldValue(
                    ["parser_config", "chunk_token_num"],
                    ChunkTokenNumMap[value as keyof typeof ChunkTokenNumMap]
                );
            }
        },
        [form]
    );

    return handleChange;
};

export const useGetPagination = () => {
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
    const { t } = useTranslate("common");

    const onPageChange = useCallback((pageNumber: number, pageSize: number) => {
        setPagination({ page: pageNumber, pageSize });
    }, []);

    const currentPagination = useMemo(() => {
        return {
            showQuickJumper: true,
            total: 0,
            showSizeChanger: true,
            current: pagination.page,
            pageSize: pagination.pageSize,
            pageSizeOptions: [1, 2, 10, 20, 50, 100],
            onChange: onPageChange,
            showTotal: (total: Number) => `${t("total")} ${total}`,
        };
    }, [t, onPageChange, pagination]);

    return {
        pagination: currentPagination,
    };
};

export const useGetPaginationWithRouter = () => {
    const { t } = useTranslate("common");

    const {
        setPaginationParams,
        page,
        size: pageSize,
    } = useSetPaginationParams();

    const onPageChange = useCallback(
        (pageNumber: number, pageSize: number) => {
            setPaginationParams(pageNumber, pageSize);
        },
        [setPaginationParams]
    );

    const setCurrentPagination = useCallback(
        (pagination: { page: number; pageSize?: number }) => {
            setPaginationParams(pagination.page, pagination.pageSize);
        },
        [setPaginationParams]
    );

    const pagination = useMemo(() => {
        return {
            showQuickJumper: true,
            total: 0,
            showSizeChanger: true,
            current: page,
            pageSize: pageSize,
            pageSizeOptions: [1, 2, 10, 20, 50, 100],
            onChange: onPageChange,
            showTotal: (total: Number) => `${t("total")} ${total}`,
        };
    }, [t, onPageChange, page, pageSize]);

    return {
        pagination,
        setPagination: setCurrentPagination,
    };
};
