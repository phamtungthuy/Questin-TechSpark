import React, { useState } from "react";
import { Box, Card, CardContent, keyframes, Typography } from "@mui/material";

const scroll = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
`;


const items = [
    "Write a text asking a friend to be my plus-one at a wedding",
    "Write a message that goes with a kitten gif for a friend on a rough day",
    "Help me study vocabulary for a college entrance exam",
    "Give me ideas for what to do with my kids' art",
    "Write an email to request a quote from local plumbers",
    "Write a text inviting my neighbors to a barbecue",
];

interface CustomBoxProps {
  text: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface CarouselProps {
    isReversed?: boolean;
    items: Array<string>;
}

const CustomBox = ({ text, onMouseEnter, onMouseLeave }: CustomBoxProps) => {
    return (
        <Card
            sx={{
                width: "21.875rem",
                padding: "1rem 1.41875rem",
                position: "relative",
                borderRadius: ".42125rem",
                border: "1px solid #ccc",
                height: "100px",
                boxShadow: "none",
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Box display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="10px"
                sx={{
                    padding: 0,
                    "&:hover": {
                        cursor: "pointer",
                        textDecoration: "underline",
                    },
                }}
            >
                <Box
                    borderRadius="50%"
                    width="48px"
                    height="48px"
                    component="img"
                    src="https://cdn.thuvienphapluat.vn/uploads/tintuc/2024/01/19/xay-dung-luat.jpg"
                >

                </Box>
                <Box
                    
                    
                >
                    <Typography fontWeight="bold" fontSize="12px"
                    >
                        Luật Pháp
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            whiteSpace: "normal",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        {text}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

const Carousel = ({isReversed=false}: CarouselProps) => {
    const [isPaused, setIsPaused] = useState(false);



    return (
        <Box
            width="100%"
            overflow="hidden"
            whiteSpace="nowrap"
            position="relative"
        >
            <Box
                width="max-content"
                sx={{
                    animation: `${scroll} 200s linear infinite`,
                    animationDirection: isReversed ? "reverse" : "normal",
                    animationPlayState: isPaused ? "paused" : "running", 
                    display: "flex",
                    gap: "12px",
                    translate: isReversed ? '10%' : '',
                }}
            >
                {items.concat(items, items, items, items, items, items,).map((item, index) => (
                    <CustomBox key={index} text={item} 
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default Carousel;
