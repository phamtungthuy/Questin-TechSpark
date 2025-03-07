import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import SettingLayout from "../layout";
import { useState } from "react";
const SettingPassword = () => {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [warning1, setWarning1] = useState("")
    const [warning2, setWarning2] = useState("")


    const handleBlur = (value : any, validationFunc : any, isConfirmPassword : any) => {
        const warningMessage = validationFunc(value)
        if(isConfirmPassword){
            setWarning2(warningMessage)
        }
        else{
            setWarning1(warningMessage)
        }
    }

    const validatePassword = (password : any) => {
        if(password.length > 0 && password.length < 8){
            return "Your new password must be more than 8 characters"
        }
    }

    const validatePasswordMatch = (repeatPassword : any) => {
        if(repeatPassword !== confirmPassword){
            return "The new password that you entered do not match!"
        }
    }


    return (
        <SettingLayout>
            <Box>
                <Typography variant="h6" fontWeight="bold">
                    Password
                </Typography>
                <Box fontSize="14px">
                    Please enter your current password to change your password.
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
                        <Typography>Current password</Typography>
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
                    alignItems="start"
                    marginY="25px"
                >
                    <Box display="flex" alignItems="center" flex={1}>
                        <Typography color="red" marginRight="4px">
                            *
                        </Typography>
                        <Typography>New password</Typography>
                    </Box>
                    <Box
                        sx={{
                            flex: 2,
                            marginLeft: "10px",
                        }}
                    >
                        <TextField
                            fullWidth
                            inputProps={{
                                style: {
                                    padding: 5,
                                },
                            }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onBlur={() => handleBlur(newPassword, validatePassword, false)}
                            // error={warning1 !== ""}
                        />
                        {
                            warning1 &&
                                <Typography 
                                      fontSize="16px" 
                                      marginY="10px"
                                      sx ={{
                                        color: "red",
                                      }}
                                >
                                    {warning1}
                                </Typography>
                        }
                        
                    </Box>
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
                        <Typography>Confirm new password</Typography>
                    </Box>
                    <Box
                        sx={{
                            flex:2,
                            marginLeft: "10px",
                        }}
                    
                    >
                        <TextField
                            fullWidth
                            inputProps={{
                                style: {
                                    padding: 5,
                                },
                            }}
                            sx={{
                                flex: 2,
                                
                            }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onBlur={() => handleBlur(confirmPassword, validatePassword, true)}
                        />
                        {
                                warning2 &&
                                    <Typography 
                                        fontSize="16px" 
                                        marginY="10px"
                                        sx ={{
                                            color: "red",
                                        }}
                                    >
                                    okeoke
                                    </Typography>
                            }
                    </Box>
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
                            color: "#000",
                            fontSize:"14px",
                            textTransform:"capitalize",
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
                            textTransform:"capitalize",
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

export default SettingPassword;
