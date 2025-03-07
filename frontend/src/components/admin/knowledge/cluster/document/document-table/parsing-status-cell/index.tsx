import {
    Badge,
    Box,
    Chip,
    IconButton,
    Popover,
    Typography,
} from "@mui/material";
import { ReactComponent as CancelIcon } from "assets/svg/cancel.svg";
import { ReactComponent as RefreshIcon } from "assets/svg/refresh.svg";
import { ReactComponent as RunIcon } from "assets/svg/run.svg";
import { IDocumentInfo } from "interfaces/database/document";
import { RunningStatus } from "constants/knowledge";
import { useState } from "react";
import { RunningStatusMap } from "constants/document";
import { useTranslation } from "react-i18next";
import { useHandleRunDocument } from "hooks/document-hook";
import { isParserRunning } from "utils/document-util";

const iconMap = {
    [RunningStatus.UNSTART]: RunIcon,
    [RunningStatus.RUNNING]: CancelIcon,
    [RunningStatus.CANCEL]: RefreshIcon,
    [RunningStatus.DONE]: RefreshIcon,
    [RunningStatus.FAIL]: RefreshIcon,
};

interface IProps {
    record: IDocumentInfo;
}

const PopoverContent = ({ record }: IProps) => {
    const replaceText = (text: string) => {
        // Remove duplicate \n
        const nextText = text.replace(/(\n)\1+/g, "$1");

        return nextText.split("\n").map((line, i) => {
            if (line.startsWith("[ERROR]")) {
                return (
                    <Typography key={i} color="error" variant="body2">
                        {line}
                    </Typography>
                );
            }
            return (
                <Typography key={i} variant="body2">
                    {line}
                </Typography>
            );
        });
    };

    const items = [
        {
            key: "process_begin_at",
            label: "process begn at",
            value: record.process_begin_at,
        },
        {
            key: "process_duration",
            label: "process duration",
            value: `${record.process_duration.toFixed(2)} s`,
        },
        {
            key: "progress_msg",
            label: "process msg",
            value: replaceText(record.progress_msg.trim()),
        },
    ];

    return (
        <Box sx={{ p: 2, maxWidth: 300 }}>
            {items.map((item, idx) => (
                <Box key={item.key} mb={idx < items.length - 1 ? 2 : 0}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {item.label}:
                    </Typography>
                    <Box>{item.value}</Box>
                </Box>
            ))}
        </Box>
    );
};

const ParsingStatusCell = ({ record }: IProps) => {
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const text = record.run;
    const runningStatus = RunningStatusMap[text];
    const OperationIcon = iconMap[text];
    const open = Boolean(anchorEl);
    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const { handleRunDocument, loading } = useHandleRunDocument(record.id);

    const isRunning = isParserRunning(text);
    const handlePopoverClose = () => {
        setAnchorEl(null);
    };
    const label = t(`knowledgeDetails.runningStatus${text}`);

    const handleOperationIconClick = () => {
        handleRunDocument(record.id, isRunning);
    };

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
        >
            {/* Status Tag */}
            <Box>
                <Box
                    aria-owns={open ? "mouse-over-popover" : undefined}
                    aria-haspopup="true"
                    onMouseEnter={handlePopoverOpen}
                    onMouseLeave={handlePopoverClose}
                >
                    <Chip
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                {isRunning && (
                                    <>
                                        <Badge
                                            variant="dot"
                                            color={
                                                runningStatus.color.toLowerCase() as any
                                            }
                                        />
                                        <span>{label}</span>
                                        <span>
                                            {(record.progress * 100).toFixed(2)}
                                            %
                                        </span>
                                    </>
                                )}
                                {!isRunning && label}
                            </Box>
                        }
                        color={runningStatus.color.toLowerCase() as any}
                        variant="outlined"
                    />
                </Box>
                <Popover
                    id="mouse-over-popover"
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handlePopoverClose}
                    onMouseLeave={handlePopoverClose}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                    }}
                    style={{ pointerEvents: "none" }}
                >
                    <PopoverContent record={record} />
                </Popover>
            </Box>

            {/* Operation Icon */}
            <IconButton
                onClick={handleOperationIconClick}
                sx={{
                    animation: loading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                    },
                }}
            >
                <OperationIcon />
            </IconButton>
        </Box>
    );
};

export default ParsingStatusCell;
