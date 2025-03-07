import { Avatar, Box, Button, Typography, useTheme } from "@mui/material";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useFetchNextMessageList } from "hooks/message-hook";
import MessageItem from "./message-item";
import {
  useFetchNextQuestionList,
  useFetchNextQuestionListBySearch,
} from "hooks/question-hook";
import { useGetChatParams } from "hooks/conversation-hook";
import { sendMessageParams } from "hooks/chat-hook";

interface IProps {
  done: boolean;
  sendMessage: (params: sendMessageParams) => void;
  onReply?: (content: string) => void;
  ws: WebSocket | null;
  isConsulting: boolean;
  setIsConsulting: Dispatch<SetStateAction<boolean>>;
}

const HelloMessage = {
  content: `Xin chào tôi là **iSE Questin**, tôi có thể giúp được gì cho bạn về các thông tin tuyển sinh của *Trường Đại học Công nghệ - ĐHQGHN năm 2025*.
\
\

*Lưu ý*: **iSE Questin** tập trung trả lời các thông tin tuyển sinh và có thể sai, vui lòng kiểm tra các thông tin quan trọng!
`,
  role: "assistant",
};

const ChatContent = ({
  done,
  sendMessage,
  onReply,
  ws,
  isConsulting,
  setIsConsulting,
  messageList,
  setMessageList,
}: IProps) => {
  const { data: initialMessageList } = useFetchNextMessageList();

  useEffect(() => {
    if (initialMessageList) {
      setMessageList(initialMessageList);
    }
  }, [initialMessageList]);
  console.log("initialMessageList:", initialMessageList);
  console.log("messageList:", messageList);
  const { data: questionList } = useFetchNextQuestionListBySearch();
  const { conversationId, dialogId } = useGetChatParams();

  const theme = useTheme();

  const handleClickExistQuestion = async (input: string) => {
    if (!done) {
      return;
    }
    await sendMessage({
      query: input,
      conversation_id: conversationId || dialogId,
      history: messageList,
    });
  };

  const sortedMessageList = [...messageList].sort((a, b) => {
    const dateA = new Date(a.create_date).getTime();
    const dateB = new Date(b.create_date).getTime();
    return dateB - dateA;
  });

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="column-reverse">
        {sortedMessageList.length > 0 ? (
          sortedMessageList.map((message, i) => (
            <Box key={i}>
              <MessageItem
                sendMessage={sendMessage}
                item={message}
                done={i === 0 ? done : true}
                onReply={onReply}
              />
            </Box>
          ))
        ) : (
          <></>
        )}
      </Box>

      {done && questionList.length > 0 && (
        <Box display="flex" justifyContent="flex-start" gap="16px">
          <Box
            padding="10px 12px"
            borderRadius="24px"
            maxWidth="80%"
            sx={{
              float: "right",
            }}
            display="flex"
            flexDirection="column"
            gap="10px"
            alignItems={"flex-end"}
          >
            {questionList.map((question) => (
              <Box
                onClick={() =>
                  handleClickExistQuestion(question.content_with_weight)
                }
                key={question.content_with_weight}
                sx={{
                  "&:hover": {
                    color: "primary.main",
                  },
                }}
              >
                <Button
                  sx={{
                    backgroundColor: theme.palette.action.active,
                    paddingX: "8px",
                    borderRadius: "16px",
                    height: "3.2rem",
                    color:
                      theme.palette.mode === "dark"
                        ? "primary.main"
                        : "grey.100",
                    "&:hover": {
                      color: "primary.main",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? "primary.main"
                          : "inherit",
                      whiteSpace: "pre-line",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      maxWidth: "100%",
                    }}
                  >
                    {question.content_with_weight}
                  </Typography>
                </Button>
              </Box>
            ))}
          </Box>
          <Avatar
            sx={{
              size: 40,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ChatContent;
