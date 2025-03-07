import {
  Avatar,
  Box,
  Button,
  IconButton,
  Input,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/solid";
import { IMessage } from "interfaces/database/conversation";
import { useParams } from "react-router-dom";
import MarkdownContent from "components/chat/chat-container/chat-content/message-item/markdown-content";

interface SupportChatProps {
  chatHistory: any[];
  ws: WebSocket | null;
  setChatHistory: React.Dispatch<React.SetStateAction<IMessage[]>>;
}

const SupportChat = ({ chatHistory, ws, setChatHistory }: SupportChatProps) => {
  const [message, setMessage] = useState("");
  const theme = useTheme();
  const { dialogId, conversationId } = useParams();
  console.log(conversationId);
  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(
        JSON.stringify({
          type: "message",
          sender: "admin",
          content: message,
          dialogId: dialogId,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
        })
      );

      const newMessage: IMessage = {
        id: Date.now().toString(),
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        conversation_id: "",
        dialog_id: "",
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
                content: message,
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

      setChatHistory((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box overflow="auto" height="80%">
        {[...chatHistory]
          .sort((a, b) => new Date(a.create_date) - new Date(b.create_date))
          .map((msg) =>
            msg.qas.map((qa) => {
              if (msg.role === "admin") {
                return qa.answer.map((ans, ansIndex) => (
                  <Box
                    key={ans.id || `${qa.id}-ans-${ansIndex}`}
                    sx={{ textAlign: "right", p: 3 }}
                  >
                    <Box display="flex" alignItems="start" gap={1}>
                      <Box flex={1}>
                        <Box
                          sx={{
                            padding: "12px 24px",
                            borderRadius: 4,
                            display: "inline-block",
                            bgcolor: theme.palette.background.paper,
                            maxWidth: "80%",
                            textAlign: "left",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-line" }}
                            justifyContent="start"
                          >
                            {ans.content}
                          </Typography>
                        </Box>
                      </Box>
                      <Avatar src="/adm.png" sx={{ width: 40, height: 40 }} />
                    </Box>
                  </Box>
                ));
              }

              if (msg.role === "user") {
                return qa.answer.map((ans, ansIndex) => (
                  <Box
                    key={ans.id || `${qa.id}-ans-${ansIndex}`}
                    sx={{ textAlign: "left", p: 3 }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Avatar sx={{ width: 40, height: 40 }} />
                      <Box flex={1}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                          alignItems="center"
                        >
                          User
                        </Typography>
                        <Box
                          sx={{
                            borderRadius: 4,
                            display: "inline-block",
                            maxWidth: {
                              xs: "80%",
                              md: "100%",
                            },
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ whiteSpace: "pre-line" }}
                          >
                            {ans.content}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ));
              }

              return (
                <div key={qa.id}>
                  {qa.question && (
                    <Box sx={{ textAlign: "left", p: 3 }}>
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Avatar sx={{ width: 40, height: 40 }} />
                        <Box flex={1}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: "16px",
                              fontWeight: "bold",
                            }}
                            alignItems="center"
                          >
                            User
                          </Typography>
                          <Box
                            sx={{
                              borderRadius: 4,
                              display: "inline-block",
                              maxWidth: {
                                xs: "80%",
                                md: "100%",
                              },
                              width: "100%",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ whiteSpace: "pre-line" }}
                            >
                              {qa.question}{" "}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  {qa.answer.map((ans, ansIndex) => (
                    <Box
                      key={ans.id || `${qa.id}-ans-${ansIndex}`}
                      sx={{ textAlign: "left", p: 3 }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Avatar
                          src="/ise_logo.png"
                          sx={{ width: 40, height: 40 }}
                        />
                        <Box flex={1}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: "16px",
                              fontWeight: "bold",
                            }}
                            alignItems="center"
                          >
                            Questin
                          </Typography>
                          <Box
                            sx={{
                              borderRadius: 4,
                              display: "inline-block",
                              maxWidth: {
                                xs: "80%",
                                md: "100%",
                              },
                              width: "100%",
                            }}
                          >
                            {/* <Typography
                              variant="body1"
                              sx={{ whiteSpace: "pre-line" }}
                            >
                              {ans.content}
                            </Typography> */}

                            <MarkdownContent
                              reference={ans.reference || []}
                              content={ans.content}
                              status={ans.status || ""}
                              loading={false}
                              think={ans.think || ""}
                              citation={ans.citation || false}
                              done={true}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </div>
              );
            })
          )}
      </Box>
      {/* <Box
        display="flex"
        alignItems="center"
        gap={1}
        p={1}
        borderRadius="26px"
        bgcolor={theme.palette.action.hover}
        boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)"
        width="100%"
      >
        <Input
          fullWidth
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.substring(0, 1024))}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disableUnderline
          sx={{
            fontSize: "16px",
            px: 2,
          }}
        />
        <IconButton
          onClick={sendMessage}
          sx={{
            backgroundColor: "#4e6df4",
            color: "#fff",
            borderRadius: "50%",
            p: 1.2,
            transition: "none",
            "&:hover": {
              backgroundColor: "#4e6df4",
              opacity: 0.8,
            },
          }}
        >
          <ArrowUpIcon className="h-5 w-5" />
        </IconButton>
      </Box> */}

      <Box
        sx={{
          // width: {
          //   xs: "95%",
          //   sm: "80%",
          //   md: "75%",
          //   lg: "60%",
          //   xl: "50%",
          // },
          width: "100%",
          marginX: "auto",
          borderRadius: "26px",
          position: "relative",
          boxShadow:
            "0 9px 9px 0 rgba(0, 0, 0, 0.05), 0 2px 5px 0 rgba(0, 0, 0, 0.1)",
          overflow: "auto",
          border: "2px solid #e0e0e0",
          p: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Input
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value.substring(0, 1024))}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disableUnderline
          sx={{
            fontSize: "16px",
            px: 2,
            borderRadius: "26px",
            "& .MuiInput-input": {
              py: 1,
            },
          }}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!message}
          sx={{
            backgroundColor: "black",
            color: "#fff",
            borderRadius: "50%",
            p: 1.2,
            transition: "opacity 0.2s",
            "&:hover": {
              opacity: 0.7,
              backgroundColor: "black",
            },
            "&:disabled": {
              backgroundColor: "#B0B0B0",
              opacity: 1,
            },
          }}
        >
          <i
            className="fa-regular fa-arrow-up"
            style={{
              fontSize: "18px",
            }}
          ></i>
        </IconButton>
      </Box>
    </Box>
  );
};

export default SupportChat;
