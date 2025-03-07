import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Container } from "components/ui/container";
import { Card } from "components/ui/card";
import HomePageHeader from "components/home-page/header";
import SvgIcon from "components/svg-icon";

const NoFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Container direction="column" justifyContent="space-between">
            <HomePageHeader />
            <Card sx={{ maxWidth: "100vw"}}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h1" component="h1">
                        404
                    </Typography>
                    <Typography
                        variant="h6"
                        component="p"
                        color="textSecondary"
                        gutterBottom
                    >
                        Không tìm thấy trang, vui lòng nhập địa chỉ chính xác
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/")}
                    >
                        Trở về trang chủ
                    </Button>
                </Box>
            </Card>
        </Container>
    );
};

export default NoFoundPage;
