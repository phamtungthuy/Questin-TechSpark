import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { Box, Typography } from "@mui/material";

import { styled } from "@mui/system";

// Animation for the text
interface BouncingWordProps {
    delay: number;
    children: React.ReactNode;
}

// Animation for bouncing text on each word
const BouncingWord = styled(Typography)<BouncingWordProps>(({ delay }) => ({
    display: "inline-block",
    animation: "bounce 1s infinite",
    animationDelay: `${delay}s`,
    "@keyframes bounce": {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-5px)" },
    },
}));

// Split the sentence into words and animate each word
interface BouncingTextProps {
    text: string;
}

const BouncingText: React.FC<BouncingTextProps> = ({ text }) => {
    const words = text.split(" ");
    return (
        <>
            {words.map((word, index) => (
                <BouncingWord key={index} delay={index * 0.1}>
                    {word}&nbsp; {/* Add space between words */}
                </BouncingWord>
            ))}
        </>
    );
};

// Animation for the icon
const AnimatedIcon = styled(ArrowPathRoundedSquareIcon)({
    "@keyframes rotate": {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
    },
    animation: "rotate 2s infinite linear",
    marginRight: "8px", // Add space between icon and text
});

const QuestionRoutingStatus = () => {
    return (
        <Box display="flex" gap="5px">
            <AnimatedIcon className="h6 w-6 text-gray-500" />
            <Box>
                <BouncingText text="Đang phân loại câu hỏi ..."></BouncingText>
            </Box>
        </Box>
    );
};

export default QuestionRoutingStatus;
