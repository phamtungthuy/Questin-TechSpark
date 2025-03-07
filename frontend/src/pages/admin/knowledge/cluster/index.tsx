import React from "react";
import { motion } from "framer-motion";
import KnowledgeLayout from "../layout";
import {
  Box,
  Breadcrumbs,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import KnowledgeClusterCard from "components/admin/knowledge/cluster/cluster-card";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import NewClusterModal from "components/admin/knowledge/cluster/new-cluster-modal";
import { useFetchNextClusterList } from "hooks/cluster-hook";
import { useSetModalState } from "hooks/common-hook";

const KnowledgeBaseCluster = () => {
  const navigate = useNavigate();
  const { data: clusterList } = useFetchNextClusterList();
  const { visible, hideModal, showModal } = useSetModalState();

  const handleDragDrop = (results) => {
    const { source, destination, type } = results;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    if (type === "group") {
      const reorderedItems = [...clusterList];
      const [removedItem] = reorderedItems.splice(source.index, 1);
      reorderedItems.splice(destination.index, 0, removedItem);
    }
  };

  return (
    <KnowledgeLayout>
      <NewClusterModal visible={visible} hideModal={hideModal} />
      <Breadcrumbs aria-label="breadcrumb" sx={{ paddingBottom: "8px" }}>
        <Typography
          color="inherit"
          onClick={() => navigate("/admin/knowledge")}
          fontSize="16px"
          sx={{
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Knowledge Base
        </Typography>
        <Typography color="text.primary" fontSize="16px">
          Sub Knowledge Base
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: 3,
          p: 4,
          boxShadow: 3,
          transition: "box-shadow 0.3s ease-in-out",
          "&:hover": { boxShadow: 5 },
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          color="primary.main"
        >
          Cluster
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          A collection of knowledge related to the main knowledge base, allowing
          better organization and accessibility.
        </Typography>
        <Divider sx={{ my: 3 }} />

        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={2}
          mb={3}
        >
          <TextField
            variant="outlined"
            placeholder="Search cluster..."
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
                Create Cluster
              </Typography>
            </IconButton>
          </motion.div>
        </Box>

        <DragDropContext onDragEnd={handleDragDrop}>
          <Droppable
            droppableId="sub-knowledge"
            type="group"
            direction="horizontal"
          >
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="flex"
                gap={2}
                flexWrap="wrap"
              >
                {clusterList.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <motion.div
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <KnowledgeClusterCard {...item} />
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
    </KnowledgeLayout>
  );
};

export default KnowledgeBaseCluster;
