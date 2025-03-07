import { Box } from "@mui/material";
import MessageItem from "components/chat/chat-container/chat-content/message-item";
import ChatTopBar from "components/chat/chat-container/top-bar";
import { useFetchSharedMessageList } from "hooks/message-hook";
import { useGetChatParams } from "hooks/route-hook";
import { useEffect, useRef } from "react";

export const SharePage = () => {
    const { data: messageList } = useFetchSharedMessageList();

    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messageList]);

    return (
        <Box
            sx={(theme) => ({
                backgroundColor: theme.palette.background.default,
            })}
            overflow="hidden"
            className="flex flex-col h-screen"
            display="relative"
        >
            <ChatTopBar
                setOpenMobileSidebar={() => {}}
                removeCurrentChatting={() => {}}
            />
            <Box
                sx={{
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
                width="100%"
            >
                <Box className="w-11/12 sm:w-3/5"
                    marginX="auto"
                >
                    <Box display="flex" flexDirection="column">
                        {messageList.map((message, i) => {
                            return (
                                <MessageItem
                                    item={message}
                                    key={i}
                                    enableFeedback={false}
                                />
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
