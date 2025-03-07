import {
  Box,
  IconButton,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material";
import { ColorModeContext } from "store/theme";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const itemList = [
  {
    text: "Knowledge Base",
    icon: <i className="fa-regular fa-database" style={{ fontSize: "22px" }} />,
    route: "/admin/knowledge",
  },
  {
    text: "Dialog",
    icon: (
      <i className="fa-regular fa-layer-group" style={{ fontSize: "20px" }} />
    ),
    route: "/admin/chat",
  },
  {
    text: "Support",
    icon: <i className="fa-regular fa-headset" style={{ fontSize: "22px" }} />,
    route: "/admin/support",
  },
  {
    text: "Agent",
    icon: (
      <i className="fa-regular fa-message-bot" style={{ fontSize: "21px" }} />
    ),
    route: "/admin/agent",
  },
  {
    text: "Integration",
    icon: <i className="fa-regular fa-link" style={{ fontSize: "20px" }} />,
    route: "/admin/integration",
  },
];

const AdminTopBar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Custom Colors
  const activeColor = theme.palette.mode === "dark" ? "#ff9800" : "#0057d9";
  const hoverColor = theme.palette.mode === "dark" ? "#ffcc80" : "#1976d2";
  const bgColor =
    theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.9)" : "#f5f5f5";
  const textColor = theme.palette.mode === "dark" ? "#ffffff" : "#333333";

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      px={4}
      py={1}
      bgcolor={bgColor}
      boxShadow={4}
      sx={{
        backdropFilter: "blur(10px)",
        transition: "background 0.3s ease-in-out",
      }}
    >
      {/* Logo & Title */}
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        sx={{ cursor: "pointer" }}
        onClick={() => navigate("/admin")}
      >
        <Box component="img" height="40px" src="/questin.png" />
      </Box>

      {/* Navigation Menu */}
      <MenuList
        sx={{ display: "flex", flexDirection: "row", gap: 3, padding: 0 }}
      >
        {itemList.map((item, index) => (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            key={index}
          >
            <MenuItem
              onClick={() => navigate(item.route)}
              selected={location.pathname.includes(item.route)}
              sx={{
                color: location.pathname.includes(item.route)
                  ? activeColor
                  : textColor,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                transition: "all 0.3s ease-in-out",
                fontWeight: location.pathname.includes(item.route)
                  ? "bold"
                  : "normal",
                "&:hover": { color: "white", bgcolor: hoverColor },
                "&.Mui-selected": {
                  color: "white",
                  bgcolor: activeColor,
                },
                "&.Mui-selected:hover": {
                  bgcolor: activeColor,
                  color: "white",
                },
                display: "flex",
                alignItems: "center",
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText>{item.text}</ListItemText>
            </MenuItem>
          </motion.div>
        ))}
      </MenuList>

      {/* Theme Toggle & Settings */}
      <Box display="flex" gap={2}>
        <IconButton
          onClick={colorMode.ToggleColorMode}
          sx={{
            transition: "all 0.3s ease",
            color: textColor,
            "&:hover": { color: hoverColor },
          }}
        >
          <motion.div whileHover={{ rotate: 20 }}>
            {theme.palette.mode === "dark" ? (
              <i className="fa-regular fa-moon"></i>
            ) : (
              <i className="fa-regular fa-brightness"></i>
            )}
          </motion.div>
        </IconButton>
        <IconButton
          onClick={() => navigate("/admin/settings/profile")}
          sx={{
            transition: "all 0.3s ease",
            color: textColor,
            "&:hover": { color: hoverColor },
          }}
        >
          <i className="fa-regular fa-gear" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default AdminTopBar;
