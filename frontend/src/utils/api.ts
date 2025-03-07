const api_url = process.env.REACT_APP_BACKEND_API_URL
const api_version = "v1";
const api_host = `/api/${api_version}`;

export { api_url, api_host }

const apiEndpoints = {
    // user
    login: `${api_host}/user/login`,
    register: `${api_host}/user/register`,
    googleLogin: `${api_host}/user/google_callback`,
    getTenantInfo: `${api_host}/user/tenant_info`,

    // knowledge base
    getKnowledge: `${api_host}/kb/get`,
    setKnowledge: `${api_host}/kb/set`,
    listKnowledge: `${api_host}/kb/list`,
    removeKnowledge: `${api_host}/kb/rm`,
    
    // cluster
    listCluster: `${api_host}/cluster/list`,
    setCluster: `${api_host}/cluster/set`,
    removeCluster: `${api_host}/cluster/rm`,

    // document
    listDocument: `${api_host}/document/list`,
    uploadDocument: `${api_host}/document/upload`,
    runDocument: `${api_host}/document/run`,
    removeDocument:`${api_host}/document/rm`,
    changeDocumentParser: `${api_host}/document/change_parser`,

    // chunk
    testChunkRetrieval: `${api_host}/chunk/retrieval_test`,

    // dialog
    listDialog: `${api_host}/dialog/list`,
    setDialog: `${api_host}/dialog/set`,
    removeDialog: `${api_host}/dialog/rm`,
    getDialog: `${api_host}/dialog/get`,

    //llm
    listLLM: `${api_host}/llm/list`,
    myLLM: `${api_host}/llm/my_llms`,
    listFactory: `${api_host}/llm/factories`,
    setApiKey: `${api_host}/llm/set_api_key`,
    addLLM: `${api_host}/llm/add`,

    // question
    listQuestion: `${api_host}/question/list`,
    searchQuestion: `${api_host}/question/search`,

    // conversation
    setConversation: `${api_host}/conversation/set`,
    listConversation: `${api_host}/conversation/list`,
    removeConversation: `${api_host}/conversation/rm`,
    completion: `${api_host}/conversation/completion`,
    completionSql: `${api_host}/conversation/completion/sql`,
    completionTitle: `${api_host}/conversation/completion/title`,

    // message 
    listMessage: `${api_host}/message/list`,
    listShareMessage: `${api_host}/message/share/list`,
    setQAMessage: `${api_host}/message/setqa`,
    feedbackMessage: `${api_host}/message/feedback`,
    feebackGuestMessage: `${api_host}/message/guest/feedback`,

    //integration
    listProvider: `${api_host}/integration/providers`,
};

export default apiEndpoints;