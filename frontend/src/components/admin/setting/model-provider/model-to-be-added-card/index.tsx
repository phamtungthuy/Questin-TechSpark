import { Avatar, Box, Divider, Typography } from "@mui/material";
import SettingAddModelProviderModal from "./add-model-provider-modal";
import { useState } from "react";

interface SettingModelToBeAddedProps {
    name: string;
    icon: string;
    description: string;
}

const SettingModelToBeAdded = ({ name, icon, description }: SettingModelToBeAddedProps) => {
    const [openSettingAddModelProviderModal, setOpenSettingAddModelProviderModal] = useState(false);
    
    return (
        <Box
            sx={{
                padding: "30px 20px",
                backgroundColor: "#e3f0ff",
                borderRadius: "20px",
                justifyContent: "space-between"
            }}
            display="flex"
            flexDirection="column"
            maxWidth="200px"
            alignItems="left"
            gap="20px"
        >
            <SettingAddModelProviderModal 
                open={openSettingAddModelProviderModal}
                name={name}
                description={description}
                onClose={() => setOpenSettingAddModelProviderModal(false)}
            />
            <Avatar src={icon} />
            <Typography fontSize="16px" fontWeight="bold">
                {name}
            </Typography>
            <Typography >
                {description}
            </Typography>
            <Divider />
            <Typography
                sx={{
                    color: "#7fb4ff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    alignItems: "center",
                    "&:hover": {
                        opacity: 0.7,
                    },
                }}
                onClick={() => setOpenSettingAddModelProviderModal(true)}
            >
                Add the model
            </Typography>
        </Box>
    );
};

export default SettingModelToBeAdded;
