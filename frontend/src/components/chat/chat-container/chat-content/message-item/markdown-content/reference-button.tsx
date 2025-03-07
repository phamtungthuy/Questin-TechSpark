import {
    Button,
    useTheme,
    Typography,
    styled,
    ButtonProps,
} from "@mui/material";
import { LinkIcon } from "@heroicons/react/24/outline";
interface IProps extends ButtonProps {
    title: string;
    href?: string;
}

const ReferenceButton = ({ title, href, ...props }: IProps) => {
    const theme = useTheme();

    let hostname = "";
    try {
        const parsedUrl = new URL(title);
        hostname = parsedUrl.hostname;
    } catch (error) {
        hostname = title;
    }
    const StyledButton = styled(Button)(({ theme }) => ({
        backgroundColor:
            theme.palette.mode === "dark"
                ? theme.palette.grey[800]
                : theme.palette.grey[100],
        borderRadius: "16px",
        padding: theme.spacing(0.5, 1.5),
        height: theme.spacing(2.5),
        transition: theme.transitions.create(["background-color", "color"], {
            duration: theme.transitions.duration.short,
        }),
        "&:hover": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
        },
    }));

    return (
        <StyledButton
            variant="text"
            size="small"
            endIcon={href && href.startsWith("http") && <LinkIcon className="h-4 w-4" />}
            {...props}
            onClick={() => {
                if (href && href.startsWith("http")) {
                    window.open(href, "_blank");
                }
            }}
        >
            <Typography
                variant="caption"
                component="span"
                sx={{
                    fontWeight: theme.typography.fontWeightMedium,
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    maxWidth: 120,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {hostname}
            </Typography>
        </StyledButton>
    );
};

export default ReferenceButton;
