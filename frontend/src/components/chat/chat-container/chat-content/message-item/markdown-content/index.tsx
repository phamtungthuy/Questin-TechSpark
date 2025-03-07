import { IReference } from "interfaces/database/conversation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import { visitParents } from "unist-util-visit-parents";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter";
import reactStringReplace from "react-string-replace";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    accordionSummaryClasses,
    Box,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import GradientText from "components/gradient-text";
import { DataGrid } from "components/ui/data-grid";
import { GridColDef } from "@mui/x-data-grid";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import ReferenceCard from "./reference-card";
import ReferenceButton from "./reference-button";
import ReferenceSource from "./reference-source";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import OverlappingImageCards from "./overlap-image-cards";


const reg = /(#{2}\d+\${2})/g;
const curReg = /(~{2}\d+\${2})/g;
const getChunkIndex = (match: string) => Number(match.slice(2, -2));

const MarkdownContent = ({
    reference,
    loading,
    content,
    status,
    think,
    citation = false,
    done
}: {
    content: string;
    loading: boolean;
    reference: IReference;
    status: string;
    think: string;
    citation?: boolean;
    done?: boolean;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const contentWithCursor = useMemo(() => {
        let text = content;
        if (text === "") {
            text = t("chat.searching");
        }
        return loading ? text?.concat("~~2$$") : text;
    }, [content, loading, t]);

    const images: string[] = [];
    const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    const imageNums = useMemo(() => {
        const matches = contentWithCursor.match(imageRegex);
        return matches ? matches.length : 0;
    }, [contentWithCursor]);
    const rehypeWrapReference = () => {
        return function wrapTextTransform(tree: any) {
            visitParents(tree, "text", (node, ancestors) => {
                const latestAncestor = ancestors.at(-1);
                if (
                    latestAncestor.tagName !== "custom-typography" &&
                    latestAncestor.tagName !== "code"
                ) {
                    node.type = "element";
                    node.tagName = "custom-typography";
                    node.properties = {};
                    node.children = [{ type: "text", value: node.value }];
                }
            });
        };
    };

    const getPopoverContent = useCallback(
        (chunkIndex: number) => {
            const chunks = reference?.chunks ?? [];
            const chunkItem = chunks[chunkIndex];
            const imageId = chunkItem?.img_id;
            return (
                <ReferenceCard
                    url={chunkItem?.docnm_kwd || ""}
                    title={chunkItem?.title_kwd || chunkItem?.docnm_kwd}
                    description={chunkItem?.content_with_weight}
                />
            );
        },
        [reference]
    );



    const [message, setMessage] = useState<string>("Đang xử lý ...");
    // const messages = ["Đang xử lý ..."];

    // useEffect(() => {
    //     if (contentWithCursor === t('chat.searching')) {
    //         let i = 0;
    //         if (i < 2) {
    //             const interval = setInterval(() => {
    //                 i = (i + 1) % messages.length;
    //                 setMessage(messages[i]);
    //                 if (i === 2)  {
    //                     clearInterval(interval);
    //                 }
    //             }, 2000);
    //         }
    //     }
    // }, [contentWithCursor]);


    const renderReference = useCallback(
        (text: string) => {
            let replacedText = reactStringReplace(text, reg, (match, i) => {
                const chunkIndex = getChunkIndex(match);
                const chunks = reference?.chunks ?? [];
                const chunkItem = chunks[chunkIndex];
                return (
                    <Tooltip
                        title={getPopoverContent(chunkIndex)}
                        arrow
                        PopperProps={{
                            sx: {
                                "& .MuiTooltip-tooltip": {
                                    maxWidth: {
                                        xs: "300px",
                                        sm: "400px",
                                        md: "500px",
                                    },
                                },
                            },
                        }}
                    >
                        <Box display="inline-block">
                            <ReferenceButton
                                title={chunkItem?.docnm_kwd}
                                href={chunkItem?.docnm_kwd}
                            />
                        </Box>
                    </Tooltip>
                );
            });

            replacedText = reactStringReplace(
                replacedText,
                curReg,
                (match, i) => <span key={i}></span>
            );

            return replacedText;
        },
        [getPopoverContent]
    );

    function convertTableNodeToDataGrid(children: any): {
        rows: any[];
        columns: GridColDef[];
    } {
        // Nếu children không phải chuỗi, chuyển về chuỗi (điều này có thể cần điều chỉnh tùy theo cách render của bạn)
        const content =
            typeof children === "string"
                ? children
                : children?.toString() || "";
        // Nếu nội dung chứa thẻ <table>, ta sẽ parse theo HTML
        if (content.includes("<table")) {
            // Dùng DOMParser để chuyển đổi HTML string thành DOM (chỉ chạy trong trình duyệt)
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            const table = doc.querySelector("table");
            if (!table) return { rows: [], columns: [] };

            // Lấy header từ thead
            const headerCells = table.querySelectorAll("thead tr th");
            const columns: GridColDef[] = [];
            headerCells.forEach((cell, index) => {
                const headerText =
                    cell.textContent?.trim() || `Column ${index + 1}`;
                columns.push({
                    field: headerText.replace(/\s/g, "_") + "_" + index, // đảm bảo field là duy nhất và không có khoảng trắng
                    headerName: headerText,
                    flex: 1,
                });
            });

            // Lấy dữ liệu từ tbody
            const rows: any[] = [];
            const bodyRows = table.querySelectorAll("tbody tr");
            bodyRows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll("td");
                const rowData: any = { id: rowIndex }; // DataGrid cần field "id"
                cells.forEach((cell, cellIndex) => {
                    // Nếu số cell vượt quá số cột thì bỏ qua
                    if (columns[cellIndex]) {
                        rowData[columns[cellIndex].field] =
                            cell.textContent?.trim();
                    }
                });
                rows.push(rowData);
            });

            return { rows, columns };
        } else {
            // Xử lý trường hợp Markdown
            // Tách các dòng và loại bỏ các dòng trống
            const lines = content
                .split("\n")
                .map((line: string) => line.trim())
                .filter((line: string) => line);

            if (lines.length < 2) {
                // Không đủ dòng để có header và dữ liệu
                return { rows: [], columns: [] };
            }

            // Giả sử dòng đầu tiên là header, dòng thứ hai là dòng phân cách (---)
            const headerLine = lines[0];
            // Tách theo ký tự "|" và loại bỏ các phần tử rỗng (do có thể có | ở đầu/cuối)
            const headerCells = headerLine
                .split("|")
                .map((cell: string) => cell.trim())
                .filter((cell: string) => cell !== "");

            const columns: GridColDef[] = headerCells.map(
                (header: string, index: number) => ({
                    field: header.replace(/\s/g, "_") + "_" + index,
                    headerName: header,
                    flex: 1,
                })
            );

            // Xác định vị trí dòng bắt đầu dữ liệu:
            // Nếu dòng thứ 2 là dòng phân cách (chỉ chứa dấu - hoặc : và |) thì bỏ qua
            let dataStart = 1;
            const separatorRegex = /^(\|?\s*:?-+:?\s*\|)+\s*$/;
            if (lines[1].match(separatorRegex)) {
                dataStart = 2;
            }

            const rows: any[] = [];
            for (let i = dataStart; i < lines.length; i++) {
                const rowLine = lines[i];
                const rowCells = rowLine
                    .split("|")
                    .map((cell: string) => cell.trim())
                    .filter((cell: string) => cell !== "");
                const rowData: any = { id: i - dataStart };
                headerCells.forEach((header: string, index: number) => {
                    rowData[columns[index].field] = rowCells[index] || "";
                });
                rows.push(rowData);
            }

            return { rows, columns };
        }
    }


    const extractTableData = (
        children: Record<string, any>
    ): { columns: GridColDef[]; rows: any[] } => {
        const columns: GridColDef[] = [];
        const rows: any[] = [];
        let currentRow: any = {};
        let isHeader = false;
        children = Object.values(children);
        let currentColumnIndex = 0;
        const traverse = (node: any) => {
            if (!node) return;
            if (Array.isArray(node)) {
                node.forEach((child) => traverse(child));
                return;
            }
            // console.log(node)
            if (node.type === "element") {
                switch (node.tagName) {
                    case "thead":
                        isHeader = true;

                        traverse(node.children);
                        isHeader = false;
                        break;

                    case "tbody":
                        traverse(node.children);
                        break;

                    case "tr":
                        currentRow = {};
                        traverse(node.children);
                        if (!isHeader) {
                            rows.push({ ...currentRow, id: rows.length });
                        }
                        break;

                    case "th":
                        const headerContent = extractTextContent(node.children);
                        columns.push({
                            field: `col_${columns.length}`,
                            headerName: headerContent,
                            flex: 1,
                        });
                        break;

                    case "td":
                        const cellContent = extractTextContent(node.children);
                        const currentColumn =
                            columns[currentColumnIndex % columns.length];
                        currentColumnIndex++;
                        if (currentColumn) {
                            currentRow[currentColumn.field] = cellContent;
                        }
                        break;

                    case "custom-typography":
                        traverse(node.children);
                        break;

                    default:
                        traverse(node.children);
                        break;
                }
            }
        };

        const extractTextContent = (children: React.ReactNode): string => {
            let text = "";
            Array.isArray(children) &&
                children.forEach((element) => {
                    if (element.value) {
                        text += element.value;
                    } else {
                        text += extractTextContent(element.children);
                    }
                });

            return text.trim();
        };

        traverse(children);
        return { columns, rows };
    };

    const memoizedExtractTableData = useCallback(
        (children: Record<string, any>) => extractTableData(children),
        []
    );

    const memoizedConvertTableNode = useCallback(
        (children: any) => convertTableNodeToDataGrid(children),
        []
    );

    const MemoizedDataGrid = useMemo(
        () =>
            ({ rows, columns }: { rows: any[]; columns: GridColDef[] }) => {
                

                return (<Box sx={{
                    maxWidth: {
                        xs: "280px",
                        md: "100%"
                    }
                }}>
                    <DataGrid rowHeight={done ? "auto" : undefined} disableColumnResize={false} rows={rows} columns={columns} showCheckbox={false} />
                </Box>)
            },
        [done]
    );

    const tableRenderer = useCallback(
        (props: any) => {

            const { node } = props;
            const { rows, columns } = memoizedExtractTableData(node.children);
            return <MemoizedDataGrid rows={rows} columns={columns} />;
        },
        [contentWithCursor]
    );


    const codeRenderer = useCallback(
        (props: any) => {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            // if (typeof children === "string") {
            //     if (children.includes("<thead>") || children.startsWith("|")) {
            //         const { rows, columns } = memoizedConvertTableNode(children);
            //         return <MemoizedDataGrid rows={rows} columns={columns} />;
            //     }
            // }

            return match ? (
                <SyntaxHighlighter
                    {...rest}
                    PreTag="div"
                    language={match[1]}
                    style={atomOneDark}
                    customStyle={{
                        padding: "25px",
                    }}
                >
                    {String(children).replace(
                        /\n$/,
                        ""
                    )}
                </SyntaxHighlighter>
            ) : (
                <code
                    {...rest}
                    className={className}
                >
                    {children}
                </code>
            );
        },
        [contentWithCursor]
    );


    return (
        <Box width="100%">
            {think && (
                <Box marginBottom="8px">
                    <Accordion
                        // defaultExpanded // Mở mặc định
                        sx={{
                            border: "none",
                            padding: 0,
                            borderRadius: 2,
                            "&:before": {
                                display: "none", // Ẩn gạch ngang mặc định
                            },
                        }}
                    >
                        <AccordionSummary
                            sx={{
                                minHeight: 24,
                                opacity: 0.7,
                                "&.Mui-expanded": {
                                    minHeight: 24,
                                },
                                "&:hover": {
                                    opacity: 1,
                                    backgroundColor: "inherit",
                                },
                                padding: 0,
                                flexDirection: "row-reverse",
                                [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
                                {
                                    transform: "rotate(90deg)",
                                },
                                [`& .${accordionSummaryClasses.content}`]: {
                                    marginLeft: theme.spacing(1),
                                    marginRight: theme.spacing(1),
                                },
                            }}
                            expandIcon={
                                <ArrowForwardIosSharpIcon
                                    sx={{ fontSize: "0.9rem" }}
                                />
                            }
                        >
                            <Typography
                                variant="body2"
                                component="div"
                                sx={{ fontWeight: "bold" }}
                                display="inline-block"
                            >
                                {contentWithCursor === t("chat.searching") ? (
                                    <GradientText text={"Suy nghĩ"} />
                                ) : (
                                    "Suy nghĩ"
                                )}
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails
                            sx={{
                                padding: "0",
                                backgroundColor: theme.palette.background.paper,
                            }}
                        >
                            <Box
                                sx={{
                                    borderLeft: "2px solid rgb(227, 227, 227)",
                                    paddingLeft: "16px",
                                    paddingRight: "4px",
                                    paddingY: "8px",
                                }}
                            >
                                <Markdown
                                    rehypePlugins={[rehypeWrapReference]}
                                    remarkPlugins={[remarkGfm]}
                                    components={
                                        {
                                            // a: (props) => <Link target="_blank" rel="noopener" {...props} />
                                        }
                                    }
                                >
                                    {think}
                                </Markdown>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}

            {contentWithCursor === t("chat.searching") ? (
                <GradientText text={status !== "" ? status : message} />
            ) : (
                <Box
                    sx={{
                        position: "relative",
                    }}
                >
                    <Box sx={{ opacity: citation ? 0.3 : 1 }}>
                        <Markdown
                            rehypePlugins={[rehypeWrapReference]}
                            remarkPlugins={[remarkGfm]}
                            remarkRehypeOptions={{ passThrough: ["link"] }}
                            components={
                                {
                                    // table: tableRenderer,
                                    code: codeRenderer,
                                    "custom-typography": ({
                                        children,
                                    }: {
                                        children: string;
                                    }) => renderReference(children),
                                    a: ({
                                        href,
                                        children,
                                    }: {
                                        href: string;
                                        children: React.ReactNode;
                                    }) => {
                                        return (
                                            <a
                                                href={href}
                                                style={{
                                                    color: "#1976d2",
                                                    textDecoration: "none",
                                                }}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {children}
                                            </a>
                                        );
                                    },
                                    p: ({ children }: { children: any }) => {
                                        return (
                                            <p
                                                style={{
                                                    textAlign: "justify",
                                                    textJustify: "inter-word",
                                                }}
                                            >
                                                {children}
                                            </p>
                                        );
                                    },
                                    img: (props: any) => {
                                        const { src, alt } = props;
                                        images.push(src);

                                        if (images.length === imageNums) {
                                            return (<Box marginY="8px">
                                                <OverlappingImageCards images={images}/>
                                            </Box>)
                                        }
                                    }
                                } as any
                            }
                        >
                            {contentWithCursor + ""}
                        </Markdown>
                    </Box>
                    {citation && (
                        <Box
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1,
                                pointerEvents: "none",
                                textAlign: "center",
                                width: "100%",
                            }}
                        >
                            <GradientText
                                text={"Đang thêm nguồn thông tin ..."}
                                sx={{
                                    fontWeight: "bold",
                                    background:
                                        "linear-gradient(90deg, #1e3c72, #2a5298)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    variant: "h4",
                                    fontSize: "20px",
                                }}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {<ReferenceSource reference={reference} />}
        </Box>
    );
};

export default MarkdownContent;
