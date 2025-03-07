import { alpha, Toolbar as MuiToolbar, styled } from "@mui/material";

const Toolbar = styled(MuiToolbar)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
    backdropFilter: "blur(24px)",
    border: "1px solid",
    borderColor: (theme.vars || theme).palette.divider,
    backgroundColor: theme.vars
        ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
        : alpha(theme.palette.background.default, 0.4),
    boxShadow: (theme.vars || theme).shadows[1],
    padding: "8px 12px",
}));


export { Toolbar };