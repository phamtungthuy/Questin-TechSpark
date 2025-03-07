import { Box, Typography } from "@mui/material";
import HomePageContent from "components/home-page/content/home";
import HomePageHeader from "components/home-page/header";

const HomePage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      sx={{
        backgroundImage: "url('bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: "0.8",
        zIndex: -1,
      }}
    >
      <Box>
        <HomePageHeader />
      </Box>
      <Box marginY="auto">
        <HomePageContent />
      </Box>
      <Typography
        textAlign="center"
        padding="6px 0px 0px"
        sx={{
          fontSize: { xs: "11px", md: "14px" },
          paddingBottom: 1,
        }}
      >
        Questin có thể mắc sai lầm. Vui lòng kiểm tra lại thông tin quan trọng.
      </Typography>
    </Box>
  );
};

export default HomePage;
