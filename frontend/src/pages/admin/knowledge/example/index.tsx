import {
    Box,
    Breadcrumbs,
    Button,
    Divider,
    Grid,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import KnowledgeLayout from "../layout";
import knowledgebaseApis from "api/admin/knowledgebase/knowledgebase-api";
import chatApi from "api/user/chat-api";

interface ExampleProps {
    id: string;
    question: string;
}

const KnowledgeExample = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [field, setField] = useState<string>("");
    const [examples, setExamples] = useState<Array<ExampleProps>>([
        {
            id: "",
            question: "",
        },
        {
            id: "",
            question: "",
        },
        {
            id: "",
            question: "",
        },
        {
            id: "",
            question: "",
        },
        {
            id: "",
            question: "",
        },
        {
            id: "",
            question: "",
        },
    ]);

    const getExamples = async () => {
        const response = await chatApi.getQuestionExamples(
            location.search.split("?id=")[1]
        );
        if (response.status === 200) {
            setExamples(response.data.data["examples"]);
            setField(response.data.data["field"]);
        }
    };

    const updateExamples = async () => {
        const response = await knowledgebaseApis.updateKnowledgeBaseExamples(
            location.search.split("?id=")[1],
            {
                examples: examples,
            }
        );
        if (response.status === 200) {
            toast.success(response.data.message);
        } else {
            toast.error(response.data.message);
        }
    };

    useEffect(() => {
        getExamples();
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
                        Example
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
                            Examples
                        </Typography>
                        <Typography fontSize="16px" margin="14px 0">
                            Below is your examples:
                        </Typography>
                        <Divider sx={{ marginY: "24px" }} />
                    </Box>
                    <Box display="flex">
                        <Box flex={1} paddingX="16px">
                            {examples.map((example, index) => {
                                return (
                                    <Box marginBottom="24px" key={index}>
                                        <Typography
                                            fontSize="16px"
                                            paddingBottom="8px"
                                        >
                                            Example {index}
                                        </Typography>
                                        <TextField
                                            value={example["question"]}
                                            onChange={(e) => {
                                                const newExamples =
                                                    examples.map((ex, i) =>
                                                        i === index
                                                            ? {
                                                                  ...ex,
                                                                  question:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : ex
                                                    );
                                                setExamples(newExamples);
                                            }}
                                            fullWidth
                                            inputProps={{
                                                style: {
                                                    padding: 4,
                                                },
                                            }}
                                        />
                                    </Box>
                                );
                            })}
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
                                        getExamples();
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
                                        updateExamples();
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
                                The following is an example which is displayed
                                in user UI:
                            </Typography>
                            <Divider sx={{ marginY: "24px" }} />
                            <Typography
                                fontWeight="bold"
                                fontSize="20px"
                                marginBottom="10px"
                                align="center"
                            >
                                {field}
                            </Typography>
                            <Grid
                                container
                                spacing={1}
                                sx={{ rowGap: 1 }}
                                margin="16px -5px 0"
                                maxWidth="800px"
                                marginX="auto"
                            >
                                {examples.map((example, idx) => {
                                    return (
                                        <Grid item xs={6}>
                                            <Tooltip
                                                title={
                                                    <Typography>
                                                        {example["question"]}
                                                    </Typography>
                                                }
                                            >
                                                <Box
                                                    component="div"
                                                    sx={{
                                                        cursor: "pointer",
                                                        border: "1px solid black",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        borderRadius: "8px",
                                                        padding: "20px",
                                                        maxWidth: "400px",
                                                    }}
                                                    key={idx - 100}
                                                >
                                                    <Typography
                                                        variant="body1"
                                                        noWrap
                                                    >
                                                        {example["question"]}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </Box>
                </Box>
            </React.Fragment>
        </KnowledgeLayout>
    );
};

export default KnowledgeExample;
