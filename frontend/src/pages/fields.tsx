import { Box, Grid, Typography, IconButton } from "@mui/material";
import { useState } from "react";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import { IDialog } from "interfaces/database/dialog";
const CarouselGrid = ({ dialogList = [] }: { dialogList: IDialog[] }) => {
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0);

  const ITEMS_PER_PAGE = 6;
  const totalItems = dialogList.length;

  if (!dialogList || dialogList.length === 0) {
    return <Typography>No data available</Typography>;
  }

  const handlePrev = () => {
    setStartIndex((prevIndex) =>
      prevIndex === 0 ? totalItems - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setStartIndex((prevIndex) =>
      prevIndex + 1 >= totalItems ? 0 : prevIndex + 1
    );
  };

  const displayedItems =
    totalItems < ITEMS_PER_PAGE
      ? dialogList
      : Array.from({ length: ITEMS_PER_PAGE }, (_, index) => {
          return dialogList[(startIndex + index) % totalItems];
        });

  return (
    <Box position="relative">
      {totalItems > ITEMS_PER_PAGE && (
        <IconButton
          onClick={handlePrev}
          sx={{
            position: "absolute",
            top: "50%",
            left: "-40px",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "#fff",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
      )}
      <Grid
        height="300px"
        margin="0"
        container
        spacing={1}
        sx={{
          display: "flex",
          overflow: "visible",
          width: "100%",
          justifyContent: totalItems < ITEMS_PER_PAGE ? "center" : "flex-start",
          alignItems: "center",
        }}
      >
        {displayedItems.map((dialog: IDialog) => (
          <Grid
            item
            xs={2}
            key={dialog.id}
            padding="8px"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Box
              width="200px"
              height="280px"
              padding="20px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="start"
              sx={{
                backgroundColor: "rgb(166,210,255)",
                cursor: "pointer",
                transition: "all .3s ease-in-out",
                "&:hover": {
                  backgroundColor: "#5691d1",
                  transform: "scale(1.1)",
                },
              }}
              borderRadius="20px"
              onClick={() => navigate(`/${dialog.id}/`)}
            >
              <Box
                component="img"
                src={
                  dialog.icon
                    ? "data:image/jpeg;base64," + dialog.icon
                    : "/file.png"
                }
                borderRadius="50%"
                width="48px"
                height="48px"
              />
              <Box textAlign="start">
                <Typography
                  fontWeight="bold"
                  fontSize="1.3rem"
                  margin="10px 0px"
                >
                  {dialog.name}
                </Typography>
                <Typography>{dialog.description}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
      {totalItems > ITEMS_PER_PAGE && (
        <IconButton
          onClick={handleNext}
          sx={{
            position: "absolute",
            top: "50%",
            right: "-40px",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "#fff",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default CarouselGrid;
