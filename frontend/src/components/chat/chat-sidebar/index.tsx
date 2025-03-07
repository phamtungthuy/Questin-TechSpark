import React from "react";
import { Box } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import SideBarContent from "./sidebar-content";

const drawerWidth = 250;

interface ChatSideBarProps {
  openMobileSidebar: boolean;
  setOpenMobileSidebar: (open: boolean) => void;
}

const ChatSideBar: React.FC<ChatSideBarProps> = ({
  openMobileSidebar,
  setOpenMobileSidebar,
}) => {
  return (
    <Box
      sx={{
        display: {
          xs: "none",
          md: "flex",
        },
      }}
    >
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          open={openMobileSidebar}
          onClose={() => setOpenMobileSidebar(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" }, // Changed from sm to md
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          <SideBarContent />
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" }, // Changed from sm to md
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          <SideBarContent />
        </Drawer>
      </Box>
    </Box>
  );
};

export default ChatSideBar;
