import {
    HandThumbDownIcon,
    HandThumbUpIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CopyToClipBoard from "components/copy-to-clipboard";
import { useFetchNextMessageList, useSendFeedback } from "hooks/message-hook";
import { useTranslate } from "hooks/common-hook";
import { useGetChatParams } from "hooks/conversation-hook";
import { useAuth } from "hooks/auth-hook";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import { sendMessageParams } from "hooks/chat-hook";
import { IMessageAnswer } from "interfaces/database/conversation";
import { setMessageItem } from "store/message-slice";
interface IProps {
    currentVersion: number;
    totalVersions: number;
    messageId: string;
    content: string;
    thumb: string;
    setCurrentVersion: (version: number) => void;
    sendMessage: (params: sendMessageParams) => void;
    messageAnswer: IMessageAnswer;
}

const AssistantGroupButton = ({
    currentVersion,
    totalVersions,
    messageId,
    content,
    thumb,
    setCurrentVersion,
    sendMessage,
    messageAnswer
}: IProps) => {
    const [isRotating, setIsRotating] = useState(false);
    const { thumb: tb, onFeedbackOk } = useSendFeedback(messageAnswer.qa_id, 
        messageAnswer.id, thumb);
    const { t } = useTranslate("message");
    const { data: messageList } = useFetchNextMessageList();
    const { conversationId } = useGetChatParams();
    const dispatch = useDispatch<AppDispatch>();
    
    const handlePrevious = () => {
        if (currentVersion > 0) {
            setCurrentVersion(currentVersion - 1);
        }
    };

    const handleNext = () => {
        if (currentVersion < totalVersions - 1) {
            setCurrentVersion(currentVersion + 1);
        }
    };

    const handleAnimationEnd = () => {
        // Sau khi animation kết thúc, reset state
        setIsRotating(false);
    };

    return (
        <Box display="flex" marginTop="8px" justifyContent="space-between">
            <Box display="flex">
                {totalVersions > 1 && (<Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <IconButton
                        onClick={handlePrevious}
                        disabled={currentVersion <= 0}
                        size="small"
                        sx={{ border: "none" }}
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </IconButton>

                    <Typography
                        variant="body2"
                        sx={{ minWidth: 10, textAlign: "center" }}
                    >
                        {currentVersion + 1}/{totalVersions}
                    </Typography>

                    <IconButton
                        onClick={handleNext}
                        disabled={currentVersion >= totalVersions - 1}
                        size="small"
                        sx={{ border: "none" }}
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </IconButton>
                </Box>)}
                <Tooltip title={t("like")} arrow>
                    <button className="flex  items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible">
                        <HandThumbUpIcon
                            fill={tb === "1" ? "black" : "white"}
                            className="h-4 w-4"
                            onClick={() =>
                                onFeedbackOk({
                                    thumb: "1",
                                })
                            }
                        />
                    </button>
                </Tooltip>
                <Tooltip title={t("dislike")} arrow>
                    <button className="flex items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible">
                        <HandThumbDownIcon
                            fill={tb === "-1" ? "black" : "white"}
                            className="h-4 w-4"
                            onClick={() =>
                                onFeedbackOk({
                                    thumb: "-1",
                                })
                            }
                        />
                    </button>
                </Tooltip>
                <Tooltip title={t("tryAgain")} arrow>
                    <button className="flex items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible">
                        <ArrowPathIcon
                            fill={tb === "-1" ? "black" : "white"}
                            className={`h-4 w-4 ${isRotating ? "animate-spin-once" : ""}`}
                            onAnimationEnd={handleAnimationEnd}
                            onClick={async () => {
                                setIsRotating(true);
                                const index = messageList.findIndex((msg) => msg.id === messageAnswer.message_id);
                                const history = index !== -1 ? messageList.slice(index, ) : [];
                                    // await dispatch(updateMessageList({
                                    //     conversation_id: isLogin ? conversationId : dialogId,
                                    //     messageList: history,
                                    // }));
                                await dispatch(setMessageItem({
                                    conversation_id: conversationId,
                                    messages: history,
                                    replace: true
                                }))
                                await sendMessage({
                                    query: messageList[index].qas[0].question,
                                    conversation_id: conversationId,
                                    history: messageList.slice(1),
                                    type: "try_again",
                                    message_id: messageAnswer.message_id,
                                    qa_id: messageAnswer.qa_id
                                });
                            }}
                        />
                    </button>
                </Tooltip>
                <Box display="flex">
                    <CopyToClipBoard text={content}></CopyToClipBoard>
                </Box>
            </Box>
            {/* <Box>
                {totalVersions > 1 && (<GradientText 
                    text={currentVersion === 1 ? "Dữ liệu quốc gia" : "VnEconomy"}
                    // onClick={() => {
                    //     setCurrentVersion(currentVersion === 1 ? 2 : 1);
                    // }}
                />)}
            </Box> */}
        </Box>
    );
};

export default AssistantGroupButton;
