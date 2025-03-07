import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import React, { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";

const drawerWidth = 250;

interface ChatContainerTopbarProps {
  setOpenMobileSidebar: Dispatch<SetStateAction<boolean>>;
}

const ChatContainerTopbar: React.FC<ChatContainerTopbarProps> = ({
  setOpenMobileSidebar,
}) => {
  const navigate = useNavigate();

  return (
    <AppBar
      elevation={0}
      position="relative"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        background: "white",
        color: "black",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setOpenMobileSidebar((open) => !open)}
          sx={{ mr: 0, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          maxHeight="50px"
          minHeight="65px"
          // width="100%"
          position="sticky"
          sx={{
            // backgroundColor: "#FFFFFF",
            zIndex: 2,
          }}
          paddingX="20px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width={"100%"}
        >
          <div></div>
          <Box
            display="flex"
            flexDirection="row"
            gap="10px"
            sx={{
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <img
              className="h-10 w-10 rounded-full"
              src="/ise_logo.png"
              alt="ise"
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatContainerTopbar;
