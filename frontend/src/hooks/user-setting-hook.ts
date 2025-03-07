import { useQuery } from "@tanstack/react-query";
import { ResponseGetType } from "interfaces/database/base";
import { ITenantInfo } from "interfaces/database/knowledge";
import { isEmpty } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import userService from "services/user-service";

export const useFetchTenantInfo = (): ResponseGetType<ITenantInfo> => {
    const { t } = useTranslation();
    const { data, isFetching: loading } = useQuery({
      queryKey: ['tenantInfo'],
      initialData: {},
      gcTime: 0,
      queryFn: async () => {
        const { data: res } = await userService.getTenantInfo();
        if (res.retcode === 0) {
          // llm_id is chat_id
          // asr_id is speech2txt
          const { data } = res;
          if (isEmpty(data.embd_id) || isEmpty(data.llm_id)) {
            
          }
          data.chat_id = data.llm_id;
          data.speech2text_id = data.asr_id;
  
          return data;
        }
  
        return res;
      },
    });
  
    return { data, loading };
  };

export const useSelectParserList = (): Array<{
    value: string;
    label: string;
}> => {
    const { data: tenantInfo } = useFetchTenantInfo();

    const parserList = useMemo(() => {
        const parserArray: Array<string> =
            tenantInfo?.parser_ids?.split(",") ?? [];
        parserArray.push("gso:GSO")
        return parserArray.map((x) => {
            const arr = x.split(":");
            return { value: arr[0], label: arr[1] };
        });
    }, [tenantInfo]);

    return parserList;
};
