import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "framer-motion";
import NewKnowledgeModal from "components/admin/knowledge/home/new-knowledge-modal";
import KnowledgeCard from "components/admin/knowledge/home/knowledge-card";
import AdminTopBar from "components/admin/admin-topbar";
import { useFetchNextKnowledgeList } from "hooks/knowledge-hook";
import { IKnowledge } from "interfaces/database/knowledge";
import { useSetModalState } from "hooks/common-hook";

const KnowledgeHomePage = () => {
  const { visible, hideModal, showModal } = useSetModalState();
  const { data: knowledgeList } = useFetchNextKnowledgeList();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="#f4f6f8"
    >
      <AdminTopBar />
      <Box padding={{ xs: "20px", md: "40px 80px" }}>
        <NewKnowledgeModal visible={visible} hideModal={hideModal} />
        <Box
          paddingBottom="72px"
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={4}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              Welcome back
            </Typography>
            <Typography marginTop="12px" color="text.secondary">
              Which knowledge base are we going to use today?
            </Typography>
          </Box>
          <Box
            display="flex"
            gap={2}
            alignItems="center"
            width={{ xs: "100%", md: "auto" }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search knowledge..."
              sx={{
                borderRadius: "8px",
                bgcolor: "white",
                boxShadow: 1,
                "& .MuiOutlinedInput-root": {
                  padding: "20px 12px",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={showModal}
                sx={{
                  width: "auto",
                  borderRadius: "8px",
                  backgroundColor: "primary.main",
                  color: "white",
                  paddingX: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: 2,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                <AddIcon />
                <Typography fontSize={14} noWrap>
                  Create Knowledge
                </Typography>
              </IconButton>
            </motion.div>
          </Box>
        </Box>
        <Box
          display="flex"
          gap={3}
          flexWrap="wrap"
          justifyContent={{ xs: "center", md: "flex-start" }}
        >
          {knowledgeList.map((kb: IKnowledge) => (
            <motion.div
              key={kb.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <KnowledgeCard {...kb} />
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default KnowledgeHomePage;
