import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "hooks/auth-hook";
import { Container } from "components/ui/container";
import { Card } from "components/ui/card";
import SvgIcon from "components/svg-icon";
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    TextField,
    Typography,
    Link as MuiLink,
} from "@mui/material";
import { GoogleIcon } from "components/icons";
import { useTranslate } from "hooks/common-hook";

const { REACT_APP_GOOGLE_CLIENT_ID, REACT_APP_GOOGLE_REDIRECT_URL_ENDPOINT } =
    process.env;

const SignUp = () => {
    const { register } = useRegister();
    const navigate = useNavigate();
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
    const [nameError, setNameError] = React.useState(false);
    const [nameErrorMessage, setNameErrorMessage] = React.useState("");

    const { t } = useTranslate("login");

    const validateInputs = () => {
        const email = document.getElementById("email") as HTMLInputElement;
        const password = document.getElementById(
            "password"
        ) as HTMLInputElement;
        const name = document.getElementById("name") as HTMLInputElement;

        let isValid = true;

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage("Please enter a valid email address.");
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage("");
        }

        if (!password.value || password.value.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage(
                "Password must be at least 6 characters long."
            );
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage("");
        }

        if (!name.value || name.value.length < 1) {
            setNameError(true);
            setNameErrorMessage("Name is required.");
            isValid = false;
        } else {
            setNameError(false);
            setNameErrorMessage("");
        }

        return isValid;
    };

    const handleGoogleSignup = useCallback(() => {
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
        if (nameError || emailError || passwordError) {
            return;
        }
        const data = new FormData(event.currentTarget);
        const retcode = await register({
            nickname: data.get("name") as string,
            email: data.get("email") as string,
            password: data.get("password") as string,
        });
        if (retcode === 0) {
            navigate("/auth/login");
        }
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
                    {t("signUp")}
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                    <FormControl>
                        <FormLabel htmlFor="name">{t("nameLabel")}</FormLabel>
                        <TextField
                            autoComplete="name"
                            name="name"
                            required
                            fullWidth
                            id="name"
                            placeholder="Jon Snow"
                            error={nameError}
                            helperText={nameErrorMessage}
                            color={nameError ? "error" : "primary"}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="email">{t("emailLabel")}</FormLabel>
                        <TextField
                            required
                            fullWidth
                            id="email"
                            placeholder="your@email.com"
                            name="email"
                            autoComplete="email"
                            variant="outlined"
                            error={emailError}
                            helperText={emailErrorMessage}
                            color={passwordError ? "error" : "primary"}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="password">
                            {t("passwordLabel")}
                        </FormLabel>
                        <TextField
                            required
                            fullWidth
                            name="password"
                            placeholder="••••••"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            variant="outlined"
                            error={passwordError}
                            helperText={passwordErrorMessage}
                            color={passwordError ? "error" : "primary"}
                        />
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                value="allowExtraEmails"
                                color="primary"
                            />
                        }
                        label={t("emailReceivedLabel")}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        onClick={validateInputs}
                    >
                        {t("signUp")}
                    </Button>
                </Box>
                <Divider>
                    <Typography sx={{ color: "text.secondary" }}>
                        {t("or")}
                    </Typography>
                </Divider>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogleSignup}
                        startIcon={<GoogleIcon />}
                    >
                        {t("googleSignUp")}
                    </Button>

                    <Typography sx={{ textAlign: "center" }}>
                        {t("signUpTip")}{" "}
                        <MuiLink variant="body2" sx={{ alignSelf: "center" }}>
                            <Link to="/auth/login">{t("login")}</Link>
                        </MuiLink>
                    </Typography>
                </Box>
            </Card>
        </Container>
    );
};

export default SignUp;
