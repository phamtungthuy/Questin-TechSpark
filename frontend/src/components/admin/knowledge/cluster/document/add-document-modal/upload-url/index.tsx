import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import LinkIcon from "@mui/icons-material/Link";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";

interface UploadUrlProps {
    urls: string[];
    setUrls: (urls: string[]) => void;
}

const UploadUrl: React.FC<UploadUrlProps> = ({ urls, setUrls }) => {
    const [hoveredIndex, setHoveredIndex] = useState<Number>(-1);
    const [url, setUrl] = useState<string>("");
    const removeUrl = (idx: number) => {
        const updatedUrls = [...urls];
        updatedUrls.splice(idx, 1);
        setUrls(updatedUrls);
    };

    const addUrl = () => {
        if (url.trim() !== "") {
            setUrls([...urls, url]);
            setUrl("");
        }
    };

    return (
        <Box>
            <Box
                display="flex"
                alignItems="center"
                gap="20px"
                justifyContent="space-between"
            >
                <TextField
                    fullWidth
                    inputProps={{
                        style: {
                            padding: 8,
                            fontSize: "12px",
                        },
                    }}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <IconButton
                    sx={{
                        backgroundColor: "#4599e9",
                        borderRadius: "6px",
                        padding: "4px",
                        color: "#fff",
                        "&:hover": {
                            backgroundColor: "#4599e9",
                            opacity: 0.7,
                        },
                    }}
                    onClick={addUrl}
                >
                    <AddIcon />
                </IconButton>
            </Box>
            {urls &&
                urls.map((url: string, idx: number) => {
                    return (
                        <Box
                            key={idx}
                            display="flex"
                            justifyContent="space-between"
                            marginTop="8px"
                            sx={{
                                "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                },
                                cursor: "context-menu",
                            }}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(-1)}
                        >
                            <Box display="flex" gap="8px">
                                <LinkIcon />
                                <Tooltip title={url}>
                                    <Typography
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 1, // Giới hạn số dòng
                                            WebkitBoxOrient: "vertical",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {url}
                                    </Typography>
                                </Tooltip>
                            </Box>
                            {hoveredIndex === idx && (
                                <DeleteOutlinedIcon
                                    sx={{
                                        "&:hover": {
                                            cursor: "pointer",
                                            backgroundColor: "#e7e7e7",
                                            borderRadius: "4px",
                                        },
                                    }}
                                    onClick={() => removeUrl(idx)}
                                />
                            )}
                        </Box>
                    );
                })}
        </Box>
    );
};

export default UploadUrl;
