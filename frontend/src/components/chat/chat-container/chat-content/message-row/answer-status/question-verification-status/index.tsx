import { Box, Typography } from "@mui/material";
import { DomainVerification } from "@mui/icons-material";
const QuestionVerificationStatus = () => {
    return (<Box display="flex">
        <DomainVerification />
        <Typography>
            Đang xác thực câu hỏi
        </Typography>
    </Box>)
}

export default QuestionVerificationStatus;