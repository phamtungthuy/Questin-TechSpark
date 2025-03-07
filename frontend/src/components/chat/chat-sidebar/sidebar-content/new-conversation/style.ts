import { CSSWithPseudo } from "style";

type StyleKeys = "container";

const NewChatStyle: Record<StyleKeys, CSSWithPseudo> = {
    container: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px",
        borderRadius: "8px",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#ecede9"
        },
    }
}

export default NewChatStyle;