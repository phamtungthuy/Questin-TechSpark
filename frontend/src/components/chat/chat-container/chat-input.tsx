import {
  ArrowUpIcon,
  PlusCircleIcon,
  StopIcon,
} from "@heroicons/react/24/solid";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Box, IconButton, Typography, useTheme, Button } from "@mui/material";
import {
  useGetChatParams,
  useSetNextConversation,
} from "hooks/conversation-hook";
import { useFetchNextMessageList } from "hooks/message-hook";
import { Input } from "components/ui/textarea";
import { useTranslate } from "hooks/common-hook";
import { useAuth } from "hooks/auth-hook";
import { sendMessageParams } from "hooks/chat-hook";
import { Menu } from "components/ui/menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReply, faTimes } from "@fortawesome/free-solid-svg-icons";
import { IMessage } from "interfaces/database/conversation";

interface IProps {
  done: boolean;
  sendMessage: (params: sendMessageParams) => void;
  replyContent?: string;
  resetReplyContent: () => void;
  isConsulting: boolean;
  setIsConsulting: Dispatch<SetStateAction<boolean>>;
  messageList: IMessage[];
  setMessageList: Dispatch<SetStateAction<IMessage[]>>;
}

const ChatInput = ({
  done,
  sendMessage,
  replyContent,
  resetReplyContent,
  isConsulting,
  setIsConsulting,
  messageList,
  setMessageList,
}: IProps) => {
  const [query, setQuery] = useState<string>("");
  const [isReasoning, setIsReasoning] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { conversationId, dialogId } = useGetChatParams();
  const { t } = useTranslate("chat");
  const { setConversation } = useSetNextConversation();
  const theme = useTheme();
  const { isLogin } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);

  const sendMessageToAdmin = (message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(
        JSON.stringify({
          type: "message",
          sender: "user",
          content: message,
          dialogId: dialogId,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
        })
      );
      console.log("Message sent to admin:", message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  };

  useEffect(() => {
    let ws: WebSocket | null = null;

    if (isConsulting && conversationId) {
      const backendHost =
        process.env.REACT_APP_BACKEND_HOST || "http://localhost:8000";
      const backendUrl = new URL(backendHost);
      const wsProtocol = backendUrl.protocol === "https:" ? "wss" : "ws";
      const wsHost = backendUrl.host;
      const wsUrl = `${wsProtocol}://${wsHost}/ws/v1/chat/${conversationId}`;
      const ws = new WebSocket(wsUrl);
      console.log("Connecting to WebSocket at:", wsUrl);

      ws.onopen = () => {
        console.log("Connected to WebSocket room:", conversationId);
        setWs(ws);
      };

      ws.onmessage = (event) => {
        console.log("Message from server:", event.data);

        const data = JSON.parse(event.data);

        if (data.sender === "admin") {
          const newMessage: IMessage = {
            id: Date.now().toString(),
            create_date: new Date().toISOString(),
            update_date: new Date().toISOString(),
            conversation_id: conversationId,
            dialog_id: dialogId,
            type: "admin",
            role: "admin",
            qas: [
              {
                id: Date.now().toString(),
                create_date: new Date().toISOString(),
                update_date: new Date().toISOString(),
                message_id: "",
                question: "",
                answer: [
                  {
                    id: Date.now().toString(),
                    create_date: new Date().toISOString(),
                    update_date: new Date().toISOString(),
                    content: data.content,
                    think: "",
                    reference: {},
                    thumb: "0",
                    feedback: "",
                    status: "",
                    citation: false,
                  },
                ],
              },
            ],
          };

          setMessageList((prev) => [...prev, newMessage]);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }

    return () => {
      if (isConsulting && ws) {
        console.log("Closing WebSocket");
        ws.close();
        setWs(null);
      }
    };
  }, [isConsulting, conversationId]);

  const handleConsultantSupport = async () => {
    setIsConsulting(!isConsulting);
  };

  const uploadMenuItems = [
    {
      label: "Tải lên từ thiết bị",
      value: "device",
      onClick: () => {
        // Upload file from device
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*";
        input.multiple = true;

        input.onchange = (event: Event) => {
          const target = event.target as HTMLInputElement;
          if (target.files) {
            const newSelectedFiles = Array.from(target.files);
            // Append to selectedFiles and remove duplicates
            setSelectedFiles((prevFiles) => {
              return [...prevFiles, ...newSelectedFiles].filter(
                (file, index, self) =>
                  index === self.findIndex((f) => f.name === file.name)
              );
            });
          }
        };
        input.click();
      },
    },
    {
      label: "Tải lên từ Google Drive",
      value: "drive",
      onClick: () => {},
    },
  ];

  const sendForm = async (e: any) => {
    e.preventDefault();
    if (!done) {
      return;
    }
    if (!query) return;
    if (query.trim() === "") return;

    let currentConversationId = conversationId;
    if (!conversationId) {
      const data = await setConversation({
        is_new: true,
      });
      if (data.retcode === 0) {
        currentConversationId = data.data.id;
      }
    }

    const finalQuery = replyContent ? `${replyContent}\n\n${query}` : query;
    const finalSelectedFiles = selectedFiles;
    console.log(finalQuery);

    setQuery("");
    setSelectedFiles([]);
    resetReplyContent();

    if (!isConsulting) {
      await sendMessage({
        query: finalQuery,
        files: finalSelectedFiles,
        conversation_id: currentConversationId,
        history: messageList,
      });
    } else {
      sendMessageToAdmin(finalQuery);

      const newMessage: IMessage = {
        id: Date.now().toString(),
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        conversation_id: currentConversationId,
        dialog_id: dialogId,
        type: "user",
        qas: [
          {
            id: Date.now().toString(),
            create_date: new Date().toISOString(),
            update_date: new Date().toISOString(),
            message_id: "",
            question: finalQuery,
            answer: [
              {
                id: Date.now().toString(),
                create_date: new Date().toISOString(),
                update_date: new Date().toISOString(),
                content:
                  "Vui lòng chờ một chút, người tư vấn sẽ hỗ trợ bạn ngay.",
                think: "",
                reference: {},
                thumb: "0",
                feedback: "",
                status: "",
                citation: false,
              },
            ],
          },
        ],
      };

      setMessageList((prev) => [...prev, newMessage]);
      console.log("Updated messageList:", messageList);
    }
  };

  const onEnterPress = (e: any) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() !== "") {
        sendForm(e);
      }
    }
  };

  const leftIcons = (
    <Box
      display="flex"
      gap={{ xs: 0.5, sm: 1 }}
      alignItems="center"
      marginBottom="6px"
      marginLeft={{ xs: "4px", sm: "8px" }}
    >
      {/* Upload Menu Button */}
      <Menu
        items={uploadMenuItems}
        trigger={
          <IconButton
            size="small"
            sx={{
              marginRight: { xs: "4px", sm: "8px" },
              border: "2px solid rgba(0, 0, 0, 0.4)",
              borderRadius: "50%",
              width: { xs: "26px", sm: "32px" },
              height: { xs: "26px", sm: "32px" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.1s ease-in-out",
              "&:hover": {
                backgroundColor: "rgb(235, 235, 235)",
              },
            }}
          >
            <i
              className="fa-regular fa-plus"
              style={{ fontSize: "14px", opacity: 0.7 }}
            ></i>
          </IconButton>
        }
        paperPosition={false}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        menuProps={{ PaperProps: { sx: { marginBottom: "14px" } } }}
      />

      {/* Reasoning Button */}
      <Button
        onClick={() => setIsReasoning(!isReasoning)}
        startIcon={
          <i
            className="fa-regular fa-lightbulb"
            style={{ fontSize: "14px", opacity: isReasoning ? 1 : 0.7 }}
          ></i>
        }
        sx={{
          height: { xs: "28px", sm: "32px" },
          minWidth: { xs: "80px", sm: "auto" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          padding: { xs: "0px 10px", sm: "0px 16px" },
          fontSize: { xs: "11px", sm: "13px", md: "14px" },
          fontWeight: 500,
          opacity: isReasoning ? 1 : 0.7,
          transition: "all 0.1s ease-in-out",
          border: isReasoning
            ? "2px solid transparent"
            : "2px solid rgba(0, 0, 0, 0.4)",
          backgroundColor: isReasoning ? "#DAEEFF" : "transparent",
          color: isReasoning ? "#0F62FE" : theme.palette.text.primary,
          "&:hover": {
            backgroundColor: isReasoning ? "#BDDCF4" : "rgb(235, 235, 235)",
          },
          ...(theme.palette.mode === "dark" && {
            backgroundColor: isReasoning ? "#2A4A6D" : "transparent",
            color: isReasoning ? "#48AAFF" : theme.palette.text.primary,
            "&:hover": {
              backgroundColor: isReasoning
                ? "#1A416A"
                : theme.palette.action.hover,
            },
          }),
        }}
      >
        Suy luận
      </Button>

      {/* Consultant Support Button */}
      <Button
        onClick={handleConsultantSupport}
        startIcon={
          <i
            className="fa-regular fa-headset"
            style={{ fontSize: "14px", opacity: isConsulting ? 1 : 0.7 }}
          ></i>
        }
        sx={{
          height: { xs: "28px", sm: "32px" },
          minWidth: { xs: "80px", sm: "auto" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          padding: { xs: "0px 10px", sm: "0px 16px" },
          fontSize: { xs: "11px", sm: "13px", md: "14px" },
          fontWeight: 500,
          opacity: isConsulting ? 1 : 0.7,
          transition: "all 0.1s ease-in-out",
          border: isConsulting
            ? "2px solid transparent"
            : "2px solid rgba(0, 0, 0, 0.4)",
          backgroundColor: isConsulting ? "#DAEEFF" : "transparent",
          color: isConsulting ? "#0F62FE" : theme.palette.text.primary,
          "&:hover": {
            backgroundColor: isConsulting ? "#BDDCF4" : "rgb(235, 235, 235)",
          },
          ...(theme.palette.mode === "dark" && {
            backgroundColor: isConsulting ? "#2A4A6D" : "transparent",
            color: isConsulting ? "#48AAFF" : theme.palette.text.primary,
            "&:hover": {
              backgroundColor: isConsulting
                ? "#1A416A"
                : theme.palette.action.hover,
            },
          }),
        }}
      >
        Tư vấn trực tiếp
      </Button>
    </Box>
  );

  return (
    <Box>
      <Box
        sx={{
          width: {
            xs: "95%",
            sm: "80%",
            md: "75%",
            lg: "60%",
            xl: "50%",
          },
          maxWidth: "800px",
          marginX: "auto",
          marginY: "auto",
          marginBottom: "8px",
          borderRadius: "26px",
          position: "relative",
          boxShadow:
            "0 9px 9px 0 rgba(0, 0, 0, 0.05), 0 2px 5px 0 rgba(0, 0, 0, 0.1)",
          overflow: "auto",
          border: "2px solid #e0e0e0",
        }}
      >
        {replyContent && (
          <Box
            sx={{
              mb: 1,
              p: 2,
              borderLeft: "4px solid",
              borderColor: "primary.main",
              backgroundColor: "action.hover",
              borderRadius: 1,
              fontSize: "0.875rem",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <FontAwesomeIcon
              icon={faReply}
              style={{ transform: "rotate(180deg)" }}
            />
            <Typography
              sx={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                opacity: 0.8,
                textAlign: "start",
              }}
            >
              {replyContent}
            </Typography>
            <FontAwesomeIcon
              icon={faTimes}
              onClick={resetReplyContent}
              style={{
                cursor: "pointer",
                fontSize: "1rem",
                color: "text.secondary",
              }}
            />
          </Box>
        )}

        <Input
          style={{
            paddingBottom: "20px",
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value.substring(0, 1024))}
          fullWidth
          sx={{
            backgroundColor: theme.palette.action.hover,
            borderRadius: "26px",
          }}
          leftIcons={leftIcons}
          rightIcons={
            <IconButton
              edge="end"
              className="bg-black hover:opacity-50 text-white font-bold p-1.5 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={sendForm}
              sx={{
                width: { xs: "26px", sm: "32px" },
                height: { xs: "26px", sm: "32px" },
                border: "none",
                marginRight: { xs: "4px", sm: "8px" },
                marginBottom: "8px",
                backgroundColor: query !== "" || !done ? "black" : "#B0B0B0",
                color: "white",
                borderRadius: "50%",
                "&:hover": {
                  opacity: query !== "" || !done ? 0.7 : 1,
                  backgroundColor: query !== "" || !done ? "black" : "#B0B0B0",
                },
              }}
            >
              {!done ? (
                <StopIcon
                  className="h-5 w-5"
                  color={query !== "" || !done ? "#fff" : "inherit"}
                />
              ) : (
                <i
                  className="fa-regular fa-arrow-up"
                  style={{
                    fontSize: "18px",
                    color: query !== "" || !done ? "#fff" : "inherit",
                  }}
                ></i>
              )}
            </IconButton>
          }
          placeholder={t("sendPlaceholder")}
          onKeyDown={onEnterPress}
          maxRows={10}
          disabled={!done}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      </Box>

      <Typography
        textAlign="center"
        padding="6px 0px 0px"
        sx={{
          display: { xs: "block", sm: "block" },
          fontSize: {
            xs: "10px",
            sm: "12px",
            md: "14px",
            lg: "15px",
            xl: "16px",
          },
          paddingBottom: 1,
        }}
      >
        Questin có thể mắc sai lầm. Vui lòng kiểm tra lại thông tin quan trọng.
      </Typography>
    </Box>
  );
};

export default ChatInput;
