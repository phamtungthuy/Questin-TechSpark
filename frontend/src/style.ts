import { CSSProperties } from "react";

interface CSSWithPseudo extends CSSProperties {
    "&:hover"?: CSSProperties;
}

const GeneralStyle: Record<string, CSSWithPseudo> = {
    
}

export {
    GeneralStyle
}

export type {
    CSSWithPseudo
}