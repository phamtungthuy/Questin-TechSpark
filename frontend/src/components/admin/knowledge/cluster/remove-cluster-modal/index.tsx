import React, { useState } from "react";
import { Box, Modal, Typography, Button, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import KnowledgeBaseClusterApi from "api/admin/knowledgebase/knowledgebase-cluster-api";
import { useRemoveNextCluster } from "hooks/cluster-hook";

interface RemoveClusterModalProps {
  open: boolean;
  onClose: () => void;
  kb_id: string;
  cluster_id: string;
}

const RemoveClusterModal = ({
  open,
  onClose,
  kb_id,
  cluster_id,
}: RemoveClusterModalProps) => {
  const { removeCluster, loading } = useRemoveNextCluster();
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: "10px",
          padding: "20px 32px",
        }}
      >
        <IconButton
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
          }}
          onClick={onClose}
        >
          <ClearIcon />
        </IconButton>
        <Typography
          variant="h5"
          component="h2"
          fontSize="20px"
          fontWeight="bold"
        >
          Delete Cluster
        </Typography>
        <Typography marginTop="20px" textAlign="center">
          Are you sure you want to delete this cluster?
        </Typography>
        <Typography color="red" textAlign="center" marginTop="10px">
          This action cannot be undone.
        </Typography>

        <Box
          marginTop="30px"
          display="flex"
          gap="10px"
          sx={{
            float: "right",
          }}
        >
          <Button
            sx={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontWeight: "medium",
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            sx={{
              borderRadius: "8px",
              backgroundColor: "#ff4d4f",
              color: "#fff",
              fontWeight: "medium",
              "&:hover": {
                backgroundColor: "#ff4d4f",
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              removeCluster([cluster_id])
            }}
            disabled={loading}
          >
            {" "}
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default RemoveClusterModal;
