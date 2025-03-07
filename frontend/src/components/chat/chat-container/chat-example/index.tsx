import { AcademicCapIcon } from "@heroicons/react/24/outline";

import { useEffect, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useFetchNextQuestionList } from "hooks/question-hook";
import { IQuestion } from "interfaces/database/question";
import { IMessage } from "interfaces/database/conversation";
import { useSetNextConversation } from "hooks/conversation-hook";
import { sendMessageParams } from "hooks/chat-hook";

interface IProps {
    done: boolean;
    sendMessage: (params: sendMessageParams) => void;
}

function ChatExample({ done, sendMessage }: IProps) {
    const { data: questionList } = useFetchNextQuestionList();
    const { setConversation } = useSetNextConversation();

    const handleClickExistQuestion = async (input: string) => {
        if (!done) {
            return;
        }
        let conversationId = null;
        const data = await setConversation({
            is_new: true,
        });
        if (data.retcode === 0) {
            conversationId = data.data.id;
        }
        if (conversationId) {
            await sendMessage({
                query: input,
                conversation_id: conversationId,
                history: []
            })
        }
        
    };

    useEffect(() => {}, []);

    return (
        <div className="flex-1 flex flex-col items-center h-full px-2 justify-center font-sans ">
            <h1 className="text-5xl font-bold mb-20">Questin</h1>

            <div className="flex flex-col space-y-4 md:flex-row md:space-x-2 mx-3 text-center">
                <div>
                    <div className="flex flex-col items-center justify-center mb-3">
                        <AcademicCapIcon className="h-10 w-10" />
                    </div>

                    <div className="gap-x-4 gap-y-4 lg:flex grid grid-cols-2 auto-rows-fr gap-4 justify-center items-stretch">
                        {questionList.map(
                            (question: IQuestion, idx: number) => (
                                <Tooltip
                                    title={question.content_with_weight}
                                    key={idx}
                                >
                                    <Box
                                        className="w-40"
                                        style={{
                                            padding: "16px 12px",
                                            border: "1px solid #e5e5e5",
                                            borderRadius: "16px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            handleClickExistQuestion(
                                                question.content_with_weight
                                            )
                                        }
                                    >
                                        <Typography
                                            style={{
                                                whiteSpace: "pre-line",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {question.content_with_weight}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatExample;
