import { Box, Button, Tooltip, Typography } from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { chat, removeLatestMessage } from "store/chat/chatSlice";
import { AppDispatch } from "store/store";
import { sendMessage } from "store/websocket/action";

interface questionProps {
    id: string;
    question: string;
}

interface QuestionMessageProps {
    question: string;
    questionList: Array<questionProps>;
}

const QuestionMessage: React.FC<QuestionMessageProps> = ({
    question,
    questionList,
}) => {
    const {
        knowledgeBaseId: kb_id,
        id: chat_id
    } = useParams();
    const dispatch = useDispatch<AppDispatch>();
    return (
        <Box>
            <Typography>Có phải ý bạn là:</Typography>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    flexDirection: "column",
                }}
            >
                {questionList.map((questionObject, index) => (
                    <Box>
                        <Button
                            variant="outlined"
                            sx={{
                                width: "100%",
                                borderRadius: "8px", // rounded-lg
                                color: "grey.800", // text-gray-500
                                px: 2, // padding-x: px-3
                                py: 0.5, // padding-y: py-1
                                textTransform: "none",
                                fontSize: "0.875rem", // text-sm
                                textAlign: "justify",

                                "&:hover": {
                                    color: "black", // hover:text-black
                                    backgroundColor: "slate.100", // hover:bg-slate-100
                                },
                            }}
                            onClick={() => {
                                if (kb_id && chat_id) {
                                    dispatch(removeLatestMessage({
                                        chat_id
                                    }))
                                    sendMessage(
                                        kb_id,
                                        chat_id,
                                        questionObject["question"],
                                        "generate"
                                    );
                                }
                            }}
                        >
                            {questionObject["question"]}
                        </Button>
                    </Box>
                ))}
                <Box>
                    <Tooltip title={<Typography>{question}</Typography>}>
                        <Button
                            variant="outlined"
                            sx={{
                                borderRadius: "8px", // rounded-lg
                                width: "100%",
                                color: "grey.800", // text-gray-500
                                px: 2, // padding-x: px-3
                                py: 0.5, // padding-y: py-1
                                textTransform: "none",
                                fontSize: "0.875rem", // text-sm
                                fontWeight: "bold",
                                textAlign: "justify",

                                "&:hover": {
                                    color: "black", // hover:text-black
                                    backgroundColor: "slate.100", // hover:bg-slate-100
                                },
                            }}
                            onClick={() => {
                                if (kb_id && chat_id) {
                                    dispatch(removeLatestMessage({
                                        chat_id
                                    }))
                                    sendMessage(
                                        kb_id,
                                        chat_id,
                                        question,
                                        "generate"
                                    );
                                }
                            }}
                        >
                            Không có câu hỏi nào tương tự, tiếp tục với câu hỏi
                            trước đó ...
                        </Button>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
};

export default QuestionMessage;
