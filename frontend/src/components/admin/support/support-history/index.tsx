import React, { useState, useMemo, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ConversationRow from "components/chat/chat-sidebar/sidebar-content/conversation-list/conversation-row";
import {
  useFetchNextConversationList,
  useGetChatParams,
} from "hooks/conversation-hook";
import { IConversation } from "interfaces/database/conversation";

const SupportHistory = () => {
  const { data: conversationList = [] } = useFetchNextConversationList();
  const [hoveredId, setHoveredId] = useState<string>("");
  const theme = useTheme();
  const navigate = useNavigate();
  const { dialogId } = useGetChatParams();

  const categorizedConversations = useMemo(() => {
    const now = new Date();
    const msInADay = 24 * 60 * 60 * 1000;
    const categories: { [key: string]: IConversation[] } = {
      "Hôm nay": [],
      "Hôm qua": [],
      "7 ngày trước": [],
      "30 ngày trước": [],
    };

    conversationList.forEach((conversation: IConversation) => {
      const lastUpdated = new Date(conversation.update_date);
      const diffInDays = Math.floor(
        (now.getTime() - lastUpdated.getTime()) / msInADay
      );

      if (diffInDays === 0) categories["Hôm nay"].push(conversation);
      else if (diffInDays === 1) categories["Hôm qua"].push(conversation);
      else if (diffInDays <= 7) categories["7 ngày trước"].push(conversation);
      else if (diffInDays <= 30) categories["30 ngày trước"].push(conversation);
      else {
        const month = lastUpdated.toLocaleString("default", { month: "long" });
        const year = lastUpdated.getFullYear();
        const monthKey = `${month} ${year}`;

        if (!categories[monthKey]) {
          categories[monthKey] = [];
        }
        categories[monthKey].push(conversation);
      }
    });

    return categories;
  }, [conversationList]);

  const renderConversationList = useCallback(
    (conversationList: IConversation[], label: string) => (
      <React.Fragment key={label}>
        {conversationList.length > 0 && (
          <Typography
            padding="8px"
            marginTop="12px"
            variant="h6"
            fontSize="14px"
            color={theme.palette.text.secondary}
            fontWeight="bold"
          >
            {label}
          </Typography>
        )}
        {conversationList.map((conversation) => (
          <Box
            key={conversation.id}
            padding="12px"
            marginBottom="8px"
            bgcolor={hoveredId === conversation.id ? "lightgray" : "white"}
            borderRadius="8px"
            boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)"
            onMouseEnter={() => setHoveredId(conversation.id)}
            onMouseLeave={() => setHoveredId("")}
            onClick={() =>
              navigate(`/admin/support/${dialogId}/chat/${conversation.id}`)
            }
            sx={{ cursor: "pointer" }}
          >
            <ConversationRow
              {...conversation}
              selected_activate={hoveredId === conversation.id}
            />
          </Box>
        ))}
      </React.Fragment>
    ),
    [hoveredId, navigate, dialogId]
  );

  return (
    <Box
      sx={{
        marginLeft: "20px",

        height: "100vh",
        overflowY: "auto",
        padding: "16px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {Object.entries(categorizedConversations).map(
        ([label, conversationList]) =>
          renderConversationList(conversationList, label)
      )}
    </Box>
  );
};

export default SupportHistory;
