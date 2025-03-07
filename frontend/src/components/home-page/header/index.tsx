import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Container,
} from "@mui/material";
import { useAuth } from "hooks/auth-hook";
import { useNavigate } from "react-router-dom";
import { useSetModalState } from "hooks/common-hook";
import AccountMenu from "./account-menu";
import { Toolbar } from "components/ui/toolbar";
import ColorModeIconDropdown from "theme/color-model-icon-dropdown";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import React from "react";
import LanguageIconDropdown from "locales/language-dropdown";
import AccountMenuMobile from "./account-menu-mobile";
import { useTranslation } from "react-i18next";

const HomePageHeader = () => {
  const {
    visible: open,
    hideModal: hideMenu,
    showModal: showMenu,
  } = useSetModalState();

  const navigate = useNavigate();
  const { isLogin } = useAuth();
  const { t } = useTranslation();

  const navToLoginScreen = () => {
    navigate("/auth/login");
  };

  const navToSignUpScreen = () => {
    navigate("/auth/signup");
  };

  const menuItems = [
    {
      label: t("home.home"),
      onClick: () => {
        navigate("/");
      },
    },
  ];

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container
        sx={{
          width: "100vw",
        }}
      >
        <Toolbar variant="dense" disableGutters>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              px: 0,
            }}
          >
            <Box component="img" height="40px" src="/questin.png" />
            <Box
              paddingLeft="20px"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {menuItems.map((item, index) => (
                <Button
                  variant="text"
                  size="small"
                  onClick={item?.onClick}
                  sx={{
                    color: "#0B0E14",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    lineHeight: 1.66,
                    textTransform: "uppercase",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgb(230, 230, 230)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {/* <ColorModeIconDropdown /> */}
            <LanguageIconDropdown />

            {isLogin ? (
              <AccountMenu />
            ) : (
              <React.Fragment>
                <Button
                  color="primary"
                  variant="text"
                  size="small"
                  onClick={navToLoginScreen}
                  sx={{
                    color: "#0B0E14",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    lineHeight: 1.66,
                    textTransform: "uppercase",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgb(230, 230, 230)",
                    },
                  }}
                >
                  {t("login.login")}
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  size="small"
                  onClick={navToSignUpScreen}
                  sx={{
                    backgroundImage: "none",
                    backgroundColor: "black",
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    lineHeight: 1.66,
                    textTransform: "uppercase",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgb(0, 0, 0, 0.8)",
                    },
                  }}
                >
                  {t("login.signUp")}
                </Button>
              </React.Fragment>
            )}
          </Box>

          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            {/* <ColorModeIconDropdown size="medium" /> */}
            <LanguageIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={showMenu}>
              <MenuIcon />
            </IconButton>

            <Drawer
              anchor="top"
              open={open}
              onClose={hideMenu}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                },
              }}
            >
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "background.default",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={hideMenu}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                {menuItems.map((item, index) => (
                  <MenuItem onClick={item?.onClick}>{item.label}</MenuItem>
                ))}
                <Divider sx={{ my: 3 }} />
                {isLogin ? (
                  <AccountMenuMobile />
                ) : (
                  <React.Fragment>
                    <MenuItem>
                      <Button
                        color="primary"
                        variant="outlined"
                        fullWidth
                        onClick={navToLoginScreen}
                      >
                        {t("login.login")}
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button
                        color="primary"
                        variant="contained"
                        fullWidth
                        onClick={navToSignUpScreen}
                      >
                        {t("login.signUp")}
                      </Button>
                    </MenuItem>
                  </React.Fragment>
                )}
              </Box>
            </Drawer>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default HomePageHeader;
