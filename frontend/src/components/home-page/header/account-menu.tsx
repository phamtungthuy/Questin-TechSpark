import { IconButton, Tooltip } from "@mui/material";
import { Avatar } from "components/ui/avatar";
import { Menu } from "components/ui/menu";
import authorizationUtil from "utils/authorization-util";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const getAvatarFallback = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const AvatarItem = ({ user }: { user: any }) => (
  <Avatar
    sx={{ width: 24, height: 24 }}
    src={user.avatar}
    fallback={getAvatarFallback(user.name)}
  />
);

const AccountMenu = () => {
  const navigate = useNavigate();
  const user = JSON.parse(
    authorizationUtil.getUserInfo() ||
      '{"avatar": null,"name": "Anonymous","email": ""}'
  );

  const handleLogout = () => {
    authorizationUtil.removeAll();
    navigate("/");
    window.location.reload();
  };

  const menuItems = [
    { label: user.email, icon: <AvatarItem user={user} /> },
    {
      label: "Settings",
      icon: <Cog6ToothIcon className="h-6 w-6" />,
      divider: true,
    },
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
          <IconButton
            size="small"
            sx={{
              ml: 2,
              border: 0,
              "&:hover": { backgroundColor: "transparent" },
            }}
            aria-haspopup="true"
          >
            <Avatar
              sx={{ width: 36, height: 36 }}
              src={user.avatar}
              fallback={getAvatarFallback(user.name)}
            />
          </IconButton>
        </Tooltip>
      }
      items={menuItems}
      paperPosition={"bottom"}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      menuProps={{
        slotProps: {
          paper: {
            sx: {
              "&::before": {
                right: 14,
                backgroundColor: "background.paper",
              },
            },
          },
        },
      }}
    />
  );
};

export default AccountMenu;
