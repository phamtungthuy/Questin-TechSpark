import { Box, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import React from "react";

const lawPattern =
    /\b(Báo cáo|Chỉ thị|Công điện|Điều ước quốc tế|Hiên pháp|Hướng dẫn|Kế hoạch|Nghị định|Nghị quyết|Pháp lệnh|Quyết định|Sắc lệnh|Thông báo|Thông tư|Luật Hôn nhân và Gia đình|Bộ luật Lao động|Luật Cơ yếu|Bộ luật Dân sự|Luật Đấu Thầu|Luật Khám bệnh, chữa bệnh|Luật Lưu trữ|Luật Phòng, chống bạo lực gia đình|Bộ luật Hình sự|Luật Hình sự)\s+\d+(?:\/\d+)*(?:\/[a-zA-Z-]+)?\b/gi;

interface AnswerMessageProps {
    answer: string;
    cited_docs: Array<string>;
}

const AnswerMessage: React.FC<AnswerMessageProps> = ({
    answer,
    cited_docs
}) => {
    const renderHighlightedText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|###.*?\n)/g);
        return parts.map((part: string, index: number) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={index}>
                        {part.replace(/\*\*/g, "")}
                    </strong>
                );
            }
            if (part.startsWith("###")) {
                return (
                    <Typography
                        key={index}
                        variant="h6" // Bạn có thể thay đổi kích cỡ tại đây
                        style={{ fontWeight: "bold", marginTop: "0.5em" }}
                    >
                        {part.replace(/###\s*/, "")}
                    </Typography>
                );
            }
            return part;
        });
    };
    

    const highlightText = (text: string) => {
        const foundMatches = text.match(lawPattern);
        const terms = new Set<string>();
        if (foundMatches) {
            for (let i = 0; i < foundMatches?.length; i++) {
                const foundMatch = foundMatches[i];
                const newReg = new RegExp(foundMatch + "\\S*", "i");
                const match = text.match(newReg);
                if (match) {
                    terms.add(match[0]);
                }
            }

            let highlightedText = text;
            terms.forEach((term: string) => {
                const escapedTerm = term.replace(
                    /[-/\\^$*+?.()|[\]{}]/g,
                    "\\$&"
                ); // Escape special characters
                const regex = new RegExp(`(${escapedTerm})`, "gi"); // Tạo regex với cờ 'gi' để không phân biệt chữ hoa chữ thường
                highlightedText = highlightedText.replace(
                    regex,
                    "<strong>$1</strong>"
                );
            });
            return highlightedText;
        }
        return text;
    };

    const replaceWithTooltip = (
        text: string,
        cited_docs: Array<string> | undefined
    ) => {
        const regex = /##(.*?)\$\$/g;
        const parts = [];
        let lastIndex = 0;

        let match;
        while ((match = regex.exec(text)) !== null) {
            const [fullMatch, content] = match;
            // Thêm đoạn text trước đoạn match vào mảng parts
            parts.push(text.substring(lastIndex, match.index));
            // Thêm Tooltip vào mảng parts
            if (cited_docs && cited_docs.length > parseInt(content)) {
                parts.push(
                    <Tooltip
                        key={match.index}
                        title={
                            <Typography
                                fontSize="12px"
                                style={{
                                    whiteSpace: "pre-line",
                                    maxWidth: "50vw",
                                    overflowY:"scroll",
                                    lineHeight: "1.5em",           // Chiều cao dòng
                                    maxHeight: "25em"    
                                }}
                            >
                                {cited_docs[parseInt(content)]}
                            </Typography>
                        }
                    >
                        <HelpOutlineIcon
                            sx={{
                                fontSize: "18px",
                                color: "#ccc",
                                cursor: "help",
                            }}
                        />
                    </Tooltip>
                );
            } else {
                parts.push(
                    <Tooltip
                        key={match.index}
                        title={
                            <Typography
                                fontSize="14px"
                                style={{
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {content}
                            </Typography>
                        }
                    >
                        <HelpOutlineIcon
                            sx={{
                                fontSize: "18px",
                                color: "#ccc",
                                cursor: "help",
                            }}
                        />
                    </Tooltip>
                );
            }
            lastIndex = match.index + fullMatch.length;
        }

        // Thêm đoạn text cuối cùng sau khi đã xử lý hết các match
        parts.push(text.substring(lastIndex));

        return parts;
    };

    const processText = (
        text: string,
        cited_docs: Array<string> | undefined
    ) => {
        // Step 1: Highlight the text based on the pattern
        let highlightedText = highlightText(text);

        // Step 2: Replace ##...$$ with tooltips
        let tooltipText = replaceWithTooltip(highlightedText, cited_docs);

        // Step 3: Render the final text with both highlights and tooltips
        return (
            <>
                {tooltipText.map((part, index) =>
                    typeof part === "string"
                        ? renderHighlightedText(part)
                        : part
                )}
            </>
        );
    };

    return (
        <Typography
            style={{
                whiteSpace: "pre-line",
            }}
        >
            {processText(answer, cited_docs)}
        </Typography>
    );
};

export default AnswerMessage;
