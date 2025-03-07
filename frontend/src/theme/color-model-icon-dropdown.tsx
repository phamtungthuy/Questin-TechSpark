import * as React from "react";
import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import Box from "@mui/material/Box";
import IconButton, { IconButtonOwnProps } from "@mui/material/IconButton";
import { useColorScheme } from "@mui/material/styles";
import { Menu } from "components/ui/menu";

export default function ColorModeIconDropdown(props: IconButtonOwnProps) {
  const { mode, systemMode, setMode } = useColorScheme();

  const handleMode = (targetMode: "system" | "light" | "dark") => () => {
    setMode("light");
  };
  if (!mode) {
    return (
      <Box
        data-screenshot="toggle-mode"
        sx={(theme) => ({
          verticalAlign: "bottom",
          display: "inline-flex",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: "1px solid",
          borderColor: (theme.vars || theme).palette.divider,
        })}
      />
    );
  }
  const resolvedMode = (systemMode || mode) as "light" | "dark";
  const icon = {
    light: <LightModeIcon />,
    dark: <DarkModeIcon />,
  }[resolvedMode];

  const menuItems = [
    {
      value: "system",
      label: "System",
      onClick: handleMode("system"),
    },
    {
      value: "light",
      label: "Light",
      onClick: handleMode("light"),
    },
    {
      value: "dark",
      label: "Dark",
      onClick: handleMode("dark"),
    },
  ];
  return (
    <React.Fragment>
      <Menu
        items={menuItems}
        selectedValue={mode}
        trigger={
          <IconButton
            data-screenshot="toggle-mode"
            disableRipple
            size="small"
            sx={{
              border: "none",
            }}
            aria-haspopup="true"
            {...props}
          >
            {icon}
          </IconButton>
        }
        paperPosition={false}
      />
    </React.Fragment>
  );
}
