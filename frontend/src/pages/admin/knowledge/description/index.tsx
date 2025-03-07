import {
    Box,
    Breadcrumbs,
    Button,
    Divider,
    TextField,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import KnowledgeLayout from "../layout";
import knowledgebaseApis from "api/admin/knowledgebase/knowledgebase-api";

const KnowledgeDescription = () => {
    const navigate = useNavigate();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [knowledgeBasePhoto, setKnowledgeBasePhoto] = useState<any>();
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
        },
        onDrop: (acceptedFiles) => {
            setKnowledgeBasePhoto(
                Object.assign(acceptedFiles[0], {
                    preview: URL.createObjectURL(acceptedFiles[0]),
                })
            );
        },
    });

    const location = useLocation();

    const getKnowledgeBaseDescription = async () => {
        const response = await knowledgebaseApis.getKnowledgeBaseDescription(
            location.search.split("?id=")[1]
        );
        if (response.status === 200) {
            const data = response.data.data;
            setName(data["field"]);
            setDescription(data["description"]);
            setKnowledgeBasePhoto(
                Object.assign(
                    {},
                    {
                        preview: "data:image/jpeg;base64," + data["avatar_url"],
                    }
                )
            );
        }
    };

    const updateKnowledgeBaseDescription = async () => {
        const formData = new FormData();
        formData.append("field", name);
        formData.append("description", description);
        if (!knowledgeBasePhoto.preview.startsWith("data:image/jpeg;base64,")) {
            formData.append("file", knowledgeBasePhoto);
        }
        const response = await knowledgebaseApis.updateKnowledgeBaseDescription(
            location.search.split("?id=")[1],
            formData
        );
        if (response.status === 200) {
            toast.success(response.data.message);
        } else {
            toast.error(response.data.message);
        }
    };

    useEffect(() => {
        getKnowledgeBaseDescription();
    }, []);
    return (
        <KnowledgeLayout>
            <React.Fragment>
                <Breadcrumbs aria-label="breadcrumb">
                    <Typography
                        color="inherit"
                        onClick={() => navigate("/admin/knowledge")}
                        fontSize="16px"
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        Knowledge Base
                    </Typography>
                    <Typography color="text.primary" fontSize="16px">
                        Description
                    </Typography>
                </Breadcrumbs>
                <Box
                    marginTop="16px"
                    sx={{
                        backgroundColor: "#fff",
                        flex: "1 1",
                        boxSizing: "border-box",
                    }}
                >
                    <Box padding="30px 30px 0">
                        <Typography
                            variant="h3"
                            fontWeight="bold"
                            fontSize="16px"
                            margin="16px 0"
                        >
                            Description
                        </Typography>
                        <Typography fontSize="16px" margin="14px 0">
                            Write your introduction about your agent here.
                        </Typography>
                        <Divider sx={{ marginY: "24px" }} />
                        <Box display="flex">
                            <Box flex={1} paddingX="16px">
                                <Box marginBottom="24px">
                                    <Typography
                                        fontSize="16px"
                                        paddingBottom="8px"
                                    >
                                        <Box
                                            component="span"
                                            color="red"
                                            marginRight="4px"
                                        >
                                            *
                                        </Box>
                                        Knowledge base name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        inputProps={{
                                            style: {
                                                padding: 4,
                                            },
                                        }}
                                    />
                                </Box>
                                <Box marginBottom="24px">
                                    <Typography
                                        fontSize="16px"
                                        paddingBottom="8px"
                                    >
                                        Knowledge base photo
                                    </Typography>
                                    <Box
                                        display="flex"
                                        gap="10px"
                                        flexWrap="wrap"
                                    >
                                        {knowledgeBasePhoto && (
                                            <Box
                                                width="102px"
                                                height="102px"
                                                border="1px solid #ccc"
                                                borderRadius="8px"
                                                padding="8px"
                                            >
                                                <Box
                                                    component="img"
                                                    height="100%"
                                                    src={
                                                        knowledgeBasePhoto.preview
                                                    }
                                                    alt="knowledge base photo"
                                                    sx={{
                                                        "&:hover": {
                                                            backgroundColor:
                                                                "rgba(0, 0, 0, 0.45)",
                                                        },
                                                    }}
                                                ></Box>
                                            </Box>
                                        )}
                                        <Box
                                            border="1px dashed #d9d9d9"
                                            borderRadius="8px"
                                            sx={{
                                                backgroundColor:
                                                    "rgba(0, 0, 0, 0.02)",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    border: "1px dashed blue",
                                                },
                                            }}
                                            width="102px"
                                            height="102px"
                                            {...getRootProps()}
                                            padding="28px"
                                            alignItems="center"
                                            display="flex"
                                            flexDirection="column"
                                        >
                                            <input {...getInputProps()} />
                                            <AddIcon />
                                            <Typography>Upload</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box marginBottom="24px">
                                    <Typography
                                        fontSize="16px"
                                        paddingBottom="8px"
                                    >
                                        Description
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        inputProps={{
                                            style: {
                                                padding: 4,
                                            },
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
                                        onClick={() => {
                                            getKnowledgeBaseDescription();
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
                                        onClick={async () => {
                                            updateKnowledgeBaseDescription();
                                        }}
                                    >
                                        {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                                        OK
                                    </Button>
                                </Box>
                            </Box>
                            <Box flex={2} paddingX="16px">
                                <Typography
                                    fontWeight="bold"
                                    fontSize="18px"
                                    marginBottom="8px"
                                >
                                    Example
                                </Typography>
                                <Typography>
                                    The following is an example of a
                                    description:
                                </Typography>
                                <Box
                                    padding="32px 28px"
                                    display="flex"
                                    gap="20px"
                                    alignItems="center"
                                    sx={{
                                        backgroundColor: "#f9f9f9",
                                        cursor: "pointer",
                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(236, 236, 236)",
                                        },
                                    }}
                                    borderRadius="8px"
                                    maxWidth="500px"
                                >
                                    <Box
                                        component="img"
                                        src={
                                            knowledgeBasePhoto
                                                ? knowledgeBasePhoto.preview
                                                : "https://www.iconpacks.net/icons/2/free-file-icon-1453-thumb.png"
                                        }
                                        borderRadius="50%"
                                        width="96px"
                                        height="96px"
                                    />
                                    <Box>
                                        <Typography fontWeight="bold">
                                            {name}
                                        </Typography>
                                        <Typography>{description}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </React.Fragment>
        </KnowledgeLayout>
    );
};

export default KnowledgeDescription;
