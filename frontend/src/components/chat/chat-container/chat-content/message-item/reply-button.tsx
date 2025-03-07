import { useEffect, useRef, useState } from "react";
import { Box, Button } from "@mui/material";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

interface ReplyButtonProps {
  onReply: () => void;
  position: { x: number; y: number };
}

const ReplyButton = ({ onReply, position }: ReplyButtonProps) => {
  const [visible, setVisible] = useState(true);

  const handleClick = () => {
    setVisible(false);
    onReply();
  };

  if (!visible) return null;

  return (
    <Button
      onMouseDown={onReply}
      startIcon={<ChatBubbleLeftIcon width={18} />}
      sx={{
        position: "fixed",
        left: position.x,
        top: position.y - 40,
        zIndex: 1000,
        backgroundColor: "white",
        color: "text.primary",
        borderRadius: 3,
        boxShadow: 2,
        fontSize: "0.875rem",
        fontWeight: 600,
        padding: "8px 16px",
        textTransform: "none",
        transition: "0.2s",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      Phản hồi
    </Button>
  );
};

export default ReplyButton;
