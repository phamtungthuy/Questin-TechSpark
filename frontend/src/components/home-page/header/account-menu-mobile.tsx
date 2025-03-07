import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Avatar, getAvatarFallback } from "components/ui/avatar";
import { Menu } from "components/ui/menu";
import authorizationUtil from "utils/authorization-util";
import {
    UserCircleIcon,
    Cog6ToothIcon,
    ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AccountMenuMobile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(
        authorizationUtil.getUserInfo() ||
            '{"avatar": null,"name": "Anonymous","email": ""}'
    );
    const { t } = useTranslation();
    const handleLogout = () => {
        authorizationUtil.removeAll();
        navigate("/auth/login");
    };

    const menuItems = [
        {
            label: "Add another account",
            icon: <UserCircleIcon className="h-6 w-6" />,
        },
        { label: "Settings", icon: <Cog6ToothIcon className="h-6 w-6" /> },
        {
            label: "Logout",
            icon: <ArrowRightStartOnRectangleIcon className="h-6 w-6" />,
            onClick: handleLogout,
        },
    ];

    return (
        <Menu
            trigger={
                <Tooltip title="Account settings">
                    <Stack
                        direction="row"
                        sx={{
                            p: 2,
                            gap: 1,
                            alignItems: "center",
                        }}
                    >
                        <IconButton sx={{ border: 0 }} aria-haspopup="true">
                            <Avatar
                                sx={{ width: 36, height: 36 }}
                                src={user.avatar}
                                fallback={getAvatarFallback(user.name)}
                            />
                        </IconButton>
                        <Box sx={{ mr: "auto" }}>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, lineHeight: "16px" }}
                            >
                                {user.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                            >
                                {user.email}
                            </Typography>
                        </Box>
                    </Stack>
                </Tooltip>
            }
            items={menuItems}
            paperPosition={false}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
        />
    );
};

export default AccountMenuMobile;
