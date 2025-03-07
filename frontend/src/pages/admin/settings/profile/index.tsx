import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import SettingLayout from "../layout";

const SettingProfile = () => {
    return (
        <SettingLayout>
            <Box>
                <Typography variant="h6" fontWeight="bold">
                    Profile
                </Typography>
                <Box fontSize="14px">
                    Update your photo and personal details here.
                </Box>
                <Divider
                    sx={{
                        marginTop: "30px",
                    }}
                />
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
                        <Typography>Username</Typography>
                    </Box>
                    <TextField
                        fullWidth
                        inputProps={{
                            style: {
                                padding: 5,
                            },
                        }}
                        sx={{
                            flex: 2,
                            marginLeft: "10px",
                        }}
                    />
                </Box>
                <Divider />
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
                        <Typography>Color schema</Typography>
                    </Box>
                    <TextField
                        fullWidth
                        inputProps={{
                            style: {
                                padding: 5,
                            },
                        }}
                        sx={{
                            flex: 2,
                            marginLeft: "10px",
                        }}
                    />
                </Box>
                <Divider />
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
                        <Typography>Language</Typography>
                    </Box>
                    <TextField
                        fullWidth
                        inputProps={{
                            style: {
                                padding: 5,
                            },
                        }}
                        sx={{
                            flex: 2,
                            marginLeft: "10px",
                        }}
                    />
                </Box>
                <Divider />
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginY="25px"
                >
                    <Box display="flex" alignItems="center" flex={1}>
                        <Typography>Email address</Typography>
                    </Box>
                    <TextField
                        variant="outlined"
                        fullWidth
                        inputProps={{
                            style: {
                                padding: 5,
                                cursor: "no-drop",
                            },
                            readOnly: true,
                        }}
                        sx={{
                            flex: 2,
                            marginLeft: "10px",
                        }}
                        value="21020412@vnu.edu.vn"
                    />
                </Box>
                <Divider />
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
                    >
                        {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                        Save
                    </Button>
                </Box>
            </Box>
        </SettingLayout>
    );
};

export default SettingProfile;
