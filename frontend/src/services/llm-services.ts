import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const { listLLM,
  myLLM,
  listFactory,
  setApiKey,
  addLLM
 } = api;

const methods = {
  listLLM: {
    url: listLLM,
    method: "get",
  },
  myLLM: {
    url: myLLM,
    method: "get"
  },
  listFactory: {
    url: listFactory,
    method: "get"
  },
  setApiKey: {
    url: setApiKey,
    method: 'post'
  },
  addLLM: {
    url: addLLM,
    method: 'post'
  }
} as const;

const llmService = registerServer<keyof typeof methods>(methods, request);

export default llmService;
