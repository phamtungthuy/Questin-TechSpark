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


const TextLoaded = ({ text }: {text: string}) => {
    return (
        <Box display="flex" gap="5px">
            <Box>
                <BouncingText text={text}></BouncingText>
            </Box>
        </Box>
    );
};

export default TextLoaded;
