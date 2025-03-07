import { Box } from "@mui/material";
import SettingSideBar from "components/admin/setting/setting-sidebar";
import React, { ReactElement } from "react";
import AdminTopBar from "components/admin/admin-topbar";

const SettingLayout: React.FC<{ children: ReactElement }> = ({ children }) => {
    return (
        <Box display="flex" flexDirection="column" height="100vh">
            <Box>
                <AdminTopBar />
            </Box>
            <Box display="flex" flex="1" overflow="auto">
                <SettingSideBar />
                <Box padding="20px" width="100%">
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default SettingLayout;
