import { IReference } from "interfaces/database/conversation";

export interface IFeedbackRequestBody {
    qaId?: string;
    answerId?: string;
    thumb?: string;
    feedback?: string;
}

