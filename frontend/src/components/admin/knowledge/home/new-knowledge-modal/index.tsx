import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { motion } from "framer-motion";
import { IModalProps } from "interfaces/common";
import { useSetNextKnowledge } from "hooks/knowledge-hook";

interface IProps extends IModalProps {}

const NewKnowledgeModal = ({ visible, hideModal }: IProps) => {
  const [name, setName] = useState("");
  const { setKnowledge } = useSetNextKnowledge();
  const theme = useTheme();

  return (
    <Modal open={visible} onClose={hideModal}>
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
            onClick={hideModal}
          >
            <ClearIcon />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            mb={3}
            sx={{ color: theme.palette.primary.main }}
          >
            Create New Knowledge Base
          </Typography>

          <Box mb={3}>
            <Typography fontSize={14} color="text.secondary" mb={1}>
              Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter knowledge base name"
              sx={{
                borderRadius: "8px",
                backgroundColor: "white",
                boxShadow: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                sx={{ borderRadius: "8px", fontWeight: "medium" }}
                onClick={hideModal}
              >
                Cancel
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                sx={{
                  borderRadius: "8px",
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                  fontWeight: "bold",
                  padding: "8px 20px",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
                onClick={async () => {
                  setKnowledge({ is_new: true, name });
                  hideModal();
                }}
              >
                OK
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    </Modal>
  );
};

export default NewKnowledgeModal;
