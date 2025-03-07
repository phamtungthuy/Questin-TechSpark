import { Box } from "@mui/material";
import React from "react";
import { useSearchParams } from "react-router-dom";
import DocumentPreview from "./document-preview";
import TableView from "./table-view";
import QuestionView from "./question-view";
import ImageView from "./image-view";

enum Mode {
    Preview = "preview",
    Question = "question",
    Table = "table",
    Image = "image",
}

interface TableProps {
    chunk_id: string;
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

interface ChunkRightContentProps {
    mode: Mode;
    selectedChunk: ChunkProps | undefined;
}

const ChunkRightContent: React.FC<ChunkRightContentProps> = ({
    mode,
    selectedChunk,
}) => {
    const [searchParams] = useSearchParams();
    const doc_id = searchParams.get("doc_id");
    const kb_id = searchParams.get("id");
    return (
        <Box flex="1" display="flex" flexDirection="column">
            {mode === Mode.Preview && (
                <Box position="relative" flex="1">
                    <DocumentPreview
                        url={`${process.env.REACT_APP_BACKEND_API_URL}/api/knowledgebase/${kb_id}/document/${doc_id}/`}
                    />
                </Box>
            )}
            <Box display="flex" flexDirection="column" overflow="auto">
                {mode === Mode.Question && (
                    <QuestionView selectedChunk={selectedChunk} />
                )}
                {mode === Mode.Table && <TableView 
                    selectedChunk={selectedChunk}
                />}
                {mode === Mode.Image && <ImageView 
                    selectedChunk={selectedChunk}
                />}

            </Box>

        </Box>
    );
};

export default ChunkRightContent;
