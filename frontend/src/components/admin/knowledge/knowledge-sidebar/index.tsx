import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useLocation, useNavigate } from "react-router-dom";
import { useFetchCurrentKnowledge } from "hooks/knowledge-hook";
import {
  DocumentChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const menuItems = [
  {
    label: "Cluster",
    icon: <DocumentChartBarIcon className="w-6 h-6 text-blue-500" />,
    path: "cluster",
  },
  {
    label: "Retrieval Testing",
    icon: <MagnifyingGlassCircleIcon className="w-6 h-6 text-green-500" />,
    path: "testing",
  },
  {
    label: "Configuration",
    icon: <Cog6ToothIcon className="w-6 h-6 text-purple-500" />,
    path: "configuration",
  },
];

const KnowledgeSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: knowledge } = useFetchCurrentKnowledge();
  if (!knowledge) {
    return null;
  }

  const handleNavigate = (path: string) => {
    if (!location.pathname.includes(path)) {
      navigate(`/admin/knowledge/${path}?id=${knowledge.id}`);
    }
  };

  return (
    <Box
      padding="32px 24px 24px"
      bgcolor="#f9fafb"
      height="100vh"
      borderRight="1px solid #e0e0e0"
    >
      <Box
        paddingBottom="20px"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Avatar sx={{ bgcolor: "#4F46E5", width: 56, height: 56 }}>
          <PersonIcon sx={{ color: "white" }} />
        </Avatar>
        <Typography
          fontWeight="bold"
          fontSize="18px"
          marginTop="10px"
          color="#333"
        >
          {knowledge.name}
        </Typography>
      </Box>
      <Divider sx={{ border: "1px dashed #ccc", marginBottom: "10px" }} />
      <Box>
        <MenuList>
          {menuItems.map(({ label, icon, path }) => (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              key={path}
            >
              <MenuItem
                sx={{
                  borderRadius: "10px",
                  marginBottom: "5px",
                  transition: "background 0.3s ease",
                  "&:hover": { backgroundColor: "#eef2ff" },
                  "&.Mui-selected": { backgroundColor: "#e0e7ff" },
                }}
                selected={location.pathname.includes(path)}
                onClick={() => handleNavigate(path)}
              >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText>
                  <Typography fontWeight="bold" fontSize="16px" color="#374151">
                    {label}
                  </Typography>
                </ListItemText>
              </MenuItem>
            </motion.div>
          ))}
        </MenuList>
      </Box>
    </Box>
  );
};

export default KnowledgeSidebar;
