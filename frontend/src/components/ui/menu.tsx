"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import { Menu as MuiMenu } from "@mui/material";
import MuiMenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import type { SxProps, Theme } from "@mui/material/styles";
import { paperClasses } from "@mui/material/Paper";
import { listClasses } from "@mui/material/List";
import { dividerClasses } from "@mui/material/Divider";
import { Box, Button } from "@mui/material";

const MenuItem = styled(MuiMenuItem)(({ theme }) => ({
  margin: "2px 0",
  borderRadius: theme.shape.borderRadius,
  padding: "8px 12px",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

interface MenuItemProps {
  label: React.ReactNode;
  value?: string | number;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  divider?: boolean;
}

type PaperPosition = "top" | "bottom" | "left" | "right" | false;

interface ReusableMenuProps {
  items: MenuItemProps[];
  trigger?: React.ReactElement;
  selectedValue?: string | number;
  onSelect?: (value: string | number) => void;
  anchorOrigin?: {
    vertical: "top" | "bottom" | "center";
    horizontal: "left" | "right" | "center";
  };
  transformOrigin?: {
    vertical: "top" | "bottom" | "center";
    horizontal: "left" | "right" | "center";
  };
  sx?: SxProps<Theme>;
  menuProps?: Omit<React.ComponentProps<typeof MuiMenu>, "open">;
  paperPosition?: PaperPosition;
}

const StyledMenu = styled(MuiMenu, {
  shouldForwardProp: (prop) => prop !== "paperPosition",
})<{ paperPosition?: PaperPosition }>(({ theme, paperPosition }) => ({
  [`& .${listClasses.root}`]: {
    padding: "4px 8px",
  },
  [`& .${paperClasses.root}`]: {
    overflow: "visible",
    // filter: "drop-shadow(0px 2px 8px rgba(255, 253, 253, 0.32))",
    marginTop: paperPosition ? theme.spacing(1.5) : 0,
    zIndex: 1,

    ...(paperPosition && {
      "&::before": {
        content: '""',
        display: "block",
        position: "absolute",
        backgroundColor: theme.palette.background.default,
        width: 12,
        height: 12,
        transform: "rotate(45deg)",
        zIndex: 0,
        boxShadow: theme.shadows[1],

        ...(paperPosition === "top" && {
          bottom: -6,
          zIndex: -1,
        }),
        ...(paperPosition === "bottom" && {
          top: -6,
          zIndex: -1,
        }),
        ...(paperPosition === "left" && {
          right: -6,
          top: "calc(50% - 6px)",
          zIndex: -1,
        }),
        ...(paperPosition === "right" && {
          left: -6,
          top: "calc(50% - 6px)",
          zIndex: -1,
        }),
      },
    }),
  },
  [`& .${dividerClasses.root}`]: {
    margin: theme.spacing(0.5, 0),
  },
}));

const Menu = ({
  items,
  trigger,
  anchorOrigin = { vertical: "bottom", horizontal: "right" },
  transformOrigin = { vertical: "top", horizontal: "right" },
  sx,
  menuProps,
  paperPosition = false,
  selectedValue,
  onSelect,
}: ReusableMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const getMargins = () => {
    switch (paperPosition) {
      case "top":
        return { marginBottom: "10px" };
      case "bottom":
        return { marginTop: "10px" };
      case "left":
        return { marginRight: "10px" };
      case "right":
        return { marginLeft: "10px" };
      default:
        return {};
    }
  };

  const getArrowPosition = () => {
    switch (paperPosition) {
      case "top":
        return {
          bottom: -6,
          left: transformOrigin.horizontal === "left" ? 14 : "auto",
          right: transformOrigin.horizontal === "right" ? 14 : "auto",
        };
      case "bottom":
        return {
          top: -6,
          left: transformOrigin.horizontal === "left" ? 14 : "auto",
          right: transformOrigin.horizontal === "right" ? 14 : "auto",
        };
      case "left":
        return {
          right: -6,
          top: "calc(50% - 6px)",
        };
      case "right":
        return {
          left: -6,
          top: "calc(50% - 6px)",
        };
      default:
        return {};
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: MenuItemProps) => {
    item.onClick?.();
    if (item.value && onSelect) {
      onSelect(item.value);
    }
    handleClose();
  };

  return (
    <Box>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: handleClick,
          "aria-controls": open ? "reusable-menu" : undefined,
          "aria-haspopup": "true",
          "aria-expanded": open ? "true" : undefined,
        })
      ) : (
        <Button
          onClick={handleClick}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          ⋮
        </Button>
      )}

      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={transformOrigin}
        anchorOrigin={anchorOrigin}
        sx={sx}
        paperPosition={paperPosition}
        slotProps={{
          paper: {
            sx: {
              ...getMargins(),
              "&::before": paperPosition
                ? {
                    ...getArrowPosition(),
                    zIndex: 0,
                  }
                : {},
            },
          },
        }}
        {...menuProps}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.divider && <Divider />}
            <MenuItem
              onClick={(event: React.MouseEvent<HTMLElement>) => {
                event.preventDefault();
                handleItemClick(item);
              }}
              disableRipple
              selected={item.value ? item.value === selectedValue : false}
              sx={{
                position: "relative",
                "&:hover .check-icon": {
                  opacity: 0.3,
                },
              }}
            >
              {item.icon && (
                <ListItemIcon sx={(theme) => ({})}>{item.icon}</ListItemIcon>
              )}
              <ListItemText sx={{ fontSize: "0.725rem" }}>
                {item.label}
              </ListItemText>
            </MenuItem>
          </React.Fragment>
        ))}
      </StyledMenu>
    </Box>
  );
};

export { Menu };
