import { Box, Typography } from "@mui/material";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import CsvTable from "components/csv-table";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface TableProps {
    caption: string;
    content: string;
}

interface ImageProps {
    location: string;
    description: string;
}

interface ChunkProps {
    title: string;
    content: string;
    tables: Array<TableProps>;
    images: Array<ImageProps>;
    id: string;
}

interface TableProps {
    chunk_id: string;
    caption: string;
    content: string;
}

interface TableViewProps {
    selectedChunk: ChunkProps | undefined;
}


const TableView: React.FC<TableViewProps> = ({
    selectedChunk
}) => {
    const [tables, setTables] = useState<Array<TableProps>>([]);
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");

    const getTables = async () => {
        if (kb_id && selectedChunk) {
            const response = await knowledgebaseChunkApi.getTableList(
                kb_id, selectedChunk.id
            )
            if (response.status === 200) {
                setTables(response.data.data.tables);
                console.log(response.data.data.tables)
            }
        }
    };

    useEffect(() => {
        getTables();
    }, [selectedChunk])

    return (<Box padding="24px">
        {tables.map((table) => (<Box marginBottom="24px"
            padding="10px"
            border="1px solid #e0e0e0"
        >
            <Typography>
                {table["caption"]}
            </Typography>
            <CsvTable data={table["content"]} />
        </Box>))}
    </Box>)
}

export default TableView;