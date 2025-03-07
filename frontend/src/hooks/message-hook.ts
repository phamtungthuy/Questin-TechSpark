import { useMutation, useQuery } from "@tanstack/react-query";
import { useGetChatParams } from "./conversation-hook";
import messageService from "services/message-service";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "store/store";
import { useSelector } from "react-redux";
import { useSetModalState } from "./common-hook";
import { IFeedbackRequestBody } from "interfaces/request/message";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { useAuth } from "./auth-hook";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { addMessageItem } from "store/message-slice";
import { IMessage } from "interfaces/database/conversation";

export const useFetchSharedMessageList = () => {
  const { conversationId } = useGetChatParams();
  const dispatch = useDispatch<AppDispatch>();
  const messageRecord = useSelector(
    (state: RootState) => state.message.messageListRecord
  );
  const navigate = useNavigate();
  const {
    data,
    isFetching: loading,
    refetch,
  } = useQuery<IMessage[]>({
    queryKey: ["fetchSharedMessageList", conversationId],
    initialData: [],
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!conversationId,
    queryFn: async () => {
      if (messageRecord[conversationId]) {
        return messageRecord[conversationId];
      }
      const { data } = await messageService.listShareMessage({
        conversationId,
      });
      if (data.retcode === 0) {
        dispatch(
          addMessageItem({
            conversation_id: conversationId,
            messages: data.data,
          })
        );
        return data.data;
      } else {
        toast.error(data.retmsg);
        navigate("/");
      }
      return data?.data || [];
    },
  });

  return { data, loading, refetch };
};

export const useFetchNextMessageList = () => {
  const { conversationId } = useGetChatParams();
  const { isLogin } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const messageRecord = useSelector(
    (state: RootState) => state.message.messageListRecord
  );

  const {
    data,
    isFetching: loading,
    refetch,
  } = useQuery<IMessage[]>({
    queryKey: ["fetchMessageList", conversationId, isLogin],
    initialData: [],
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: isLogin !== null && ((isLogin && !!conversationId) || !isLogin),
    queryFn: async () => {
      if (!isLogin) {
        return messageRecord[conversationId] || [];
      }
      if (messageRecord[conversationId]) {
        return messageRecord[conversationId];
      }
      const { data } = await messageService.listMessage({
        conversationId,
      });
      console.log("Fetched data:", data);
      if (data.retcode === 0) {
        // Add the role field to each message
        const messagesWithRole = data.data.map((message) => ({
          ...message,
          qas: message.qas.map((qa) => ({
            ...qa,
            answer: qa.answer.map((ans) => ({
              ...ans,
              role: "assistant",
            })),
          })),
        }));
        dispatch(
          addMessageItem({
            conversation_id: conversationId,
            messages: messagesWithRole,
          })
        );
        return messagesWithRole;
      }
      return data?.data || [];
    },
  });

  return { data, loading, refetch };
};

export const useFeedback = (qaId: string, answerId: string) => {
  const { t } = useTranslation();
  const { isLogin } = useAuth();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["feedback"],
    mutationFn: async (params: IFeedbackRequestBody) => {
      let ret;

      const { data } = await messageService.feedback({
        ...params,
        qaId,
        answerId,
      });
      ret = data;

      if (ret.retcode === 0) {
        // toast.success(t(`message.operated`));
      }
      return ret.retcode;
    },
  });

  return { data, loading, feedback: mutateAsync };
};

export const useSendFeedback = (qaId: string, answerId: string, tb: string) => {
  const { visible, hideModal, showModal } = useSetModalState();
  const { feedback, loading } = useFeedback(qaId, answerId);
  const [thumb, setThumb] = useState(tb);
  const onFeedbackOk = useCallback(
    async (params: IFeedbackRequestBody) => {
      if (params.thumb && params.thumb === thumb) {
        return;
      }
      const ret = await feedback({
        ...params,
        qaId: qaId,
        answerId: answerId,
      });

      if (ret === 0) {
        if (params.thumb) {
          setThumb(params.thumb);
        }
        hideModal();
      }
    },
    [feedback, hideModal, qaId, answerId, thumb]
  );

  return {
    thumb,
    loading,
    onFeedbackOk,
    visible,
    hideModal,
    showModal,
  };
};
