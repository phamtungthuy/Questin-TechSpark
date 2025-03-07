import { CSSWithPseudo } from "style";
type StyleKeys = "container" | "content";

const ChatRowStyle: Record<StyleKeys, CSSWithPseudo> = {
    container: {
        borderRadius: "8px",
        padding: "8px",
        "&:hover": {
            backgroundColor: "#ecede9",
        }
    },
    content: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        color: "#000",
        fontWeight: "medium"
    }
}

export default ChatRowStyle