import { Box } from "@mui/material";
import React from "react";
import NewConversation from "./new-conversation";
import ConversationList from "./conversation-list";
import OptionMenu from "./option-menu";

const SideBarContent: React.FC = () => {

    return (
        <Box className="p-2 flex flex-col h-screen">
            <NewConversation />
            <Box className="flex-1 overflow-auto" marginTop="10px">
                <ConversationList />
            </Box>
            <Box
                className="sticky"
                sx={{
                    padding: "10px 10px 0px",
                }}
            >
                
                <OptionMenu />
            </Box>
            
        </Box>
    );
};

export default SideBarContent;
