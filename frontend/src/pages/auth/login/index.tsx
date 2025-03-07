import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Divider, Link as MuiLink } from "@mui/material";
import { useLogin } from "hooks/auth-hook";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormLabel,
    TextField,
    Typography,
} from "@mui/material";
import { GoogleIcon } from "components/icons";
import { useSetModalState, useTranslate } from "hooks/common-hook";
import ForgotPassword from "./forgot-password";
import SvgIcon from "components/svg-icon";
import { Card } from "components/ui/card";
import { Container } from "components/ui/container";
const { REACT_APP_GOOGLE_CLIENT_ID, REACT_APP_GOOGLE_REDIRECT_URL_ENDPOINT } =
    process.env;

const Login = () => {
    const { login } = useLogin();
    const { visible, showModal, hideModal } = useSetModalState();
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
    const navigate = useNavigate();
    const { t } = useTranslate("login");

    const handleGoogleLogin = useCallback(() => {
        const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

        const scope = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ].join(" ");

        // @ts-ignore
        const params: any = new URLSearchParams({
            response_type: "code",
            client_id: REACT_APP_GOOGLE_CLIENT_ID,
            redirect_uri: `${REACT_APP_GOOGLE_REDIRECT_URL_ENDPOINT}/google`,
            prompt: "select_account",
            access_type: "offline",
            scope,
        });

        const url = `${googleAuthUrl}?${params}`;

        window.location.href = url;
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (emailError || passwordError) {
            return;
        }
        const data = new FormData(event.currentTarget);
        const retcode = await login({
            email: data.get("email") as string,
            password: data.get("password") as string,
        });
        console.log(retcode);
        if (retcode === 0) {
            navigate("/");
        }
    };

    const validateInputs = () => {
        const email = document.getElementById("email") as HTMLInputElement;
        const password = document.getElementById(
            "password"
        ) as HTMLInputElement;

        let isValid = true;

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage("Please enter a valid email address.");
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage("");
        }
        if (!password.value) {
            setPasswordError(true);
            setPasswordErrorMessage(
                "Password must be at least 6 characters long."
            );
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage("");
        }

        return isValid;
    };
    return (
        <Container direction="column" justifyContent="space-between">
            <Card variant="outlined">
                <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                    <SvgIcon name={"questin"} width={100} />
                </Box>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                        width: "100%",
                        fontSize: "clamp(2rem, 10vw, 2.15rem)",
                    }}
                >
                    {t("login")}
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        gap: 2,
                    }}
                >
                    <FormControl>
                        <FormLabel htmlFor="email">{t("emailLabel")}</FormLabel>
                        <TextField
                            error={emailError}
                            helperText={emailErrorMessage}
                            id="email"
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            autoComplete="email"
                            autoFocus
                            required
                            fullWidth
                            variant="outlined"
                            color={emailError ? "error" : "primary"}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="password">
                            {t("passwordLabel")}
                        </FormLabel>
                        <TextField
                            error={passwordError}
                            helperText={passwordErrorMessage}
                            name="password"
                            placeholder="••••••"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            autoFocus
                            required
                            fullWidth
                            variant="outlined"
                            color={passwordError ? "error" : "primary"}
                        />
                    </FormControl>
                    <FormControlLabel
                        control={<Checkbox value="remember" color="primary" />}
                        label={t("rememberMe")}
                    />
                    <ForgotPassword visible={visible} hideModal={hideModal} />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        onClick={validateInputs}
                    >
                        {t("login")}
                    </Button>
                    <MuiLink
                        component="button"
                        type="button"
                        onClick={showModal}
                        variant="body2"
                        sx={{ alignSelf: "center" }}
                    >
                        {t("forgotPassword")}
                    </MuiLink>
                </Box>
                <Divider>{t("or")}</Divider>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogleLogin}
                        startIcon={<GoogleIcon />}
                    >
                        {t("googleSignIn")}
                    </Button>
                    <Typography sx={{ textAlign: "center" }}>
                        {t("signInTip")}{" "}
                        <MuiLink variant="body2" sx={{ alignSelf: "center" }}>
                            <Link to="/auth/signup">{t("register")}</Link>
                        </MuiLink>
                    </Typography>
                </Box>
            </Card>
        </Container>
    );
};

export default Login;
