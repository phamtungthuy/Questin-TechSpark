import { Box } from "@mui/system";

const DotLoader = () => {
    return (
        <Box
            sx={{
                height: "5px",
                aspectRatio: "5",
                WebkitMask:
                    "linear-gradient(90deg, rgba(0, 0, 0, 0), #000 20% 80%, rgba(0, 0, 0, 0))",
                background:
                    "radial-gradient(closest-side at 37.5% 50%, #000 94%, rgba(0, 0, 0, 0)) 0/calc(80%/3) 100%",
                animation: "l48 .75s infinite linear",
                "@keyframes l48": {
                    "100%": {
                        backgroundPosition: "36.36%",
                    },
                },
            }}
        />
    );
};

export default DotLoader;