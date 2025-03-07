import React, { useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";

interface IProps {
  images: string[];
}

const OverlappingImageCards = ({ images }: IProps) => {
  // Kích thước card và độ lệch (offset) của từng card
  const cardWidth = 100;
  const cardHeight = 140;
  const offsetHeight = 0;
  const offsetWidth = 20;

  // State để điều khiển dialog gallery và index của ảnh đang hiển thị
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mở dialog và set ảnh được click làm ảnh đầu tiên hiển thị
  const handleOpen = (index: number) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Di chuyển sang ảnh trước (nếu có)
  const handlePrev = (event: React.MouseEvent) => {
    event.stopPropagation(); // Ngăn chặn sự kiện nổi lên từ dialog
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Di chuyển sang ảnh sau (nếu có)
  const handleNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Hiển thị các card ảnh chồng lên nhau */}
      <Box
        sx={{
          position: "relative",
          width: cardWidth + offsetWidth * (images.length - 1),
          height: cardHeight + offsetHeight * (images.length - 1),
        }}
      >
        {images.map((image, index) => (
          <Card
            key={index}
            sx={{
              position: "absolute",
              top: index * offsetHeight,
              left: index * offsetWidth,
              width: cardWidth,
              height: cardHeight,
              zIndex: images.length - index,
              padding: 0,
              overflow: "hidden",
              cursor: "pointer",
              // Khi hover hiển thị overlay có icon
              "&:hover .overlay": {
                opacity: 1,
              },
            }}
            onClick={() => handleOpen(index)}
          >
            <CardMedia
              component="img"
              image={image}
              alt={`Ảnh ${index + 1}`}
              sx={{ width: "100%", height: "100%" }}
            />
            {/* Overlay mờ và icon zoom */}
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: 0,
                transition: "opacity 0.3s ease",
              }}
            >
              <IconButton
                sx={{
                  color: "white",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                  },
                }}
              >
                <ZoomInIcon fontSize="large" />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Dialog Gallery */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.6)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleClose}
        >
          {/* Nút Prev: Đặt cố định ở bên trái màn hình */}
          <IconButton
            onClick={handlePrev}
            disabled={currentIndex === 0}
            sx={{
              position: "fixed",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <ArrowBackIosNewIcon fontSize="large" />
          </IconButton>

          {/* Ảnh hiển thị hiện tại */}
          <Box
            component="img"
            src={images[currentIndex]}
            alt={`Ảnh ${currentIndex + 1}`}
            sx={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
            }}
            onClick={(event) => event.stopPropagation()}
          />

          {/* Nút Next: Đặt cố định ở bên phải màn hình */}
          <IconButton
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
            sx={{
              position: "fixed",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <ArrowForwardIosIcon fontSize="large" />
          </IconButton>

          {/* Nút Đóng: Đặt ở góc phải trên màn hình */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "fixed",
              top: 10,
              right: 10,
              color: "white",
            }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
        </Box>
      </Dialog>
    </>
  );
};

export default OverlappingImageCards;
