import { Box } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import NewChatStyle from "./style";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useGetChatParams } from "hooks/conversation-hook";

const NewChat = () => {
    const navigate = useNavigate();
    const { dialogId } = useGetChatParams();
    return (
        <Box
            sx={{
                ...NewChatStyle.container,
            }}
            onClick={() => {
                navigate(`/${dialogId}/`);
            }}
        >
            <Box className="flex items-center gap-2">
                <Box
                    component="img"
                    className="w-6 rounded-full"
                    src="/ise_logo.png"
                    alt="ise"
                />
                <Box>Questin</Box>
            </Box>
            <Box className="w-4">
                <PencilSquareIcon />
            </Box>
        </Box>
    );
};

export default NewChat;
