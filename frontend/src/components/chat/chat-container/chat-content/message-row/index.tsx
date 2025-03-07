import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
import AnswerMessage from "./answer-message";
import ClassifyMessage from "./classify-message";
import QuestionMessage from "./question-message";
import MessageAction from "./mesage-action";
import MessageReference from "./message-reference";
import Papa from "papaparse";
import AnswerMessageStatus from "./answer-status";
import QuestionProcessingStatus from "./answer-status/question-processing-status";
interface relevantObject {
    text: string;
    url: string;
}

interface questionProps {
    id: string;
    question: string;
}

interface citedTableProps {
    caption: string;
    content: string;
}

interface MessageRowProps {
    id: number;
    idx: number;
    type: string | null;
    question: string;
    answer: string;
    cited_docs: Array<string>;
    questionList: Array<questionProps>;
    like: boolean;
    dislike: boolean;
    relevant_docs: Array<relevantObject>;
    cited_tables: Array<citedTableProps>;
    cited_images: Array<string>;
    status: string;
}

interface TableProps {
    data: any[]; // Adjust the type based on the parsed CSV data structure
}

const parseCsv = (csvData: string) => {
    return Papa.parse(csvData, {
        header: true, // Set to false if your CSV does not have a header row
        skipEmptyLines: true,
    }).data;
};

const CsvTable: React.FC<TableProps> = ({ data }) => {
    const headers = data.length ? Object.keys(data[0]) : [];

    return (
        <Table>
            <TableHead>
                <TableRow>
                    {headers.map((header, index) => (
                        <TableCell key={index}>{header}</TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {headers.map((header, cellIndex) => (
                            <TableCell key={cellIndex}>{row[header]}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const MessageRow: React.FC<MessageRowProps> = ({
    id,
    idx,
    type,
    status,
    question,
    answer,
    cited_docs,
    cited_tables,
    cited_images,
    questionList,
    like,
    dislike,
    relevant_docs,
}) => {
    const generating = useSelector((state: RootState) => state.chat.generating);
    return (
        <Box className="w-full py-3 text-base md:gap-6 font-sans">
            <Box
                display="flex"
                justifyContent="flex-end"
                className="space-x-5 pr-4 pl-3 py-2 max-w-2xl mx-auto "
            >
                <Box
                    padding="10px 20px"
                    borderRadius="24px"
                    maxWidth="70%"
                    sx={{
                        backgroundColor: "#f4f4f4",
                    }}
                >
                    <Typography
                        style={{
                            whiteSpace: "pre-line",
                        }}
                    >
                        {question}
                    </Typography>
                </Box>
            </Box>
            <Box
                display="flex"
                justifyContent="flex-start"
                className="flex space-x-5 pl-3 pr-4 py-2 max-w-2xl mx-auto "
            >
                <Box className=" flex-shrink-0 flex flex-col relative items-end">
                    <img
                        src="/ise_logo.png"
                        alt="avt_ise"
                        className="h-8 w-8 rounded-full"
                    />
                </Box>
                <Box className="w-full flex-col">
                    <h3 className="font-semibold ">Questin</h3>
                    <Box className="mr-10">
                        {generating && answer === "▌" ? (
                            <div className="loader"></div>
                        ) : (
                            <AnswerMessage
                                answer={answer}
                                cited_docs={cited_docs}
                            />
                        )}
                        {cited_tables.map((table, idx) => (
                            <Box>
                                <Typography>{table.caption}</Typography>
                                <CsvTable data={parseCsv(table.content)} />
                            </Box>
                        ))}
                        {cited_images.slice(0, 10).map((image, idx) => (
                            <Box
                                component="img"
                                src={"data:image/jpeg;base64," + image}
                            ></Box>
                        ))}
                        {type==="routing" && (<AnswerMessageStatus 
                            type="routing"
                        />)}
                        {type==="search" && (<AnswerMessageStatus 
                            type="search"
                        />)}
                        {type==="process" && (<AnswerMessageStatus 
                            type="process"
                        />)}
                        {type === "classify" && (
                            <ClassifyMessage 
                            status={status}
                            question={question} />
                        )}
                        {type === "question" && (
                            <QuestionMessage
                                question={question}
                                questionList={questionList}
                            />
                        )}
                        
                        {(<MessageAction
                            id={id}
                            idx={idx}
                            answer={answer}
                            like={like}
                            dislike={dislike}
                        />)}
                        
                        {relevant_docs.length > 0 && (
                            <MessageReference relevant_docs={relevant_docs} />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default MessageRow;
