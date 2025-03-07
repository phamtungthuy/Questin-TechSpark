import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
const moveGradient = keyframes`
  to {
    background-position: 100% 50%;
  }
`;

const dotFlashing = keyframes`
    0%     {transform: translateY(-1px)}
    16.67% {transform: translateY(-2px)}
    33.33% {transform: translateY(-3px)}
    50%    {transform: translateY(-4px)}
    66.67% {transform: translateY(-5px)}
    83.33% {transform: translateY(-6px)}
    100%   {transform: translateY(-7px)}
`;

const createBoxMove = (keyframesSteps: TemplateStringsArray) => keyframes`
  ${keyframesSteps}
`;

const oneMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    71.4285% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

const twoMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    71.4285% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

const threeMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(0% 70% 70% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
    71.4285% {
        clip-path: inset(0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(35% 70% 35% 0 round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

const fourMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
    71.4285% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

const fiveMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    71.4285% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

const sixMove = createBoxMove`
    0% {
        visibility: visible;
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    14.2857% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    28.5714% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    42.8571% {
        clip-path: inset(70% 0 0 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    57.1428% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    71.4285% {
        clip-path: inset(35% 0% 35% 70% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    85.7142% {
        clip-path: inset(35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }

    100% {
        clip-path: inset(70% 35% 0% 35% round 5%);
        animation-timing-function: cubic-bezier(0.86,  0,  0.07,  1);
    }
`;

type AnimatedBoxProps = {
    className: string;
    animation: ReturnType<typeof keyframes>;
};

const AnimatedBox = ({ className, animation }: AnimatedBoxProps) => {
    let animationMove = "3.5s infinite";
    switch (className) {
        case "one":
            animationMove = "3.5s infinite";
            break;
        case "two":
            animationMove = "3.5s 0.15s infinite";
            break;
        case "three":
            animationMove = "3.5s .3s infinite";
            break;
        case "four":
            animationMove = "3.5s .575s infinite";
            break;
        case "five":
            animationMove = "3.5s .725s infinite";
            break;
        case "six":
            animationMove = "3.5s .875s infinite";
            break;
    }
    return (
        <Box
            className={className}
            sx={{
                animation: `${moveGradient} 15s infinite, ${animation} ${animationMove}`,
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                background:
                    "linear-gradient(to right, #141562, #486FBC, #EAB5A1, #8DD6FF, #4973C9, #D07CA7, #F4915E, #F5919E, #B46F89, #141562, #486FBC)",
                backgroundPosition: "0% 50%",
                backgroundSize: "1000% 1000%",
                visibility: "hidden",
            }}
        />
    );
};

const LoadingPage = () => {
    const loadingText = "Loading...";
    return (
        <Box
            sx={{
                position: "absolute",
                left: "50%",
                top: "40%",
                width: "200px",
                height: "200px",
                margin: "-100px",
                backgroundColor: "transparent",
                border: "none",
                userSelect: "none",
            }}
        >
            <Box
                sx={{
                    width: "70%",
                    height: "70%",
                    margin: "15% 15%",
                    position: "relative",
                    transform: "rotate(-45deg)",
                }}
            >
                <AnimatedBox className="one" animation={oneMove} />
                <AnimatedBox className="two" animation={twoMove} />
                <AnimatedBox className="three" animation={threeMove} />
                <AnimatedBox className="four" animation={fourMove} />
                <AnimatedBox className="five" animation={fiveMove} />
                <AnimatedBox className="six" animation={sixMove} />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "20px",
                }}
            >
                {loadingText.split("").map((char, idx) => {
                    if (char !== ".") {
                        return (
                            <Box
                                key={idx}
                                sx={{
                                    animation: `${dotFlashing} 0.4s infinite linear alternate`,
                                    animationDelay: `${idx*0.05}s`
                                }}
                                marginRight={char === 'g' ? "10px" : "0px"}
                            >
                                <Typography fontWeight="bold">{char}</Typography>
                            </Box>
                        );
                    } else {
                        return (
                            <Box
                                key={idx}
                                sx={{
                                    width: "8px",
                                    height: "8px",
                                    margin: "0 2px",
                                    borderRadius: "50%",
                                    backgroundColor: "#000",
                                    opacity: 1,
                                    animation: `${dotFlashing} 0.4s infinite linear alternate`,
                                    animationDelay: `${idx*0.05}s`
                                }}
                            ></Box>
                        );
                    }
                })}
                
            </Box>
        </Box>
    );
};

export default LoadingPage;
