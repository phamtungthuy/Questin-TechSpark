import { Box, Breadcrumbs, Divider, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

import KnowledgeLayout from "../../../layout";
import ChunkLeftContent from "components/admin/knowledge/cluster/document/chunk/left-content";
import ChunkRightContent from "components/admin/knowledge/cluster/document/chunk/right-content";
import AddIcon from '@mui/icons-material/Add';
import knowledgebaseDocumentApi from "api/admin/knowledgebase/knowledgebase-document-api";
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

enum Mode {
    Preview = "preview",
    Question = "question",
    Image = "image",
    Table = "table"
}

const DocumentChunk = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cluster_id = searchParams.get("cluster_id");
    const doc_id = searchParams.get("doc_id");
    const kb_id = searchParams.get("id");
    const [selectedChunk, setSelectedChunk] = useState<ChunkProps>();
    const [alignment, setAlignment] = useState(Mode.Preview);
    const [leftWidth, setLeftWidth] = useState(50); // Phần trăm width của component bên trái
    const [name, setName] = useState("");

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const newLeftWidth = (e.clientX / window.innerWidth) * 100;
        if (newLeftWidth > 10 && newLeftWidth < 90) {
            setLeftWidth(newLeftWidth);
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleChange = (
        event: React.MouseEvent<HTMLElement>,
        newAlignment: Mode,
      ) => {
        setAlignment(newAlignment);
    };

    const getName = async () => {
    if (kb_id && doc_id) {
        const response = await knowledgebaseDocumentApi.getDocumentName(kb_id, doc_id);
        if (response.status === 200) {
            setName(response.data.data);
        }
    }
    }

    useEffect(() => {
    getName();
    }, [])

    return (
        <KnowledgeLayout>
            <React.Fragment>
                <Breadcrumbs aria-label="breadcrumb">
                    <Typography
                        color="inherit"
                        onClick={() => navigate("/admin/knowledge")}
                        fontSize="16px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        Knowledge Base
                    </Typography>
                    <Typography
                        color="inherit"
                        onClick={() =>
                            navigate(
                                `/admin/knowledge/cluster?id=${kb_id}`
                            )
                        }
                        fontSize="16px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        Cluster
                    </Typography>
                    <Typography
                        color="inherit"
                        onClick={() =>
                            navigate(
                                `/admin/knowledge/cluster/document?id=${kb_id}&cluster_id=${cluster_id}`
                            )
                        }
                        fontSize="16px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        Document
                    </Typography>

                    <Typography color="text.primary" fontSize="16px">
                        Chunks
                    </Typography>
                </Breadcrumbs>

                <Box
                    display="flex"
                    flexDirection="column"
                    flex="1"
                    overflow="auto"
                    marginTop="16px"
                    padding="24px"
                    sx={{
                        backgroundColor: "#fff",
                        flex: "1 1",
                        boxSizing: "border-box",
                    }}
                >
                    <Box
                        display="flex"
                        width="100%"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Box display="flex" gap="10px">
                            <ArrowBackIcon
                                sx={{
                                    color: "#8abaff",
                                    cursor: "pointer",
                                }}
                                onClick={() => navigate(-1)}
                            />
                            <InsertDriveFileOutlinedIcon />

                            <Typography fontSize="14px">
                                {name}
                            </Typography>
                        </Box>
                        <Box display="flex" gap="10px">
                            <ToggleButtonGroup
                                color="primary"
                                value={alignment}
                                exclusive
                                onChange={handleChange}
                                aria-label="Platform"
                                sx={{ fontSize: "12px" }}
                            >
                                <ToggleButton size="small" value={Mode.Preview} sx={{ padding: "4px 8px", fontSize: "12px" }}>
                                    Preview
                                </ToggleButton>
                                <ToggleButton size="small" value={Mode.Question} sx={{ padding: "4px 8px", fontSize: "12px" }}>
                                    Question
                                </ToggleButton>
                                <ToggleButton size="small" value={Mode.Table} sx={{ padding: "4px 8px", fontSize: "12px" }}>
                                    table
                                </ToggleButton>
                                <ToggleButton size="small" value={Mode.Image} sx={{ padding: "4px 8px", fontSize: "12px" }}>
                                    Image
                                </ToggleButton> 
                            </ToggleButtonGroup>
                            
                            <IconButton size="small" sx={{
                                backgroundColor: "#1778fa",
                                color: "#fff",
                                borderRadius: "8px",
                                padding: "4px",
                                fontSize: "18px",
                                "&:hover": {
                                    backgroundColor: "#1778fa",
                                    color: "#fff",
                                }
                            }}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Divider
                        sx={{
                            marginY: "24px",
                        }}
                    />
                    <Box
                        display="flex"
                        flexDirection="row"
                        flex="1"
                        overflow="auto"
                    >
                        <Box
                            width={`${leftWidth}%`}
                            display="flex"
                            flexDirection="column"
                        >
                            <ChunkLeftContent
                                selectedChunk={selectedChunk}
                                setSelectedChunk={setSelectedChunk}
                            />
                        </Box>
                        <Box
                            sx={{
                                cursor: "col-resize",
                                backgroundColor: "#d0e2f4",
                                width: "5px",
                                marginX: "5px",
                            }}
                            onMouseDown={handleMouseDown}
                        />
                            <ChunkRightContent 
                            mode={alignment}
                            selectedChunk={selectedChunk}
                            />

                    </Box>
                </Box>
            </React.Fragment>
        </KnowledgeLayout>
    );
};

export default DocumentChunk;
