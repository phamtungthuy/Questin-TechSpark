import { ResponseType } from "interfaces/database/base";
import { useCallback, useEffect, useRef, useState } from "react";
import api, { api_url } from "utils/api";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { Authorization } from "constants/authorization";
import authorizationUtil from "utils/authorization-util";
import { useGetChatParams } from "./conversation-hook";
import { AppDispatch } from "store/store";
import { useDispatch } from "react-redux";
import { MessageType } from "constants/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-hook";
import {
  IAnswer,
  IMessage,
  IMessageAnswer,
} from "interfaces/database/conversation";
import {
  addMessageAnswer,
  addMessageItem,
  setMessageAnswer,
} from "store/message-slice";
import { MessageStatus } from "constants/message";

export const useSendMessageWithSse = (url: string = api.completion) => {
  const [answer, setAnswer] = useState<IAnswer>({} as IAnswer);
  const [done, setDone] = useState<boolean>(true);
  const timer = useRef<any>();
  const dispatch = useDispatch<AppDispatch>();
  const resetAnswer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setAnswer({} as IAnswer);
      clearTimeout(timer.current);
    }, 1000);
  }, []);

  const send = useCallback(
    async (
      body: any,
      controller?: AbortController
    ): Promise<{ response: Response; data: ResponseType } | undefined> => {
      try {
        setDone(false);

        // Use FormData to send files
        const formData = new FormData();

        // Append text fields
        formData.append("query", body.query);
        formData.append("conversation_id", body.conversation_id);
        formData.append("history", JSON.stringify(body.history));
        // Append all files under the same key
        if (body.files) {
          (body.files as File[]).forEach((file) => {
            formData.append("files", file);
          });
        }
        if (body.type) formData.append("type", body.type);
        if (body.message_id) formData.append("message_id", body.message_id);
        if (body.qa_id) formData.append("qa_id", body.qa_id);

        const response = await fetch(`${api_url}${url}`, {
          method: "POST",
          headers: {
            [Authorization]: `Bearer ${authorizationUtil.getToken()}`,
            // "Content-Type": "application/json",
          },
          // body: JSON.stringify(body),
          body: formData,
        });

        const res = response.clone().json();

        const reader = response?.body
          ?.pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventSourceParserStream())
          .getReader();

        while (true) {
          const x = await reader?.read();
          if (x) {
            const { done, value } = x;
            if (done) {
              console.info("done");
              resetAnswer();
              break;
            }
            try {
              const val = JSON.parse(value?.data || "");
              const d = val?.data;
              if (typeof d !== "boolean") {
                setAnswer({
                  ...d,
                  conversationId: body?.conversation_id,
                  dialogId: body?.dialog_id,
                });
              }
            } catch (e) {
              console.warn(e);
            }
          }
        }
        setDone(true);
        resetAnswer();
        return { data: await res, response };
      } catch (e) {
        setDone(true);
        resetAnswer();
        if (String(e).includes("Failed to fetch")) {
          const id = (await body["id"]) || "";
          const messages = (await body["messages"]) || [];
          const message = messages[messages.length - 1];

          if (message) {
            //     await dispatch(
            //         updateMessage({
            //             conversation_id: id,
            //             message: {
            //                 ...message,
            //                 content: "Network now is busy. Sorry about that. Other errors: " + String(e)
            //             }
            //     })
            // );
          }
        }

        console.warn(e);
      }
    },
    [url, resetAnswer]
  );

  return { send, answer, done, setDone };
};

export interface sendMessageParams {
  query: string;
  files?: File[];
  history: IMessage[];
  conversation_id: string;
  type?: string;
  message_id?: string;
  qa_id?: string;
}

export const useSendNextMessage = () => {
  const { send, answer, done } = useSendMessageWithSse(api.completion);
  const { conversationId, dialogId } = useGetChatParams();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { isLogin } = useAuth();
  const [currentMessages, setCurrentMessages] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const sendMessage = useCallback(
    async ({
      query,
      files,
      conversation_id,
      history,
      type = "chat",
      message_id = "",
      qa_id = "",
    }: sendMessageParams) => {
      const formatted_history: any = [];
      history.forEach((history, idx) => {
        if (formatted_history.length > 20) {
          return;
        }
        const qas = history.qas;
        if (qas.length === 0) {
          return;
        }

        const msgAnswers = qas[qas.length - 1].answer;
        if (msgAnswers.length > 0) {
          formatted_history.unshift({
            role: "assistant",
            content: msgAnswers[msgAnswers.length - 1]["content"],
          });
          formatted_history.unshift({
            role: "user",
            content: qas[qas.length - 1].question,
          });
        }
      });

      if (type === "chat") {
        await dispatch(
          addMessageItem({
            conversation_id: conversation_id,
            messages: [
              {
                id: MessageStatus.Temporary,
                qas: [
                  {
                    id: MessageStatus.Temporary,
                    question: query,
                    answer: [
                      {
                        id: MessageStatus.Temporary,
                        content: "",
                      },
                    ],
                  },
                ],
              } as IMessage,
            ],
          })
        );
      }
      if (type === "try_again" && qa_id && message_id) {
        await dispatch(
          addMessageAnswer({
            conversation_id: conversation_id,
            qa_id: qa_id,
            message_id: message_id,
            answer: [
              {
                id: MessageStatus.Temporary,
                content: "",
              } as IMessageAnswer,
            ],
          })
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["fetchQuestionList"],
      });
      queryClient.invalidateQueries({ queryKey: ["fetchMessageList"] });
      await Promise.all([
        send({
          conversation_id: conversation_id,
          query: query,
          files: files,
          history: formatted_history,
          type: type,
          message_id: message_id,
          qa_id: qa_id,
        }),
      ]);
    },
    [conversationId, send]
  );

  const removeCurrentChatting = async () => {
    if (currentConversationId) {
      // await dispatch(
      //     removeMessage({
      //         conversation_id: currentConversationId,
      //         msg_ids: currentMessages,
      //     })
      // );
    }
  };

  const update = async () => {
    if (answer.content || answer.status || answer.think) {
      await dispatch(
        setMessageAnswer({
          conversation_id: answer.conversation_id ?? conversationId,
          message_id: answer.message_id,
          qa_id: answer.qa_id,
          answer: [
            {
              id: answer.id,
              message_id: answer.message_id,
              qa_id: answer.qa_id,
              content: answer.content,
              think: answer.think,
              reference: answer.reference,
              thumb: answer.thumb,
              feedback: answer.feedback,
              status: answer.status || "",
              citation: answer.citation || false,
            },
          ],
        })
      );
    }
    queryClient.invalidateQueries({ queryKey: ["fetchMessageList"] });
  };

  useEffect(() => {
    update();
  }, [answer]);

  return { answer, sendMessage, done, removeCurrentChatting };
};
