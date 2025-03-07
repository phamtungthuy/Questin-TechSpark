import {
  Box,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useFetchNextDialogList } from "hooks/dialog-hook";
import { AttachFile, ArrowUpward } from "@mui/icons-material";
import DialogCard from "./dialog-card";
import { useTranslate } from "hooks/common-hook";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "hooks/auth-hook";

const HomePageContent = () => {
  const { data: dialogList } = useFetchNextDialogList();
  const { t } = useTranslate("common");
  const navigate = useNavigate();

  useEffect(() => {
    if (dialogList.length < 0) {
      navigate(`/${dialogList[0].id}`);
    }
  }, [dialogList]);

  console.log(dialogList);

  return (
    <Box display="flex" flexDirection="column">
      {/* <Container
        component="main"
        sx={{
          mb: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 500,
            mb: 4,
            fontSize: {
              xs: "29px",
              sm: "39px",
              md: "49px",
            },
          }}
        ></Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t("askQuestinAQuestion")}
          sx={{
            maxWidth: 600,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "text.disabled",
                transition: "border-color 0.3s ease",
              },
              "&:hover fieldset": {
                borderColor: "text.primary",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                borderWidth: "2px",
              },
              "& input": {
                padding: "12px",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AttachFile />
                <Typography color="text.secondary" sx={{ mr: 1 }}>
                  + Project
                </Typography>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <ArrowUpward />
              </InputAdornment>
            ),
          }}
        />
      </Container> */}

      <Box
        display="flex"
        justifyContent="center"
        flexWrap="wrap"
        gap={2}
        sx={{
          marginTop: "50px",
          width: "100%",
        }}
      >
        {dialogList.map((dialog) => (
          <Box
            key={dialog.id}
            display="flex"
            maxWidth="550px"
            padding="8px 16px"
            flex="1 1 auto"
          >
            <DialogCard dialog={dialog} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HomePageContent;
