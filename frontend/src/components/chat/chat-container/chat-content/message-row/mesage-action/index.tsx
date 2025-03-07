import { Box, Tooltip } from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import {
    HandThumbUpIcon,
    HandThumbDownIcon,
    ClipboardIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { update_message } from "store/chat/chatSlice";
import messageApi from "api/user/message-api";
import { useParams } from "react-router-dom";
interface MessageActionProps {
    id: number;
    idx: number;
    answer: string;
    like: boolean;
    dislike: boolean;
}

const MessageAction: React.FC<MessageActionProps> = ({
    id,
    idx,
    answer,
    like,
    dislike,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [titleCopyButton, setTitleCopyButton] = useState("Copy");
    const [copyButtons, setCopyButtons] = useState<Record<number, boolean>>({});
    const {
        id: chat_id
    } = useParams();
    function handleCopy(answer: any, idx: number) {
        const newCopyButtons = { ...copyButtons };
        newCopyButtons[idx] = true;
        setCopyButtons(newCopyButtons);

        // setCopyButton(true);
        setTitleCopyButton("Copied");
        setTimeout(() => {
            // set value for copy button
            const newCopyButtons = { ...copyButtons };
            newCopyButtons[idx] = false;
            setCopyButtons(newCopyButtons);

            // set title for copy button
            setTitleCopyButton("Copy");
        }, 500);
        var textField = document.createElement("textarea");
        textField.innerText = answer;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand("copy");
        textField.remove();
    }

    return (
        <Box className="mt-1 flex justify-start gap-3">
            <Box className="flex self-end lg:self-center items-center justify-center lg:justify-start mt-0 -ml-1 h-7 gap-[2px] visible">
                <Tooltip title="Thích" arrow>
                    <button
                        className="flex  items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible"
                        onClick={async () => {
                            // handleLike(idx);
                            if (chat_id && id) {
                                const response = await messageApi.likeMessage(
                                    id
                                );
                                dispatch(
                                    update_message({
                                        chat_id: chat_id,
                                        message_id: id,
                                        data: response.data.data
                                    })
                                );
                            }
                        }}
                    >
                        <HandThumbUpIcon
                            fill={like ? "black" : "white"}
                            className="h-4 w-4"
                        />
                    </button>
                </Tooltip>

                <Tooltip title="Không thích" arrow>
                    <button
                        className="flex items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible"
                        onClick={async () => {
                            // handleDisLike(idx);
                            if (chat_id && id) {
                                const response =
                                    await messageApi.dislikeMessage(id);
                                    dispatch(
                                        update_message({
                                            chat_id: chat_id,
                                            message_id: id,
                                            data: response.data.data
                                        })
                                    );
                            }
                        }}
                    >
                        <HandThumbDownIcon
                            fill={dislike ? "black" : "white"}
                            className="h-4 w-4"
                        />
                    </button>
                </Tooltip>

                <Tooltip title={titleCopyButton} arrow>
                    <button
                        className="flex items-center gap-1.5 rounded-md p-1 text-xs text-token-text-tertiary hover:text-token-text-primary  md:group-hover:visible md:group-[.final-completion]:visible"
                        onClick={() => {
                            handleCopy(answer, idx);
                        }}
                    >
                        {copyButtons[idx] ? (
                            <CheckIcon key={idx} className="h-4 w-4" />
                        ) : (
                            <ClipboardIcon key={idx} className="h-4 w-4" />
                        )}
                    </button>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default MessageAction;
