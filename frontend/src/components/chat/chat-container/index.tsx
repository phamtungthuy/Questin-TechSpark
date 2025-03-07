import { Box } from "@mui/material";
import ChatContent from "./chat-content";
import ChatInput from "./chat-input";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useGetChatParams } from "hooks/conversation-hook";
import ChatExample from "./chat-example";
import { useSendNextMessage } from "hooks/chat-hook";
import { useAuth } from "hooks/auth-hook";
import ChatTopBar from "./top-bar";
import { IMessage } from "interfaces/database/conversation";

interface ChatContainerProps {
  setOpenMobileSidebar: Dispatch<SetStateAction<boolean>>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  setOpenMobileSidebar,
}) => {
  const { conversationId } = useGetChatParams();
  const { answer, sendMessage, done, removeCurrentChatting } =
    useSendNextMessage();
  const { isLogin } = useAuth();

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);
  const [replyContent, setReplyContent] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [messageList, setMessageList] = useState<IMessage[]>([]);

  const resetReplyContent = () => {
    setReplyContent("");
  };

  // useEffect(() => {
  //   if (conversationId) {
  //     const backendHost =
  //       process.env.REACT_APP_BACKEND_HOST || "http://localhost:8000";
  //     const backendUrl = new URL(backendHost);
  //     const wsProtocol = backendUrl.protocol === "https:" ? "wss" : "ws";
  //     const wsHost = backendUrl.host;
  //     const wsUrl = `${wsProtocol}://${wsHost}/ws/v1/chat/${conversationId}`;
  //     const ws = new WebSocket(wsUrl);
  //     console.log("Connecting to WebSocket at:", wsUrl);

  //     ws.onopen = () => {
  //       console.log("WebSocket connected");
  //       setWs(ws);
  //     };
  //     ws.onmessage = (event) => {
  //       console.log("Message from server:", event.data);
  //     };
  //     ws.onerror = (error) => {
  //       console.error("WebSocket error:", error);
  //     };

  //     return () => {
  //       ws.close();
  //     };
  //   }
  // }, [conversationId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100;

      if (isNearBottom || container.scrollHeight < prevScrollHeight.current) {
        endOfMessagesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }

      prevScrollHeight.current = container.scrollHeight;
    }
  }, [answer, done]);

  const handleReply = (content: string) => {
    setReplyContent(content);
  };

  return (
    <Box
      className="flex flex-col h-screen"
      display="relative"
      overflow="hidden"
    >
      <ChatTopBar
        setOpenMobileSidebar={setOpenMobileSidebar}
        removeCurrentChatting={removeCurrentChatting}
      />
      <Box flex="1" overflow="hidden" display="flex">
        {conversationId ? (
          <Box
            sx={{
              overflowY: "auto",
              overflowX: "hidden",
            }}
            width="100%"
            ref={chatContainerRef}
          >
            <Box
              sx={{
                width: {
                  xs: "95%",
                  sm: "80%",
                  md: "75%",
                  lg: "60%",
                  xl: "50%",
                },
                mx: "auto",
              }}
            >
              <ChatContent
                done={done}
                sendMessage={sendMessage}
                onReply={handleReply}
                ws={ws}
                isConsulting={isConsulting}
                setIsConsulting={setIsConsulting}
                messageList={messageList}
                setMessageList={setMessageList}
              />
              <div ref={endOfMessagesRef} />
            </Box>
          </Box>
        ) : (
          <ChatExample done={done} sendMessage={sendMessage} />
        )}
      </Box>
      <Box
        width="100%"
        overflow="hidden"
        margin="auto"
        display="flex"
        flexDirection="column"
        sx={{
          paddingY: "10px",
        }}
      >
        <Box overflow="hidden">
          <ChatInput
            done={done}
            sendMessage={sendMessage}
            replyContent={replyContent}
            resetReplyContent={resetReplyContent}
            isConsulting={isConsulting}
            setIsConsulting={setIsConsulting}
            messageList={messageList}
            setMessageList={setMessageList}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatContainer;
