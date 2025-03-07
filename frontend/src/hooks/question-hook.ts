import { useQuery } from "@tanstack/react-query";
import { useGetChatParams } from "./conversation-hook";
import { useFetchNextMessageList } from "./message-hook";
import questionService from "services/question-services";
import { IQuestion } from "interfaces/database/question";

export const useFetchNextQuestionList = () => {
    const { dialogId } = useGetChatParams();

    const {
        data,
        isFetching: loading,
        refetch,
    } = useQuery<IQuestion[]>({
        queryKey: ["fetchQuestionList", dialogId],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        enabled: !!dialogId,
        queryFn: async () => {
            const { data } = await questionService.listQuestion({
                dialogId,
            });
            return data.data || [];
        },
    });

    return { data, loading, refetch };
};

export const useFetchNextQuestionListBySearch = () => {
    const { dialogId } = useGetChatParams();
    const { data: messageList } = useFetchNextMessageList();
    const lastQuestion = messageList?.at(-2)?.content ?? "";
    const {
        data,
        isFetching: loading,
        refetch,
    } = useQuery<IQuestion[]>({
        queryKey: ["fetchQuestionList", dialogId],
        initialData: [],
        gcTime: 0,
        refetchOnWindowFocus: false,
        enabled: !!dialogId,
        queryFn: async () => {
            if (lastQuestion !== "") {
                const { data } = await questionService.searchQuestion({
                    "dialog_id": dialogId,
                    "prev_question": lastQuestion
                });
                return data.data || [];
            } else {
                const { data } = await questionService.listQuestion({
                    dialogId,
                });
                return data.data || [];
            }
            
        },
    });

    return { data, loading, refetch };
};
