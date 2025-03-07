import { Box, Collapse } from "@mui/material";
import { useTranslate } from "hooks/common-hook";
import { useGetPaginationWithRouter } from "hooks/logic-hook";
import { useCallback, useState } from "react";

const TestingResult = () => {
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
    const { t } = useTranslate('knowledgeDetails');
    const { pagination, setPagination } = useGetPaginationWithRouter();

    const onChange = (pageNumber: number, pageSize: number) => {
        pagination.onChange?.(pageNumber, pageSize);
    }

    const onTesting = useCallback((ids: string[]) => {
        setPagination({ page: 1});
    }, [setPagination])

    return (<Box>
        <Collapse
            
        >
        </Collapse>
    </Box>)
}

export default TestingResult; 