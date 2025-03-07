import React from "react";
import { Typography } from "@mui/material";
import { styled, keyframes, SxProps } from "@mui/system";

// Định nghĩa keyframes cho hiệu ứng opacity (từ đậm -> nhạt rồi quay lại đậm)
const fadeAnimation = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
`;

// Component styled cho từng chữ cái với animation riêng và delay để tạo hiệu ứng tuần tự
interface FadingLetterProps {
  delay: number;
}

const FadingLetter = styled("span")<FadingLetterProps>(({ delay }) => ({
  display: "inline-block",
  animation: `${fadeAnimation} 1s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  background: "inherit", // Kế thừa background từ phần tử cha
  WebkitBackgroundClip: "inherit", // Kế thừa thuộc tính cắt background
  WebkitTextFillColor: "inherit", // Kế thừa thuộc tính fill màu chữ
}));

// Component nhận vào text và variant của Typography để render text theo hiệu ứng
interface FadingTextProps {
  text: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2";
  sx?: SxProps;
}

const FadingText: React.FC<FadingTextProps> = ({
  text,
  variant = "body2",
  sx
}) => {
  // Sử dụng Array.from để tách text thành từng ký tự đúng cách, kể cả emoji và các kí tự đặc biệt
  const characters = Array.from(text);
  return (
    <Typography
      variant={variant}
      sx={{
        fontSize: "14px", // chữ nhỏ
        letterSpacing: 0, // không điều chỉnh thêm khoảng cách giữa các chữ (sử dụng margin của từng chữ để kiểm soát)
        ...sx
      }}
    >
      {characters.map((char, index) =>
        char === " " ? (
          // Nếu ký tự là khoảng trắng, giữ nguyên (có thể render &nbsp; để đảm bảo khoảng cách)
          <span key={index}>&nbsp;</span>
        ) : (
          <FadingLetter key={index} delay={index * 0.02}>
            {char}
          </FadingLetter>
        )
      )}
    </Typography>
  );
};

export default FadingText;
