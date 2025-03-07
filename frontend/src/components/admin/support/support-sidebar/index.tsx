import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useFetchNextDialogList } from "hooks/dialog-hook";
import { useNavigate } from "react-router-dom";

const MIN_WIDTH = 80;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 250;

const SupportSidebar = () => {
  const { data: dialogList } = useFetchNextDialogList();
  const sidebarRef = useRef(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedDialog, setSelectedDialog] = useState(null);
  const navigate = useNavigate();

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (event) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(
            MAX_WIDTH,
            event.clientX - sidebarRef.current.getBoundingClientRect().left
          )
        );
        setWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing, isResizing]);

  const toggleSidebar = () => {
    setWidth((prevWidth) => (prevWidth === MAX_WIDTH ? MIN_WIDTH : MAX_WIDTH));
  };

  return (
    <motion.div
      ref={sidebarRef}
      style={{
        width,
        height: "100vh",
        backgroundColor: "#1E293B",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
        position: "relative",
        transition: isResizing ? "none" : "width 0.3s ease-in-out",
      }}
    >
      {/* Resizer Handle */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "10px",
          height: "100%",
          cursor: "ew-resize",
          zIndex: 10,
        }}
        onMouseDown={startResizing}
      />

      {/* Expand/Collapse Button */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: "-15px",
          transform: "translateY(-50%)",
          backgroundColor: "#334155",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
        }}
        onClick={toggleSidebar}
      >
        {width > MIN_WIDTH ? (
          <ChevronLeft sx={{ color: "#F8FAFC" }} />
        ) : (
          <ChevronRight sx={{ color: "#F8FAFC" }} />
        )}
      </Box>

      {/* Dialog List */}
      <Box sx={{ overflowY: "auto", flexGrow: 1, marginTop: "10px" }}>
        {dialogList?.map((dialog, index) => {
          const isSelected = selectedDialog === dialog.id;
          return (
            <motion.div
              key={dialog.id || index}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedDialog(dialog.id);
                navigate(`/admin/support/${dialog.id}`);
              }}
              style={{
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: width > 150 ? "flex-start" : "center",
                backgroundColor: isSelected ? "#64748B" : "#334155",
                border: isSelected ? "2px solid #F8FAFC" : "none",
              }}
            >
              {width > 150 && (
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "14px",
                    color: "#E2E8F0",
                    userSelect: "none",
                    fontWeight: isSelected ? "bold" : "normal",
                  }}
                >
                  {dialog.name || `Dialog ${index + 1}`}
                </Typography>
              )}
            </motion.div>
          );
        })}
      </Box>
    </motion.div>
  );
};

export default SupportSidebar;
