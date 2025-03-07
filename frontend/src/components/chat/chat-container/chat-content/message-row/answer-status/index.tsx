import { Box, Typography } from "@mui/material";
import React from "react";
import QuestionVerificationStatus from "./question-verification-status";
import QuestionRoutingStatus from "./question-routing-status";
import SearchQuestionStatus from "./search-question-status";
import QuestionProcessingStatus from "./question-processing-status";

interface AnswerMessageStatusProps {
    type: string;
}

const AnswerMessageStatus: React.FC<AnswerMessageStatusProps> = ({type}) => {
    return (<Box>
        {type==="classify" && <QuestionVerificationStatus />}
        {type==="routing" && <QuestionRoutingStatus />}
        {type==="search" && <SearchQuestionStatus />}
        {type==="process" && <QuestionProcessingStatus />}
    </Box>)
}

export default AnswerMessageStatus;