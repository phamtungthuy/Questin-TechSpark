import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Container } from "components/ui/container";
import { Card } from "components/ui/card";
import { GoogleIcon } from "components/icons";
import {
    Box,
    Button,
    Divider,
    Typography
} from "@mui/material";
import { useTranslate } from "hooks/common-hook";


const { REACT_APP_GOOGLE_CLIENT_ID, REACT_APP_GOGGLE_REDIRECT_URL_ENDPOINT } =
    process.env;
function Auth() {
    const location = useLocation();
    const {t} = useTranslate('login');
    const openGoogleLoginPage = useCallback(() => {
        const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const scope = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ].join(" ");

        // @ts-ignore
        const params: any = new URLSearchParams({
            response_type: "code",
            client_id: REACT_APP_GOOGLE_CLIENT_ID,
            redirect_uri: `${REACT_APP_GOGGLE_REDIRECT_URL_ENDPOINT}/google`,
            prompt: "select_account",
            access_type: "offline",
            scope,
        });

        const url = `${googleAuthUrl}?${params}`;

        window.location.href = url;
    }, []);

    if (location.pathname !== "/auth") {
        return <Outlet />
    }

    return (
        <Container direction="column" justifyContent="space-between">
            <Card variant="outlined">
            <Typography
                component="h1"
                variant="h4"
                sx={{
                    width: "100%",
                    fontSize: "clamp(2rem, 10vw, 2.15rem)",
                    textAlign: "center"
                }}
            >
                {t('getStarted')}
            </Typography>

            <Box 
                sx={{
                    display: "flex",
                    gap: 2
                }}
            >
                <Button
                    href="/auth/login"
                    fullWidth
                    variant="outlined"
                    onClick={()=>{}}
                >
                    {t('login')}
                </Button>

                <Button
                    href="/auth/signup"
                    fullWidth
                    variant="outlined"
                    onClick={()=>{}}
                >
                    {t('signUp')}
                </Button>
            </Box>

            <Divider>{t('or')}</Divider>
            
            <Button
                fullWidth
                variant="outlined"
                onClick={openGoogleLoginPage}
                startIcon={<GoogleIcon />}
            >
                {t('googleSignIn')}
            </Button>

            </Card>
        </Container>

    );
}

export default Auth;
