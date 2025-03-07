import { useSetModalState } from "hooks/common-hook";
import { useSetNextDocumentParser } from "hooks/document-hook";
import { IChangeParserConfigRequestBody } from "interfaces/request/document";
import { useCallback } from "react";

export const useChangeDocumentParser = (documentId: string) => {
    const { setDocumentParser, loading } = useSetNextDocumentParser();

    const {
        visible: changeParserVisible,
        hideModal: hideChangeParserModal,
        showModal: showChangeParserModal,
    } = useSetModalState();

    const onChangeParserOk = useCallback(
        async (
            parserId: string,
            parserConfig: IChangeParserConfigRequestBody
        ) => {
            const ret = await setDocumentParser({
                parserId,
                documentId,
                parserConfig,
            });
            if (ret === 0) {
                hideChangeParserModal();
            }
        },
        [hideChangeParserModal, setDocumentParser, documentId]
    );

    return {
        changeParserLoading: loading,
        onChangeParserOk,
        changeParserVisible,
        hideChangeParserModal,
        showChangeParserModal,
    };
};
