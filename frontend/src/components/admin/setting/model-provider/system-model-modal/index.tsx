import {
    Box,
    Button,
    FormControl,
    IconButton,
    MenuItem,
    Modal,
    Select,
    Tooltip,
    Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useEffect, useState } from "react";


interface SettingSystemModelModalProps {
    open: boolean;
    onClose: () => void;
}
const SettingSystemModelModalModal = ({
    open,
    onClose,
}: SettingSystemModelModalProps) => {
    const [LLMModel, setLLMModel] = useState<string>("");

    const [embeddingModel, setEmbeddingModel] = useState<string>("keepitreal/vietnamese-sbert");

    useEffect(() => {

    }, []);

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 400,
                    bgcolor: "background.paper",
                    borderRadius: "10px",
                    padding: "20px 32px",
                }}
            >
                <IconButton
                    sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                    }}
                    onClick={onClose}
                >
                    <ClearIcon />
                </IconButton>
                <Typography
                    variant="h5"
                    component="h2"
                    fontSize="20px"
                    fontWeight="bold"
                >
                    System Model Settings
                </Typography>
                <Box
                    sx={{ mt: 2 }}
                    display="flex"
                    alignItems="center"
                    gap="5px"
                >
                    <Typography fontSize="16px">Chat model</Typography>
                    <Tooltip title="The default chat LLM will use.">
                        <HelpOutlineIcon
                            sx={{
                                fontSize: "18px",
                                color: "#ccc",
                                cursor: "help",
                            }}
                        />
                    </Tooltip>
                </Box>
                <FormControl variant="outlined" fullWidth size="small">
                    <Select
                        MenuProps={{
                            MenuListProps: { disablePadding: true },
                        }}
                        value={LLMModel}
                        onChange={(e) => setLLMModel(e.target.value)}
                        sx={{
                            flex: 2,
                            marginTop: "10px",
                        }}
                    >

                    </Select>
                </FormControl>
                <Box
                    sx={{ mt: 2 }}
                    display="flex"
                    alignItems="center"
                    gap="5px"
                >
                    <Typography fontSize="16px">Embedding model</Typography>
                    <Tooltip title="The default embedding model will use.">
                        <HelpOutlineIcon
                            sx={{
                                fontSize: "18px",
                                color: "#ccc",
                                cursor: "help",
                            }}
                        />
                    </Tooltip>
                </Box>
                <FormControl variant="outlined" fullWidth size="small">
                    <Select
                        MenuProps={{
                            MenuListProps: { disablePadding: true },
                        }}
                        value={embeddingModel}
                        onChange={(e) => setEmbeddingModel(e.target.value)}
                        sx={{
                            flex: 2,
                            marginTop: "10px",
                        }}
                    >
                        <MenuItem value={"keepitreal/vietnamese-sbert"}>
                            keepitreal/vietnamese-sbert
                        </MenuItem>
                    </Select>
                </FormControl>
                <Box
                    marginTop="30px"
                    display="flex"
                    gap="10px"
                    sx={{
                        float: "right",
                    }}
                >
                    <Button
                        sx={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            fontWeight: "medium",
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        sx={{
                            borderRadius: "8px",
                            backgroundColor: "#1677ff",
                            color: "#fff",
                            fontWeight: "medium",
                            "&:hover": {
                                backgroundColor: "#1677ff",
                            },
                        }}
                        onClick={async () => {


                            onClose();
                        }}
                    >
                        {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                        OK
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default SettingSystemModelModalModal;
