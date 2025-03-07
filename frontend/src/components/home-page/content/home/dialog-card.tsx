import { Avatar, Box, Card, Tooltip, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useTranslate } from "hooks/common-hook";
import { AlignVerticalCenterTwoTone } from "@mui/icons-material";

const DialogCard = ({ dialog }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslate("common");

  return (
    <Card
      sx={{
        boxShadow: "var(--template-shadows-1)",
        cursor: "pointer",
        minWidth: {
          xs: "85vw",
          sm: "400px",
          md: "450px",
        },
        height: "200px",
        bgcolor: "rgb(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        p: 3,
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        scrollSnapAlign: "start",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0px 4px 20px ${theme.palette.primary.main}33`,
        },
      }}
      onClick={() => navigate(`/${dialog.id}`)}
    >
      {/* Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h6"
          sx={{
            display: "-webkit-box",
            overflow: "hidden",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 1,
            color: theme.palette.text.primary,
            fontWeight: "bold",
          }}
        >
          {dialog.name}
        </Typography>
        <Avatar src="/uet_logo.jpg" />
      </Box>
      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          height: "100px",
          display: "-webkit-box",
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          color: theme.palette.text.secondary,
          flex: 1,
        }}
      >
        {dialog.description}
      </Typography>

      {/* Footer */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mt: "auto",
          justifyContent: "end",
        }}
      >
        {/* Explore Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              color: theme.palette.primary.main,
              textTransform: "uppercase",
              fontSize: "0.875rem",
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            {t("exploreMore")}
          </Typography>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="20"
            height="20"
            style={{ color: theme.palette.primary.main }}
          >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
        </Box>
      </Box>
    </Card>
  );
};

export default DialogCard;
