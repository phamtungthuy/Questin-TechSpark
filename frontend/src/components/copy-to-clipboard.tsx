import { useState } from "react";
import { CopyToClipboard as Clipboard, Props } from "react-copy-to-clipboard";
import { Box, Tooltip } from "@mui/material";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useTranslate } from "hooks/common-hook";
const CopyToClipBoard = ({ text }: Props) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslate("common");

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <Box display="flex" alignItems="center" sx={{ cursor: "pointer" }}>
            <Tooltip title={copied ? t("copied") : t("copy")}>
                <Box>
                    <Clipboard text={text} onCopy={handleCopy}>
                        {copied ? (
                            <CheckIcon className="h-4 h-4" />
                        ) : (
                            <ClipboardIcon className="h-4 h-4" />
                        )}
                    </Clipboard>
                </Box>
            </Tooltip>
        </Box>
    );
};

export default CopyToClipBoard;
