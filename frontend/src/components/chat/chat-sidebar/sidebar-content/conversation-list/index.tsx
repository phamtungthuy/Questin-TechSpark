import React, { useState, useMemo, useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import ConversationRow from "./conversation-row";
import { useFetchNextConversationList, useGetChatParams } from "hooks/conversation-hook";
import { IConversation } from "interfaces/database/conversation";

const ConversationList = () => {
    const { conversationId } = useGetChatParams();
    const { data: conversationList = [] } = useFetchNextConversationList();
    const [hoveredId, setHoveredId] = useState<string>("");
    const theme = useTheme();

    const categorizedConversations = useMemo(() => {
        const now = new Date();
        const msInADay = 24 * 60 * 60 * 1000;
        const categories: { [key: string]: IConversation[] } = {
            "Hôm nay": [] as IConversation[],
            "Hôm qua": [] as IConversation[],
            "7 ngày trước": [] as IConversation[],
            "30 ngày trước": [] as IConversation[]
        };

        conversationList.forEach((conversation: IConversation) => {
            const lastUpdated = new Date(conversation.update_date);
            const diffInDays = Math.floor((now.getTime() - lastUpdated.getTime()) / msInADay);
            
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
                        marginTop="24px"
                        variant="h6"
                        fontSize="12px"
                        color={theme.palette.text.secondary}
                        fontWeight="bold"
                    >
                        {label}
                    </Typography>
                )}
                {conversationList.map((conversation) => (
                    <Box
                        key={conversation.id}
                        onMouseEnter={() => setHoveredId(conversation.id)}
                        onMouseLeave={() => setHoveredId("")}
                    >
                        <ConversationRow
                            {...conversation}
                            selected_activate={conversationId === conversation.id || hoveredId === conversation.id}
                        />
                    </Box>
                ))}
            </React.Fragment>
        ),
        [conversationId, hoveredId]
    );

    return (
        <Box>
            {Object.entries(categorizedConversations).map(
                ([label, conversationList]) => renderConversationList(conversationList, label)
            )}
        </Box>
    );
};

export default ConversationList;
