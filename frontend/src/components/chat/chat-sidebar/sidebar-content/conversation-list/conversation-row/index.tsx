import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import DotLoader from "components/dot-loader";
import ChatRowOption from "./conversation-row-option";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import { IConversation } from "interfaces/database/conversation";
import { useGetChatParams } from "hooks/conversation-hook";

interface IProps extends IConversation {
  selected_activate: boolean;
}

const ConversationRow = ({
  id,
  name,
  selected_activate,
  ...params
}: IProps) => {
  const { dialogId } = useGetChatParams();
  const theme = useTheme();

  return (
    <Link to={`/${dialogId}/chat/${id}/`}>
      <Box
        margin="4px 0px"
        borderRadius="8px"
        padding="8px"
        sx={{
          backgroundColor: selected_activate
            ? theme.palette.action.selected
            : "",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box
          display="flex"
          flex={1}
          alignItems="center"
          justifyContent="space-between"
          className="truncate"
          gap="10px"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: "medium",
          }}
        >
          {name === "" ? (
            <DotLoader />
          ) : (
            <Tooltip title={name}>
              <Typography noWrap fontSize="14px">
                {name}
              </Typography>
            </Tooltip>
          )}
          <Box display="flex" alignItems="center">
            {selected_activate && (
              <ChatRowOption id={id} name={name} {...params} />
            )}
          </Box>
          {!selected_activate && (
            <Box width="24px">
              <EllipsisHorizontalIcon
                className="h-5 w-5 opacity-0"
                onMouseOver={(e) => (e.currentTarget.style.color = "#000")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#a6a6a6")}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Link>
  );
};

export default ConversationRow;
