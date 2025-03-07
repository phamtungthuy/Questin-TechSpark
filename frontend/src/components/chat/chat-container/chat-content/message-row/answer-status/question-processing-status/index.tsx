import { Box, Typography } from "@mui/material";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { styled, keyframes } from "@mui/system";

// Định nghĩa animation `loading01`
const loading01 = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

// Tạo component động cho từng ký tự với hiệu ứng `loading01`
const AnimatedLetter = styled(Typography)(({ delay }: { delay: number }) => ({
    display: "inline-block",
    fontWeight: "800",
    margin: "0 -0.05em",
    animation: `${loading01} 1.4s infinite alternate`,
    animationDelay: `${delay}s`,
}));

// Component chính hiển thị dòng chữ động
const LoadingText = () => {
    const text = "Tìm kiếm các tài liệu liên quan ..."; // Chữ sẽ được hiển thị với hiệu ứng
    let count = 0;
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap="5px"
        >
            {text.split(" ").map((word, wordIndex) => (
                <Box display="flex" gap="2px">
                    {word.split("").map((letter, index) => {
                        count += 1
                        return (<AnimatedLetter
                            key={index}
                            delay={count * 0.05}
                        >
                            {letter}
                        </AnimatedLetter>)
                    })}
                </Box>
            ))}
        </Box>
    );
};
const QuestionProcessingStatus = () => {
    return (
        <Box display="flex" gap="10px">
            <QuestionMarkCircleIcon className="h-6 w-6" />
            <LoadingText />
        </Box>
    );
};

export default QuestionProcessingStatus;
