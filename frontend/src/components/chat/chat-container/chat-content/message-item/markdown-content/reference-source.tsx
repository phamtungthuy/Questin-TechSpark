import { Avatar, Box, Button, Typography, useTheme } from "@mui/material";
import SvgIcon from "components/svg-icon";
import { useSetModalState } from "hooks/common-hook";
import { IReference } from "interfaces/database/conversation";
import { getExtension } from "utils/document-util";
import ReferenceDialog from "./reference-dialog";

interface IProps {
    reference: IReference;
}

const ReferenceSource = ({ reference }: IProps) => {
    const theme = useTheme();
    const doc_aggs = reference?.doc_aggs ?? [];
    const chunks = reference?.chunks ?? [];
    const favicons =
        doc_aggs.map((doc_agg) => {
            const url = doc_agg.doc_name;
            try {
                const parsedUrl = new URL(url);
                const hostname = parsedUrl.hostname;
                console.log(hostname);
                return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
            } catch (error) {
                return `https://www.google.com/s2/favicons?domain=https://uet.vnu.edu.vn/&sz=32`;
                return url;
            }
        }) ??
        chunks.map((chunk) => {
            const url = chunk.docnm_kwd;
            try {
                const parsedUrl = new URL(url);
                const hostname = parsedUrl.hostname;
                console.log(hostname);
                return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
            } catch (error) {
                return `https://www.google.com/s2/favicons?domain=https://uet.vnu.edu.vn/&sz=32`;

                return url;
            }
        });
    // const favicons = [
    //     "https://www.google.com/s2/favicons?domain=https://laodong.vn&sz=32",
    //     "https://www.google.com/s2/favicons?domain=https://thuvienphapluat.vn&sz=32",
    //     "https://www.google.com/s2/favicons?domain=https://xaydungchinhsach.chinhphu.vn&sz=32",
    //     "https://www.google.com/s2/favicons?domain=https://vnexpress.net&sz=32",
    // ];

    const {
        visible: referenceLinksVisible,
        showModal: showReferenceLinks,
        hideModal: hideReferenceLinks,
    } = useSetModalState();

    if (chunks.length === 0) {
        return null;
    }

    return (
        <>
            <ReferenceDialog
                visible={referenceLinksVisible}
                hideModal={hideReferenceLinks}
                reference={reference}
            />
            <Button
                disableRipple
                sx={{
                    mb: theme.spacing(2),
                    mt: theme.spacing(3),
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1.5),
                    borderRadius: "16px",
                    border: "0.5px solid",
                    borderColor: theme.palette.divider,
                    backgroundColor: theme.palette.background.paper,
                    py: theme.spacing(2),
                    pl: theme.spacing(3),
                    pr: theme.spacing(2.5),
                    textTransform: "none",
                    // Sử dụng pseudo-selector để khi hover thay đổi màu nền và border của các favicon
                    "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                        border: "1px solid",
                    },
                }}
                onClick={showReferenceLinks}
            >
                <Typography
                    variant="body1"
                    sx={{ fontWeight: theme.typography.fontWeightBold }}
                >
                    Nguồn
                </Typography>
                {/* Container cho các favicon, dùng flex với hướng đảo ngược để mô phỏng flex-row-reverse */}
                <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
                    {favicons.map((src, index) => (
                        <Box
                            key={src}
                            className="favicon"
                            sx={{
                                overflow: "hidden",
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: theme.palette.background.paper,
                                backgroundColor: theme.palette.background.paper,
                                // Áp dụng margin-right âm cho các phần tử trừ phần tử đầu tiên (theo DOM order)
                                ml: index === 0 ? 0 : `-${theme.spacing(1.5)}`,
                            }}
                        >
                            {src && src.startsWith("http") ? (
                                <Avatar
                                    src={src}
                                    alt="Favicon"
                                    sx={{ width: 20, height: 20 }}
                                    variant="square"
                                />
                            ) : (
                                <SvgIcon
                                    name={`file-icon/${getExtension(src)}`}
                                    width={20}
                                />
                            )}
                        </Box>
                    ))}
                </Box>
            </Button>
        </>
    );
};

export default ReferenceSource;
