import React from "react";
import KnowledgeLayout from "../layout";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const KnowledgeCiation = () => {
    const navigate = useNavigate();

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
                        Ciation
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

                </Box>
            </React.Fragment>
        </KnowledgeLayout>
    );
};

export default KnowledgeCiation;
