import { Box, Divider, IconButton, Typography } from "@mui/material";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { styled } from "@mui/material";
import { useState } from "react";
import SettingSystemModelModalModal from "components/admin/setting/model-provider/system-model-modal";
import SettingLayout from "../layout";
import { useTranslation } from "react-i18next";

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `0px solid ${theme.palette.divider}`,
    padding: 0,
    "&:not(:last-child)": {
        borderBottom: 0,
    },
    "&::before": {
        display: "none",
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor: "transparent",
    padding: 0,
    flexDirection: "row-reverse",
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
        transform: "rotate(90deg)",
    },
    "& .MuiAccordionSummary-content": {
        marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(0),
    borderTop: "0px solid rgba(0, 0, 0, .125)",
}));

const SettingModel = () => {
    const [openSettingSystemModal, setOpenSettingSystemModal] = useState(false);
    const { t } = useTranslation();

    return (
        <SettingLayout>
            <Box>
                <SettingSystemModelModalModal
                    open={openSettingSystemModal}
                    onClose={() => setOpenSettingSystemModal(false)}
                />
                <Box display="flex" justifyContent="space-between">
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            Model Providers
                        </Typography>
                        <Typography fontSize="14px">
                            Set the model parameter and API Key here.
                        </Typography>
                    </Box>
                    <Box>
                        <IconButton
                            sx={{
                                borderRadius: "20px",
                                backgroundColor: "#1677ff",
                                color: "white",
                                paddingX: "20px",
                                paddingY: "5px",
                                "&:hover": {
                                    opacity: 0.7,
                                    backgroundColor: "#1677ff",
                                    color: "white",
                                },
                            }}
                            onClick={() => setOpenSettingSystemModal(true)}
                        >
                            <Cog6ToothIcon
                                width={18}
                                height={18}
                                className="mr-2"
                            />
                            <Typography>System Model Settings</Typography>
                        </IconButton>
                    </Box>
                </Box>
                <Divider
                    sx={{
                        marginTop: "30px",
                        marginBottom: "30px",
                    }}
                />
                <Accordion
                    sx={{
                        border: "none",
                        boxShadow: "none",
                        textShadow: "none",
                        backgroundColor: "transparent",
                    }}
                    defaultExpanded
                >
                    <AccordionSummary>
                        <Typography>Added Model</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box display="flex" gap="10px" flexDirection="column">
                            {/* {modelProviderList
                                .filter(
                                    (modelProvider) =>
                                        modelProvider.is_added === true
                                )
                                .map((modelProvider, index) => (
                                    <SettingAddedModel
                                        key={index}
                                        id={modelProvider["id"]}
                                        name={modelProvider["name"]}
                                        icon={modelProvider["icon"]}
                                        description={
                                            modelProvider["description"]
                                        }
                                        models={modelProvider["models"]}
                                    />
                                ))} */}
                        </Box>
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    sx={{
                        border: "none",
                        boxShadow: "none",
                        textShadow: "none",
                        backgroundColor: "transparent",
                    }}
                    defaultExpanded
                >
                    <AccordionSummary>
                        <Typography>Models to be added</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box display="flex" flexWrap="wrap" gap="20px">
                            {/* {modelProviderList
                                .filter(
                                    (modelProvider) =>
                                        modelProvider.is_added === false
                                )
                                .map((modelProvider, index) => (
                                    <SettingModelToBeAdded
                                            
                                        key={index}
                                        name={modelProvider["name"]}
                                        icon={modelProvider["icon"]}
                                        description={
                                            modelProvider["description"]
                                        }
                                    />
                                ))} */}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </SettingLayout>
    );
};

export default SettingModel;
