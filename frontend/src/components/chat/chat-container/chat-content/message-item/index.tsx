import { Avatar, Box, Typography, useTheme } from "@mui/material";
import MarkdownContent from "./markdown-content";
import AssistantGroupButton from "./assistant-group-button";
import { IMessage } from "interfaces/database/conversation";
import { useEffect, useMemo, useState, useRef } from "react";
import { sendMessageParams } from "hooks/chat-hook";
import ReplyButton from "./reply-button";

interface IProps {
  item: IMessage;
  avatar?: string;
  sendMessage: (params: sendMessageParams) => void;
  done?: boolean;
  onReply?: (content: string) => void;
}

const MessageItem = ({
  item,
  avatar,
  sendMessage,
  done = true,
  onReply,
}: IProps) => {
  const theme = useTheme();
  const [currentQAIndex, setCurrentQAIndex] = useState(item.qas.length - 1);
  const currentQA = item.qas[currentQAIndex];
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(
    currentQA.answer.length - 1
  );
  const currentAnswer = useMemo(
    () => currentQA.answer[currentAnswerIndex] || {},
    [currentQA.answer, currentAnswerIndex]
  );

  const [showReplyButton, setShowReplyButton] = useState(false);
  const [replyButtonPosition, setReplyButtonPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedText, setSelectedText] = useState("");

  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentQAIndex(item.qas.length - 1);
    setCurrentAnswerIndex(item.qas[item.qas.length - 1].answer.length - 1);
  }, [item.qas]);

  const messageMarkdownContent = useMemo(() => {
    return (
      <MarkdownContent
        reference={currentAnswer.reference || []}
        content={currentAnswer.content || ""}
        status={currentAnswer.status || ""}
        loading={false}
        think={currentAnswer.think || ""}
        citation={currentAnswer.citation || false}
        done={done}
      />
    );
  }, [currentAnswer]);

  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);

        if (
          answerRef.current &&
          answerRef.current.contains(range.commonAncestorContainer)
        ) {
          const rect = range.getBoundingClientRect();
          setReplyButtonPosition({
            x: rect.left,
            y: rect.top,
          });
          setSelectedText(selectedText);
          setShowReplyButton(true);
        } else {
          setShowReplyButton(false);
        }
      } else {
        setShowReplyButton(false);
      }
    }, 10);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleReply = () => {
    if (selectedText) {
      onReply?.(selectedText);
      setShowReplyButton(false);
      setSelectedText("");

      // Deselect the text
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  };

  if (item.qas.length === 0) {
    return null;
  }

  const role = item.role || "user";
  const answerRole = currentAnswer.role || "assistant";

  return (
    <>
      {showReplyButton && (
        <ReplyButton position={replyButtonPosition} onReply={handleReply} />
      )}
      {/* User Message Section */}
      {role === "user" && (
        <>
          <Box sx={{ textAlign: "right", padding: "24px 0" }}>
            <Box display="flex" alignItems="start" gap={1}>
              <Box flexGrow={1}>
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
                    {currentQA.question}
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ width: 40, height: 40 }} />
            </Box>
          </Box>
          {/* Assistant Message Section */}
          {answerRole === "assistant" && (
            <Box sx={{ textAlign: "left", padding: "24px 0" }}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <Avatar src="/ise_logo.png" sx={{ width: 40, height: 40 }} />
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
                    ref={answerRef}
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
                    {messageMarkdownContent}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Admin Message Section */}
      {role === "admin" && (
        <Box sx={{ textAlign: "left", padding: "24px 0" }}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Avatar src="/adm.png" sx={{ width: 40, height: 40 }} />
            <Box flex={1}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
                alignItems="center"
              >
                Đức Dương
              </Typography>
              <Box
                ref={answerRef}
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
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {currentQA?.answer?.[0]?.content}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default MessageItem;
