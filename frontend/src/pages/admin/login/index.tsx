import React from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "hooks/auth-hook";
import { useTranslate } from "hooks/common-hook";
import { Container } from "components/ui/container";
import { Card } from "components/ui/card";
import SvgIcon from "components/svg-icon";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    TextField,
    Typography,
} from "@mui/material";

const Admin = () => {
    const { login } = useLogin();
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
    const navigate = useNavigate();
    const { t } = useTranslate("login");

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
            navigate("/admin");
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
                    {t("adminLogin")}
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
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        onClick={validateInputs}
                    >
                        {t("login")}
                    </Button>
                </Box>
            </Card>
        </Container>
    );
};

export default Admin;
