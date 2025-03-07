import { Box, Button, IconButton, Modal, TextField, Typography } from "@mui/material";
import { useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { IModalProps } from "interfaces/common";
import { useSetNextCluster } from "hooks/cluster-hook";

interface IProps extends IModalProps {

}

const NewClusterModal = ({visible, hideModal}: IProps) => {
    const [name, setName] = useState<string>("");
    const { setCluster } = useSetNextCluster();

    return (<Modal
        open={visible}
        onClose={hideModal}
    >
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
                    right: 4
                }}
                onClick={hideModal}
            >
                <ClearIcon />
            </IconButton>
            <Typography
                variant="h5"
                component="h2"
                fontSize="20px"
                fontWeight="bold"
            >
                Create new cluster
            </Typography>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginY="25px"
            >
                <Box display="flex" alignItems="center" flex={1}>
                    <Typography color="red" marginRight="4px">
                        *
                    </Typography>
                    <Typography>Name:</Typography>
                </Box>
                <TextField
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    inputProps={{
                        style: {
                            padding: 5,
                        },
                    }}
                    sx={{
                        flex: 3,
                        marginLeft: "10px",
                    }}
                />
            </Box>
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
                    onClick={hideModal}
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
                        setCluster({
                            is_new: true,
                            name: name
                        })
                        hideModal();
                    }}
                >
                    {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                    OK
                </Button>
            </Box>
        </Box>
    </Modal>)
}

export default NewClusterModal;