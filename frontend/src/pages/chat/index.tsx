import { Box, useTheme } from "@mui/material";
import ChatSideBar from "components/chat/chat-sidebar";
import ChatContainer from "components/chat/chat-container";
import { useState } from "react";
import { useAuth } from "hooks/auth-hook";

export const ChatPage = () => {
    const [openMobileSidebar, setOpenMobileSidebar] = useState<boolean>(false);
    const { isLogin } = useAuth();
    return (
        <Box display="flex">
            {isLogin && (<Box sx={(theme) => ({
                backgroundColor: theme.palette.background.paper
            })} height="100vh" overflow="hidden">
                <ChatSideBar 
                    openMobileSidebar={openMobileSidebar}
                    setOpenMobileSidebar={setOpenMobileSidebar}
                />
            </Box>)}
            <Box flex={1}  sx={(theme) => ({
                backgroundColor: theme.palette.background.default
            })}  overflow="hidden">
                <ChatContainer 
                    setOpenMobileSidebar={setOpenMobileSidebar}
                />
            </Box>
        </Box>
    );
};

export default ChatPage;
