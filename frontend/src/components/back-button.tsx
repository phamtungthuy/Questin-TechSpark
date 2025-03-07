"use client";

import { useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";

interface BackButtonProps {
  tooltip?: string;
  color?:
    | "inherit"
    | "primary"
    | "secondary"
    | "default"
    | "error"
    | "info"
    | "success"
    | "warning";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

export default function BackButton({
  tooltip = "Go back",
  color = "primary",
  size = "medium",
  onClick,
}: BackButtonProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/");
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton
        aria-label="go back"
        color={color}
        size={size}
        onClick={handleClick}
        sx={{
          border: 0,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderRadius: "8px",
          },
        }}
      >
        <i
          className="fa-regular fa-arrow-left-long"
          style={{ fontSize: "20px" }}
        ></i>
      </IconButton>
    </Tooltip>
  );
}
