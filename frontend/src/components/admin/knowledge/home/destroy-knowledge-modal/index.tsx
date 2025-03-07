import {
  Box,
  Modal,
  Typography,
  Button,
  IconButton,
  useTheme,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { motion } from "framer-motion";
import { useRemoveKnowledge } from "hooks/knowledge-hook";

interface Iprops {
  open: boolean;
  onClose: () => void;
  kb_id: string;
}

const DestroyKnowledgeModal = ({ open, onClose, kb_id }: Iprops) => {
  const { removeKnowledge, loading } = useRemoveKnowledge();
  const theme = useTheme();

  return (
    <Modal open={open} onClose={onClose}>
      <motion.div
        // initial={{ opacity: 0, y: 20 }}
        // animate={{ opacity: 1, y: 0 }}
        // exit={{ opacity: 0, y: -20 }}
        // transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Box
          sx={{
            width: 420,
            bgcolor: "background.paper",
            borderRadius: "12px",
            padding: "28px 36px",
            boxShadow: 6,
            position: "relative",
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "grey.600",
            }}
            onClick={onClose}
          >
            <ClearIcon />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            mb={3}
            sx={{ color: theme.palette.error.main }}
          >
            Delete Knowledge Base
          </Typography>

          <Typography textAlign="center" mb={2}>
            Are you sure you want to delete this knowledge base?
          </Typography>

          <Typography color="error" textAlign="center" fontWeight="bold" mb={3}>
            This action cannot be undone.
          </Typography>

          <Box display="flex" justifyContent="center" gap={2}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                sx={{ borderRadius: "8px", fontWeight: "medium" }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                sx={{
                  borderRadius: "8px",
                  backgroundColor: theme.palette.error.main,
                  color: "white",
                  fontWeight: "bold",
                  padding: "8px 20px",
                  "&:hover": {
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  removeKnowledge([kb_id]);
                }}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    </Modal>
  );
};

export default DestroyKnowledgeModal;
