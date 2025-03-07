import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import NewQuestionModal from "./new-question-modal";
import EditQuestionModal from "./edit-question-modal";

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

interface QuestionProps {
    id: string;
    question: string;
}

interface QuestionViewProps {
    selectedChunk: ChunkProps | undefined;
}

const QuestionView: React.FC<QuestionViewProps> = ({ selectedChunk }) => {
    const [questions, setQuestions] = React.useState<Array<QuestionProps>>([]);
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");
    const [openNewQuestionModal, setOpenNewQuestionModal] = useState(false);
    const [openEditQuestionModal, setOpenEditQuestionModal] = useState(false);
    const [editQuestion, setEditQuestion] = useState<QuestionProps | undefined>(undefined);
    const getQuestions = async () => {
        if (kb_id && selectedChunk) {
            const response = await knowledgebaseChunkApi.getQuestionList(kb_id, selectedChunk.id);
            if (response.status === 200) {
                setQuestions(response.data.data.questions);
            }
        }
    };



    useEffect(() => {
        getQuestions();
    }, [selectedChunk]);

    return (
        <Box display="flex" flexDirection="column"  flex="1" overflow="hidden" >
            {selectedChunk && <NewQuestionModal 
                chunk_id={selectedChunk.id}
                open={openNewQuestionModal}
                onClose={() => setOpenNewQuestionModal(false)}
                setQuestions={setQuestions}
            />}
            {editQuestion && selectedChunk && <EditQuestionModal 
                open={openEditQuestionModal}
                onClose={() => setOpenEditQuestionModal(false)}
                question={editQuestion}
                setQuestions={setQuestions}
                chunk_id={selectedChunk.id}

            />}
            {selectedChunk && (<Box display="flex" gap="20px"  marginBottom="8px" paddingX="24px">
                <TextField
                    fullWidth
                    inputProps={{
                        style: {
                            padding: 8,
                            fontSize: "12px"
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment
                                sx={{
                                    padding: 0,
                                }}
                                position="start"
                            >
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton
                    size="small"
                    sx={{
                        backgroundColor: "#1778fa",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "4px",
                        fontSize: "14px",
                        "&:hover": {
                            backgroundColor: "#1778fa",
                            color: "#fff",
                        },
                    }}
                    onClick={() => setOpenNewQuestionModal(true)}
                >
                    <AddIcon />
                </IconButton>
            </Box>)}
            
            <Box overflow="auto" display="flex" flexDirection="column" flex="1" paddingX="24px">

                {questions.map((question, index) => (
                    <Box
                        key={index}
                        display="flex"
                        flexDirection="column"
                        padding="10px"
                        border="1px solid #e0e0e0"
                        marginBottom="10px"
                        sx={{
                            cursor: "pointer"
                        }}
                        onDoubleClick = {() => {
                            setEditQuestion(question);
                            setOpenEditQuestionModal(true);
                        }}
                    >
                        <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Box flex="1">
                                <Box fontWeight="bold">Question:</Box>
                                <Box>{question["question"]}</Box>
                            </Box>
                            {/* <Box display="flex" flexDirection="row">
                                <EditIcon
                                    sx={{
                                        "&:hover": {
                                            color: "#11fb22",
                                            cursor: "pointer",
                                        },
                                    }}
                                />
                                <DeleteIcon
                                    sx={{
                                        "&:hover": {
                                            color: "#dc4e41",
                                            cursor: "pointer",
                                        },
                                    }}
                                />
                            </Box> */}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default QuestionView;
