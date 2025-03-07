import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IConversation, IMessage } from "interfaces/database/conversation";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import conversationService from "services/conversation-service";
import {
  removeConversationList,
  updateConversation,
  updateConversationList,
} from "store/conversation-slice";
import { AppDispatch, RootState } from "store/store";

export const useGetChatParams = () => {
  const { dialogId, conversationId } = useParams();

  return {
    dialogId: dialogId || "",
    conversationId: conversationId || "",
  };
};

export const useFetchNextConversationList = () => {
  const { dialogId } = useGetChatParams();
  const dispatch = useDispatch<AppDispatch>();
  const conversationRecord = useSelector(
    (state: RootState) => state.conversation.conversationListRecord
  );

  const {
    data,
    isFetching: loading,
    refetch,
  } = useQuery<IConversation[]>({
    queryKey: ["fetchConversationList", dialogId],
    initialData: [],
    gcTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!dialogId,
    queryFn: async () => {
      if (conversationRecord[dialogId]) {
        return conversationRecord[dialogId];
      }
      const { data } = await conversationService.listConversation({
        dialogId,
      });
      if (data.retcode === 0) {
        dispatch(
          updateConversationList({
            dialog_id: dialogId,
            conversationList: data.data,
          })
        );
        return data.data;
      }
      return data?.data || [];
    },
  });

  return { data, loading, refetch };
};

export const useSetNextConversation = () => {
  const { dialogId, conversationId } = useGetChatParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["updateConversation"],
    mutationFn: async (params: Record<string, any>) => {
      const { data } = await conversationService.setConversation({
        conversation_id: conversationId,
        dialog_id: dialogId,
        ...params,
      });
      if (data.retcode === 0) {
        await dispatch(
          updateConversation({
            dialog_id: dialogId,
            conversation: data.data,
          })
        );
        if (params.is_new) {
          navigate(`/${dialogId}/chat/${data.data.id}`);
        }
        queryClient.invalidateQueries({
          queryKey: ["fetchConversationList"],
        });
      }
      return data;
    },
  });

  return { data, loading, setConversation: mutateAsync };
};

export const useRemoveNextConversation = () => {
  const queryClient = useQueryClient();
  const { conversationId, dialogId } = useGetChatParams();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["removeConversation"],
    mutationFn: async (conversationIds: string[]) => {
      const { data } = await conversationService.removeConversation({
        conversationIds,
        dialogId,
      });
      if (data.retcode === 0) {
        if (conversationIds.includes(conversationId)) {
          navigate(`/${dialogId}/`);
        }
        await dispatch(
          removeConversationList({
            dialog_id: dialogId,
            conversation_ids: conversationIds,
          })
        );
        queryClient.invalidateQueries({
          queryKey: ["fetchConversationList"],
        });
      }
      return data.retcode;
    },
  });

  return { data, loading, removeConversation: mutateAsync };
};

export const useRemoveAllConversation = () => {
  const queryClient = useQueryClient();
  const { conversationId, dialogId } = useGetChatParams();
  const dispatch = useDispatch<AppDispatch>();
  const conversationRecord = useSelector(
    (state: RootState) => state.conversation.conversationListRecord
  );
  const navigate = useNavigate();

  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["removeAllConversation"],
    mutationFn: async () => {
      if (!conversationRecord[dialogId]) {
        return;
      }
      const conversationIds = conversationRecord[dialogId].map(
        (conv) => conv.id
      );
      const { data } = await conversationService.removeConversation({
        dialogId,
        conversationIds,
      });
      if (data.retcode === 0) {
        if (conversationId) {
          navigate(`/${dialogId}/`);
        }
        await dispatch(
          removeConversationList({
            dialog_id: dialogId,
            conversation_ids: conversationIds,
          })
        );
        queryClient.invalidateQueries({
          queryKey: ["fetchConversationList"],
        });
      }
      return data.retcode;
    },
  });

  return { data, loading, removeAllConversation: mutateAsync };
};

export const useCompletionConversationTitle = async () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["completionConversationTitle"],
    mutationFn: async (params: {
      conversationId: string;
      messages: IMessage[];
    }) => {
      const { data } = await conversationService.completionTitle(params);
      return data;
    },
  });
};
