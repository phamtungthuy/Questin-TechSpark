import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Bars3CenterLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useFetchManualDialog } from "hooks/dialog-hook";
import { useGetChatParams } from "hooks/route-hook";
import { IDialog } from "interfaces/database/dialog";
import { useAuth } from "hooks/auth-hook";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountMenuMobile from "components/home-page/header/account-menu-mobile";
import { useSetModalState } from "hooks/common-hook";
import MenuIcon from "@mui/icons-material/Menu";
import { useTranslation } from "react-i18next";
import AccountMenu from "components/home-page/header/account-menu";
import BackButton from "components/back-button";

interface IProps {
  setOpenMobileSidebar: Dispatch<SetStateAction<boolean>>;
  removeCurrentChatting: () => void;
}

const ChatTopBar = ({
  setOpenMobileSidebar,
  removeCurrentChatting,
}: IProps) => {
  const navigate = useNavigate();
  const { fetchDialog } = useFetchManualDialog();
  const { dialogId } = useGetChatParams();
  const [dialog, setDialog] = useState<IDialog>();
  const { isLogin } = useAuth();
  const { t } = useTranslation();
  const {
    visible: open,
    hideModal: hideMenu,
    showModal: showMenu,
  } = useSetModalState();
  async function getDialog() {
    const dia = await fetchDialog(dialogId);
    setDialog(dia);
  }
  const navToLoginScreen = () => {
    navigate("/auth/login");
  };

  const navToSignUpScreen = () => {
    navigate("/auth/signup");
  };
  useEffect(() => {
    getDialog();
  }, [dialogId]);
  return (
    <AppBar
      position="relative"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
      }}
      className="bg-background/80 backdrop-blur-sm shadow-[0_1px_3px_0_rgb(0,0,0,0.1)]"
    >
      <Container
        maxWidth={false}
        sx={(theme) => ({
          width: "100%",
          padding: 0,
          "&::before": {
            backgroundImage:
              "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
            backgroundRepeat: "no-repeat",
            ...theme.applyStyles("dark", {
              backgroundImage:
                "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
            }),
          },
        })}
      >
        <Toolbar variant="dense" disableGutters>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              left: 12,
            }}
          >
            <BackButton />
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Typography variant="h6" color="textPrimary">
              {dialog && dialog.name}
              {/* Tư vấn tuyển sinh UET 2025 */}
            </Typography>
            <Box position="absolute" right="0">
              {isLogin ? (
                <AccountMenu />
              ) : (
                <React.Fragment>
                  <Button
                    color="primary"
                    variant="text"
                    size="small"
                    onClick={navToLoginScreen}
                  >
                    {t("login.login")}
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    size="small"
                    onClick={navToSignUpScreen}
                  >
                    {t("login.signUp")}
                  </Button>
                </React.Fragment>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              gap: 1,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Box
              position="absolute"
              left="0"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {isLogin && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={() => setOpenMobileSidebar((open) => !open)}
                  sx={{ ml: "4px", border: 0 }}
                >
                  <Bars3CenterLeftIcon className="w-5 h-5" />
                </IconButton>
              )}
              <Box marginLeft="4px">
                <BackButton />
              </Box>
            </Box>

            <Typography variant="h6" color="textPrimary">
              {dialog && dialog.name}
              {/* Tư vấn tuyển sinh UET 2025 */}
            </Typography>

            <Box position="absolute" right="4px">
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

                  <Divider sx={{ my: 3 }} />
                  {isLogin ? (
                    <AccountMenuMobile />
                  ) : (
                    <React.Fragment>
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
                    </React.Fragment>
                  )}
                </Box>
              </Drawer>
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default ChatTopBar;
