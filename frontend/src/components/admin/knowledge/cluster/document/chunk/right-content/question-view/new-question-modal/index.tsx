import {
    Box,
    TextField,
    Typography,
} from "@mui/material";
import React, { useState } from "react";
import { BasicModalProps } from "constants/props";
import BaseModal from "components/base-modal";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

interface NewQuestionModalProps extends BasicModalProps {
    chunk_id: string;
    setQuestions: (params: any) => void;
}

const NewQuestionModal: React.FC<NewQuestionModalProps> = ({
    open,
    onClose,
    chunk_id,
    setQuestions
}) => {
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");
    const [question, setQuestion] = useState<string>("");

    const createNewQuestion = async () => {
        if (kb_id) {
            const response = await knowledgebaseChunkApi.createQuestion(kb_id, chunk_id, {
                "question": question
            })
            if (response.status === 200) {
                setQuestion("");
                setQuestions((prevQuestions: any) => [...prevQuestions, response.data.data]);
                toast.success(response.data.message);                
            } else {
                toast.error(response.data.message);
            }
        }
    }

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            onOk={createNewQuestion}
            title="Create Question"
        >
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
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={10}
                    inputProps={{ style: { fontSize: "14px" } }}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
            </React.Fragment>
        </BaseModal>
    );
};

export default NewQuestionModal;
