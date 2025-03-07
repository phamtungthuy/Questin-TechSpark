import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DestroyKnowledgeModal from "../destroy-knowledge-modal";
import { IKnowledge } from "interfaces/database/knowledge";
import { motion } from "framer-motion";

interface KnowledgeCardProps extends IKnowledge {}

const KnowledgeCard = ({
  name,
  create_date,
  update_date,
  cluster_num,
  id,
}: KnowledgeCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDestroyKnowledgeModal, setOpenDestroyKnowledgeModal] =
    useState(false);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  function formatDate(dateInput: string): string {
    const date = new Date(dateInput);
    return date.toLocaleString();
  }

  const navigate = useNavigate();

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        // style={{ width: "" }}
      >
        <Box
          border="1px solid #eaecf0"
          boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
          display="flex"
          width="320px"
          padding="20px"
          flexDirection="column"
          borderRadius="16px"
          justifyContent="space-between"
          bgcolor="white"
          transition="all 0.3s ease-in-out"
          sx={{
            cursor: "pointer",
            "&:hover": { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" },
          }}
          onClick={() => navigate(`/admin/knowledge/cluster?id=${id}`)}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Avatar sx={{ bgcolor: "#4CAF50" }}>
              <PersonIcon />
            </Avatar>
            <IconButton onClick={handleOpenMenu}>
              <MoreHorizIcon fontSize="large" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{
                "& .MuiList-root": {
                  padding: 0,
                  borderRadius: "12px",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <MenuItem
                onClick={(e) => {
                  handleCloseMenu(e);
                  setOpenDestroyKnowledgeModal(true);
                }}
                sx={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  transition: "background 0.2s",
                  "&:hover": { background: "#f5f5f5" },
                }}
              >
                <DeleteOutlinedIcon color="error" />
                <Typography>Delete</Typography>
              </MenuItem>
            </Menu>
          </Box>

          <Typography fontWeight="bold" fontSize="22px" marginTop="10px">
            {name}
          </Typography>

          <Box marginTop="12px">
            <Box display="flex" alignItems="center" gap="10px">
              <DescriptionIcon color="primary" />
              <Typography>{cluster_num} Clusters</Typography>
            </Box>
            <Box marginTop="8px" display="flex" alignItems="center" gap="10px">
              <CalendarTodayIcon color="secondary" />
              <Typography fontSize="14px" color="gray">
                {formatDate(update_date)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <DestroyKnowledgeModal
        open={openDestroyKnowledgeModal}
        onClose={() => setOpenDestroyKnowledgeModal(false)}
        kb_id={id}
      />
    </>
  );
};

export default KnowledgeCard;
