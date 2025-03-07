import {
    Box,
    createStyles,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import knowledgebaseDocumentApi from "api/admin/knowledgebase/knowledgebase-document-api";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlayCircleFilledWhiteOutlinedIcon from "@mui/icons-material/PlayCircleFilledWhiteOutlined";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { toast } from "react-toastify";
interface CustomTableRowProps {
    idx: number;
    type: string;
    status: string;
    progress: string;
}


const styles = createStyles({
    UNSTART: {
        color: "#08979c",
        backgroundColor: "#e6fffb",
        borderColor: "#87e8de",
    },
    FINISHED: {
        color: "#389e0d",
        backgroundColor: "#f6ffed",
        borderColor: "#b7eb8f",
    },
    FAILED: {
        color: "#cf1322",
        backgroundColor: "#fff1f0",
        borderColor: "#ffa39e",
    },
    CONTINUE: {
        color: "#1d39c4",
        backgroundColor: "#f0f5ff",
        borderColor: "#adc6ff",
    },
});


const action_status: any = {
    UNSTART: {
        icon: <PlayCircleFilledWhiteOutlinedIcon color="success" />,
        onClick: (func: any) => {
            func()
        },
    },
    FINISHED: {
        icon: <AutorenewIcon color="success" />,
        onClick: (func: any) => {
            func()
        },
    },
    FAILED: {
        icon: <AutorenewIcon color="success" />,
        onClick: () => {},
    },
    CONTINUE: {
        icon: <CancelOutlinedIcon color="error" />,
        onClick: () => {},
    },
};

const CustomTableRow: React.FC<CustomTableRowProps> = ({
    idx,
    type,
    status,
    progress,
}) => {
    const [searchParams] = useSearchParams();
    const doc_id = searchParams.get("doc_id");
    const kb_id = searchParams.get("id");

    const generateQuestion = async () => {
        if (doc_id && kb_id) {
            const response = await knowledgebaseDocumentApi.generateQuestion(kb_id, doc_id);
            if (response.status === 200) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        }
    }

    const generateImageDescription = async () => {
        if (doc_id && kb_id) {
            const response = await knowledgebaseDocumentApi.generateImageDescription(kb_id, doc_id);
            if (response.status === 200) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        }
    }

    return (
        <TableRow key={idx}>
            <TableCell>{type}</TableCell>
            <TableCell>{progress}</TableCell>
            <TableRow>
            <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Box
                        border="1px solid"
                        borderRadius="4px"
                        padding="4px 8px"
                        sx={styles[status]}
                    >
                        <Box component="span" padding="0px">
                            {status}
                        </Box>
                    </Box>
                    <IconButton
                        onClick={() => {
                            if (doc_id && kb_id) {
                                if (type === "QUESTION") {  
                                    action_status[status]["onClick"](generateQuestion)
                                } else {
                                    action_status[status]["onClick"](generateImageDescription)
                                }
                            }
                        }}
                    >
                        {action_status[status]["icon"]}
                    </IconButton>
                </Box>
            </TableRow>
        </TableRow>
    );
};

interface StatusProps {
    id: number;
    type: string;
    progress: string;
    status: string;
}

const StatusMonitor = () => {
    const [status, setStatus] = useState<Array<StatusProps>>([]);
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");
    const doc_id = searchParams.get("doc_id");

    const getDocumentStatus = async () => {
        if (kb_id && doc_id) {
            const response = await knowledgebaseDocumentApi.getDocumentStatus(
                kb_id,
                doc_id
            );
            if (response.status === 200) {
                setStatus(response.data.data);
            }
        }
    };

    useEffect(() => {
        getDocumentStatus();
        const intervalId = setInterval(() => {
            getDocumentStatus();
        }, 5000)
        return () => {
            clearInterval(intervalId);
        }
    }, []);

    return (
        <Box display="flex" flexDirection="column" alignItems="center">
            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {status.map((item, idx) => (
                            <CustomTableRow
                                idx={idx}
                                type={item.type}
                                status={item.status}
                                progress={item.progress}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default StatusMonitor;
