import { Box } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import { removeLatestMessage, setGenerating } from "store/chat/chatSlice";
import { sendMessage } from "store/websocket/action";
import { setPrompt } from "store/user/userSlice";
import AnswerMessageStatus from "../answer-status";

interface ClassifyMessageProps {
    question: string;
    status: string;
}

const ClassifyMessage: React.FC<ClassifyMessageProps> = ({
    status,
    question
}) => {
    const {
        knowledgeBaseId: kb_id,
        id: chat_id
    } = useParams();
    const dispatch = useDispatch<AppDispatch>();

    const cancelCurrentQuestion = (e: any) => {
        e.preventDefault();
        if (chat_id) {
            dispatch(setGenerating(false));
            dispatch(removeLatestMessage({
                chat_id
            }));
        }
    }
    if (status === "continue") {
        return <AnswerMessageStatus 
            type="classify"
        />
    }

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            className="flex space-x-5  py-2 max-w-2xl mx-auto"
            margin="auto"
        >
            <Box
                border="1px solid green"
                borderRadius="10px"
                padding="10px 20px"
                sx={{
                    backgroundColor: "#fff",
                    "&:hover": {
                        opacity: "0.7",
                        cursor: "pointer",
                    },
                }}
                onClick={async () => {
                    if (kb_id && chat_id) {
                        dispatch(removeLatestMessage({
                            chat_id: chat_id
                        }));
                        sendMessage(
                            kb_id,
                            chat_id,
                            question,
                            "generate"
                        )
                    }
                }}
            >
                Đây không phải là một câu hỏi liên quan đến lĩnh vực của bạn.
                Bạn có muốn tiếp tục không? Mô hình của chúng tôi có thể sẽ sinh
                ra một câu trả lời không phù hợp!
            </Box>
            <Box
                border="1px solid green"
                borderRadius="10px"
                padding="10px 20px"
                sx={{
                    backgroundColor: "#fff",
                    "&:hover": {
                        opacity: "0.7",
                        cursor: "pointer",
                    },
                }}
                onClick={cancelCurrentQuestion}
            >
                Bỏ qua câu trả lời cũ và tiếp tục với câu trả lời mới.
            </Box>
        </Box>
    );
};

export default ClassifyMessage;
