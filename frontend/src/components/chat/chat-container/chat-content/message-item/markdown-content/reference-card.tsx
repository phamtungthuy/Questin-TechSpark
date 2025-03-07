import { Avatar, Divider, Stack, Typography } from "@mui/material";
import SvgIcon from "components/svg-icon";
import { getExtension } from "utils/document-util";

interface IProps {
    url: string;
    title: string;
    description: string;
}

const ReferenceCard = ({ url, title, description }: IProps) => {

    let hostname = "";
    try {
        const parsedUrl = new URL(url);
        hostname = parsedUrl.hostname;
    } catch (error) {
        hostname = url;
    }

    const faviconSrc =
    url.startsWith("http") && hostname
        ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
        : "";

    return (
        <Stack direction="column" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
                {
                    url.startsWith("http") ? (
                        <Avatar
                            sx={{
                                width: 24,
                                height: 24,
                                bgcolor: "#fff"
                            }}
                            alt="Favicon"
                            src={faviconSrc}
                        />
                    ) : (
                        <SvgIcon 
                            name={`file-icon/${getExtension(url)}`}
                            width={24}
                        />)
                }
                <Typography
                    variant="body1"
                    fontWeight="medium"
                    sx={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        textOverflow: "ellipsis",
                        overflow: "hidden"
                    }}
                >
                    {title}
                </Typography>
            </Stack>
            <Divider color="#fff" />
            <Typography
                variant="body2"
                sx={{
                    display: "-webkit-box",
                    overflow: "auto",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 10,
                    padding: 0,
                    whiteSpace: "pre-line",
                    border: "none", // Loại bỏ viền nếu có
                    boxShadow: "none", // Loại bỏ bóng nếu có
                }}
            >
                {description}
            </Typography>
        </Stack>
    );
};

export default ReferenceCard;
