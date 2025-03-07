import {
    Box,
    TablePagination,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import knowledgebaseDocumentApi from "api/admin/knowledgebase/knowledgebase-document-api";
import React, { useEffect, useState } from "react";
import CsvTable from "components/csv-table";
import StatusMonitor from "./status-monitor";

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

interface ChunkLeftContentProps {
    selectedChunk: ChunkProps | undefined;
    setSelectedChunk: (chunk: ChunkProps) => void;
}

enum ChunkMode {
    Ellipse = "ellipse",
    FullText = "full text",
    Table = "table",
    Image = "image",
    All = "all",
    StatusMonitor = "status monitor"
}

const ChunkLeftContent: React.FC<ChunkLeftContentProps> = ({
    selectedChunk,
    setSelectedChunk,
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [chunks, setChunks] = useState<Array<ChunkProps>>([]);
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");
    const cluster_id = searchParams.get("cluster_id");
    const doc_id = searchParams.get("doc_id");
    const [alignment, setAlignment] = useState(ChunkMode.Ellipse);

    const getDocumentChunks = async (page: number, size: number) => {
        if (kb_id && doc_id) {
            const response = await knowledgebaseDocumentApi.getChunkList(
                kb_id,
                doc_id,
                page,
                size
            );
            if (response.status === 200) {
                setChunks(response.data.data.chunks);
                setTotal(response.data.data.total);
            }
        }
    };

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number
    ) => {
        setPage(newPage);
        getDocumentChunks(newPage, rowsPerPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
        getDocumentChunks(0, parseInt(event.target.value, 10));
    };

    const handleChangeAlignment = (
        event: React.MouseEvent<HTMLElement>,
        newAlignment: ChunkMode
    ) => {
        setAlignment(newAlignment);
    };

    useEffect(() => {
        getDocumentChunks(0, rowsPerPage);
    }, []);

    const ellipseStyle = {
        whiteSpace: "pre-line",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 4, // Giới hạn số dòng
        WebkitBoxOrient: "vertical",
        maxWidth: "100%"
    }

    const baseStyle = {
        whiteSpace: "pre-line",
    }

    return (
        <Box display="flex" flexDirection="column" height="100%" overflow="auto">
            <ToggleButtonGroup
                color="primary"
                value={alignment}
                exclusive
                onChange={handleChangeAlignment}
                aria-label="Platform"
                sx={{ fontSize: "12px",
                    marginBottom: "8px"
                 }}
            >
                <ToggleButton
                    size="small"
                    value={ChunkMode.Ellipse}
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                >
                    Ellipse
                </ToggleButton>
                <ToggleButton
                    size="small"
                    value={ChunkMode.FullText}
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                >
                    Full text
                </ToggleButton>
                <ToggleButton
                    size="small"
                    value={ChunkMode.Table}
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                >
                    Table
                </ToggleButton>
                <ToggleButton
                    size="small"
                    value={ChunkMode.Image}
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                >
                    Image
                </ToggleButton>
                <ToggleButton
                    size="small"
                    value={ChunkMode.All}
                    sx={{ padding: "4px 8px", fontSize: "12px" }}
                >
                    All
                </ToggleButton>
                <ToggleButton
                    size="small"
                    value={ChunkMode.StatusMonitor}
                    sx={{ padding: "4px 8px", fontSize: "12px", marginLeft: "16px" }}
                >
                    Status Monitor
                </ToggleButton>
            </ToggleButtonGroup>
            <Box overflow="auto" flex="1">
                {ChunkMode.StatusMonitor === alignment && (<StatusMonitor 
                    
                />)}
                {ChunkMode.StatusMonitor !== alignment && chunks.map((chunk: ChunkProps, idx: number) => {
                    return (
                        <Box
                            key={idx}
                            border="1px solid #f0f0f0"
                            borderRadius="8px"
                            marginBottom="20px"
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    selectedChunk &&
                                    selectedChunk["id"] === chunk["id"]
                                        ? "#eff8ff"
                                        : "#fff",
                            }}
                            onClick={() => {
                                console.log(chunk["id"])
                                setSelectedChunk(chunk);
                            }}
                        >
                            <Box padding="24px">
                                <Typography
                                    style={ChunkMode.Ellipse === alignment ? ellipseStyle : baseStyle}
                                >
                                    {chunk["content"]}
                                </Typography>
                                {(ChunkMode.Table === alignment || ChunkMode.All === alignment) && chunk["tables"] &&
                                    chunk["tables"].map((table) => (
                                        <Box marginTop="10px">
                                            <Typography>
                                                {table["caption"]}
                                            </Typography>
                                            <CsvTable data={table["content"]} />
                                        </Box>
                                    ))}
                                {(ChunkMode.Image === alignment || ChunkMode.All === alignment) && chunk["images"] && chunk["images"].map((image) => {
                                    return (<Box component="img"
                                        marginTop="10px"
                                        src={`http://${process.env.REACT_APP_BACKEND_HOST}/api/knowledgebase/${kb_id}/image/${image["location"]}/`}
                                    >

                                    </Box>)
                                })}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};

export default ChunkLeftContent;
