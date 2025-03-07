import {
    Avatar,
    Box,
    Divider,
    Link,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import SvgIcon from "components/svg-icon";
import { Dialog } from "components/ui/dialog";
import { IReference } from "interfaces/database/conversation";
import { getExtension } from "utils/document-util";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    reference: IReference;
}

const ReferenceDialogCard = ({
    url,
    title,
    description,
}: {
    url: string;
    title: string;
    description: string;
}) => {
    const theme = useTheme();

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
        <Link
            href={url.startsWith("http") ? url : undefined}
            target="_blank"
            rel="noopener"
            underline="none"
            sx={{
                display: "flex",
                cursor: "pointer",
                flexDirection: "column",
                gap: theme.spacing(0.5),
                px: theme.spacing(3),
                py: theme.spacing(2.5),
                transition: theme.transitions.create("background-color", {
                    duration: theme.transitions.duration.short,
                }),
                // Dùng action.hover của theme để tránh hardcode màu
                "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                },
            }}
        >
            <Stack direction="column" spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {url.startsWith("http") ? (
                        <Avatar
                            sx={{
                                width: 24,
                                height: 24,
                            }}
                            alt="Favicon"
                            src={faviconSrc}
                        />
                    ) : (
                        // <SvgIcon
                        //     name={`file-icon/${getExtension(url)}`}
                        //     width={24}
                        // />
                        <Avatar
                            sx={{
                                width: 24,
                                height: 24,
                            }}
                            alt="Favicon"
                            src={"https://www.google.com/s2/favicons?domain=https://uet.vnu.edu.vn/&sz=32"}
                        />
                    )}
                    <Typography
                        variant="body1"
                        fontWeight="medium"
                        sx={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                        }}
                    >
                        {title}
                    </Typography>
                </Stack>
                <Typography
                    variant="body2"
                    sx={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 3,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    }}
                >
                    {description}
                </Typography>
            </Stack>
        </Link>
    );
};

const ReferenceDialog = ({ visible, hideModal, reference }: IProps) => {
    const doc_aggs = reference.doc_aggs ?? [];
    const chunks = reference.chunks ?? [];

    const knowledgeChunks = chunks.filter(
        (chunkItem) => !chunkItem.docnm_kwd?.startsWith("http")
    );
    const externalChunks = chunks.filter((chunkItem) =>
        chunkItem.docnm_kwd?.startsWith("http")
    );

    return (
        <Dialog
            visible={visible}
            hideModal={hideModal}
            title={"Link"}
            footer={false}
        >
            <Box
                display="flex"
                flexDirection="column"
                gap="8px"
                maxHeight={500}
                overflow="auto"
            >
                {knowledgeChunks.length > 0 && (
                    <>
                        <Divider />
                        <Typography fontWeight={500}>Kho kiến thức</Typography>
                        <Divider />
                        {knowledgeChunks.map((chunkItem, index) => {
                            return (
                                <ReferenceDialogCard
                                    key={index}
                                    url={chunkItem.docnm_kwd}
                                    title={
                                        chunkItem?.title_kwd ||
                                        chunkItem.docnm_kwd
                                    }
                                    description={chunkItem.content_with_weight}
                                />
                            );
                        })}
                    </>
                )}

                {externalChunks.length > 0 && (
                    <>
                        <Divider />
                        <Typography fontWeight={500}>Links</Typography>
                        <Divider />
                        {externalChunks.map((chunkItem, index) => {
                            return (
                                <ReferenceDialogCard
                                    key={index}
                                    url={chunkItem.docnm_kwd}
                                    title={
                                        chunkItem?.title_kwd ||
                                        chunkItem.docnm_kwd
                                    }
                                    description={chunkItem.content_with_weight}
                                />
                            );
                        })}
                    </>
                )}
            </Box>
        </Dialog>
    );
};

export default ReferenceDialog;
