import { Box, List, ListItem, ListItemText } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

interface relevantObject {
    text: string;
    url: string;
}

interface MessageReferenceProps {
    relevant_docs: Array<relevantObject>;
}

interface CustomListItemProps {
    text: string;
    href: string;
}

const CustomListItem: React.FC<CustomListItemProps> = ({ text, href }) => {
    return (
        <ListItem
            component={Link}
            to={href}
            sx={{
                color: "#3770cd",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                "&:hover": {
                    "text-decoration": "underline",
                },
            }}
            title={text}
            target="_blank"
        >
            <ListItemText primary={"-   " + text} />
        </ListItem>
    );
};

const MessageReference: React.FC<MessageReferenceProps> = ({
    relevant_docs,
}) => {
    return (
        <Box>
            <p className="text-[#463a3a]  font-bold">Tham khảo:</p>
            <List>
                {relevant_docs.map((relevant_doc, idx) => (
                    <CustomListItem
                        key={idx}
                        text={relevant_doc["text"]}
                        href={
                            relevant_doc["url"]
                        }
                    />
                ))}
            </List>
        </Box>
    );
};

export default MessageReference;
