import { AddModelPostBody, ApiKeyPostBody } from "components/admin/setting/model-settings/interface";
import { useSetModalState } from "hooks/common-hook";
import { IApiKeySavingParams, useAddModel, useSaveApiKey } from "hooks/llm-hook";
import { useCallback, useState } from "react";

type SavingParamsState = Omit<IApiKeySavingParams, "api_key">;

export const useSubmitApiKey = () => {
    const [savingParams, setSavingParams] = useState<SavingParamsState>(
        {} as SavingParamsState
    );
    const { saveApiKey, loading } = useSaveApiKey();
    const {
        visible: apiKeyVisible,
        hideModal: hideApiKeyModal,
        showModal: showApiKeyModal,
    } = useSetModalState();

    const onApiKeySavingOk = useCallback(
        async (postBody: ApiKeyPostBody) => {
            const ret = await saveApiKey({
                ...savingParams,
                ...postBody,
            });

            if (ret === 0) {
                hideApiKeyModal();
            }
        },
        [hideApiKeyModal, saveApiKey, savingParams]
    );

    const onShowApiKeyModal = useCallback(
        (savingParams: SavingParamsState) => {
            setSavingParams(savingParams);
            showApiKeyModal();
        },
        [showApiKeyModal, setSavingParams]
    );

    return {
        saveApiKeyLoading: loading,
        initialApiKey: "",
        llmFactory: savingParams.llm_factory,
        onApiKeySavingOk,
        apiKeyVisible,
        hideApiKeyModal,
        showApiKeyModal: onShowApiKeyModal,
    };
};

export const useSubmitAddModel = () => {
    const [savingParams, setSavingParams] = useState<SavingParamsState>(
        {} as SavingParamsState
    );
    const { addModel, loading } = useAddModel();
    const {
        visible: addModelVisible,
        hideModal: hideAddModelModal,
        showModal: showAddModelModal,
    } = useSetModalState();

    const onAddModelSavingOk = useCallback(async (postBody: AddModelPostBody) => {
        const ret = await addModel({
          ...savingParams,
          ...postBody
        });
        if (ret === 0) {
          hideAddModelModal();
        }
    }, [hideAddModelModal, addModel, savingParams])

    const onShowAddModelModal = useCallback(
        (savingParams: SavingParamsState) => {
            setSavingParams(savingParams);
            showAddModelModal();
        },
        [showAddModelModal, setSavingParams]
    );

    return {
        addModelLoading: loading,
        initialAddModel: "",
        llmFactory: savingParams.llm_factory,
        onAddModelSavingOk,
        addModelVisible,
        hideAddModelModal,
        showAddModelModal: onShowAddModelModal,
    };
};

export const useRemoveModal = () => {
    const QueryClient = useQueryClient();
    const dispatch = useDispatch();

    const {
        data,
        inPending: loading,
        muteAsync,
    } = useMudatation({
        mutationKey: ["removeModel"],
        mutationFn: async(modelId: string) => {
            
        }
    })
}
