import { IChunk } from "./knowledge";

export interface IConversation {
  create_date: string;
  create_time: number;
  dialog_id: string;
  id: string;
  name: string;
  update_date: string;
  update_time: number;
  is_new: true;
  type: string;
}

export interface IAnswer {
  id: string;
  dialog_id: string;
  conversation_id: string;
  message_id: string;
  qa_id: string;
  content: string;
  think: string;
  reference: IReference;
  thumb: string;
  feedback: string;
  status?: string;
  citation?: boolean;
}

export interface IMessage {
  id: string;
  message_id: string;
  create_time: number;
  create_date: string;
  update_time: number;
  update_date: string;
  qas: IMessageQA[];
  role: "user" | "assistant" | "admin";
}

export interface IMessageQA {
  id: string;
  message_id: string;
  create_time: number;
  create_date: string;
  update_time: number;
  update_date: string;
  question: string;
  answer: IMessageAnswer[];
  role?: "user" | "assistant" | "admin";
}

export interface IMessageAnswer {
  id: string;
  message_id: string;
  qa_id: string;
  content: string;
  think: string;
  reference: IReference;
  thumb: string;
  feedback: string;
  status: string;
  citation: boolean;
}

export interface IReference {
  chunks: IChunk[];
  doc_aggs: Docagg[];
  total: number;
}

export interface Docagg {
  count: number;
  doc_id: string;
  doc_name: string;
  title?: string;
}
