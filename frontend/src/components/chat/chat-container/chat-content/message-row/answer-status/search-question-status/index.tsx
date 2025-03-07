import { Box, Typography } from "@mui/material";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";



const SearchQuestionStatus = () => {
    return (<Box display="flex" gap="10px">
        <QuestionMarkCircleIcon className="w-6 h-6"/>
        <Typography>Đang tìm kiếm câu hỏi liên quan</Typography>
    </Box>)   
}

export default SearchQuestionStatus;