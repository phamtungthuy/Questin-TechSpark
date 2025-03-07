import * as React from "react";
import Box from "@mui/material/Box";
import IconButton, { IconButtonOwnProps } from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Menu } from "components/ui/menu";

export default function LanguageIconDropdown(props: IconButtonOwnProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => () => {
    i18n.changeLanguage(lng);
  };

  if (!i18n.language) {
    return (
      <Box
        data-screenshot="toggle-language"
        sx={(theme) => ({
          display: "inline-flex",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: "1px solid",
          borderColor: (theme.vars || theme).palette.divider,
          alignItems: "center",
          justifyContent: "center",
        })}
      />
    );
  }

  const menuItems = [
    { value: "en", label: "English", onClick: handleLanguageChange("en") },
    {
      value: "vi",
      label: "Tiếng Việt",
      onClick: handleLanguageChange("vi"),
    },
  ];

  return (
    <React.Fragment>
      <Menu
        items={menuItems}
        selectedValue={i18n.language}
        trigger={
          <IconButton
            data-screenshot="toggle-language"
            disableRipple
            size="small"
            aria-haspopup="true"
            sx={{
              border: "none",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                backgroundColor: "rgb(230, 230, 230)",
              },
            }}
            {...props}
          >
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", fontWeight: "600" }}
            >
              {i18n.language}
            </Typography>
          </IconButton>
        }
        paperPosition={false}
      />
    </React.Fragment>
  );
}
