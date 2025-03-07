import { Box, TextField, Typography } from "@mui/material";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import BaseModal from "components/base-modal";
import { BasicModalProps } from "constants/props";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

interface QuestionProps {
    id: string;
    question: string;
}

interface EditQuestionModalProps extends BasicModalProps{
    question: QuestionProps;
    setQuestions: (params: any) => void;
    chunk_id: string;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
    open,
    onClose,
    question,
    setQuestions,
    chunk_id
}) => {
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id"); 
    const [newQuestion, setNewQuestion] = useState<QuestionProps>(question);

    const updateQuestion = async () => {
        if (kb_id) {
            const response = await knowledgebaseChunkApi.updateQuestion(kb_id, chunk_id, question.id, {
                "question": newQuestion.question
            })
            if (response.status === 200) {
                setQuestions((prevQuestions: any) => prevQuestions.map((item: any) => item.id === question.id ? newQuestion : item));
                toast.success(response.data.message);                
            } else {
                toast.error(response.data.message);
            }
        }
    }

    const handleDeleteQuestion = async () => {
        if (kb_id) {
            const response = await knowledgebaseChunkApi.deleteQuestion(kb_id, chunk_id, question.id);
            if (response.status === 200) {
                setQuestions((prevQuestions: any) => prevQuestions.filter((item: any) => item.id !== question.id))
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
            onClose();
        }
    }

    useEffect(() => {
        setNewQuestion(question);
    }, [question])

    return (
        <BaseModal open={open} title="Edit Question" onClose={onClose} onOk={updateQuestion}>
            <React.Fragment>
                <Box
                    display="-webkit-flex"
                    alignItems="center"
                    marginBottom="8px"
                >
                    <Typography color="red" marginRight="4px">
                        *
                    </Typography>
                    <Typography fontSize="16px">Question</Typography>
                </Box>
                <TextField
                    value={newQuestion["question"]}
                    onChange={(e) => {
                        const updatedQuestion = {
                            ...newQuestion,
                            question: e.target.value,
                        };
                        setNewQuestion(updatedQuestion);
                    }}
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={10}
                    inputProps={{ style: { fontSize: "14px" } }}
                />
                <Box display="flex">
                    <Box
                        border="1px solid #e0e0e0"
                        padding="4px 8px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "#dc4e41",
                            },
                        }}
                        onClick={handleDeleteQuestion}
                    >
                        Delete
                    </Box>
                    <Box></Box>
                </Box>
            </React.Fragment>
        </BaseModal>
    );
};

export default EditQuestionModal;
