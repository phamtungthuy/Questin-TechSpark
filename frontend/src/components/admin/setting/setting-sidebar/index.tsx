import { ListItemIcon, } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import { useLocation, useNavigate } from "react-router-dom";
import { UserIcon } from "@heroicons/react/24/outline";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import authorizationUtil from "utils/authorization-util";
import BaseModal from "components/base-modal";
import { useSetModalState } from "hooks/common-hook";
import LogoutModal from "../logout-modal";

interface ItemProps {
    text: string;
    icon: React.ReactElement;
    route: string;
    onClick: () => void;
}

export const itemList: Array<ItemProps> = [
    {
        text: "Profile",
        icon: <UserIcon />,
        route: "/admin/settings/profile",
        onClick: () => {

        },
    },
    {
        text: "Password",
        icon: <LockClosedIcon  />,
        route: "/admin/settings/password",
        onClick: () => {

        },
    },
    {
        text: " Model Providers",
        icon: <CubeTransparentIcon  />,
        route: "/admin/settings/model",
        onClick: () => {
        },
    },
    {
        text: "Log out",
        icon: <ArrowRightStartOnRectangleIcon />,
        route: "/admin/login",
        onClick: () => {
            // authorizationUtil.removeAll();
        },
    },
];
const SettingSideBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { visible, hideModal, showModal } = useSetModalState();
    return (
        <MenuList
            sx={{
                width: "500px",
                borderRight: "1px solid #ccc",
                padding: "20px",
                fontWeight:"700"
            }}
            // TransitionComponent= {Fade}
        >
            <LogoutModal visible={visible} hideModal={hideModal}
                acpFunc={() => {
                    authorizationUtil.removeAll();
                    navigate("/admin/login");
                }}  
            />
            {itemList.map((item, index) => {
                const isSelected = item["route"] === location.pathname
                return (
                    <MenuItem
                        selected={item["route"] === location.pathname}
                        key={index}
                        onClick={() => {
                            item.text === "Log out" ? showModal() : navigate(item["route"])
                            item["onClick"]();
                        }}
                        sx={{
                            borderRadius: "10px",
                            marginBottom: "5px",
                            fontWeight: "900",
                        }}
                    >
                        <ListItemIcon className="pr-2">{item["icon"]}</ListItemIcon>
                        {/* <ListItemText 
                            sx = {{
                                fontWeight: "900",
                            }}
                        
                        >{item["text"]}</ListItemText> */}
                        <p className={`font-normal font-sm ${isSelected ? 'text-blue-500' : ''}`}>{item["text"]}</p>
                    </MenuItem>
                );
            })}
        </MenuList>
    );
};

export default SettingSideBar;