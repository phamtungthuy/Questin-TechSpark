import api from "utils/api";
import registerServer from "utils/register-server";
import request from "utils/requests";

const { listDialog, setDialog, getDialog, removeDialog } = api;

const methods = {
  listDialog: {
    url: listDialog,
    method: "get",
  },
  setDialog: {
    url: setDialog,
    method: "post",
  },
  getDialog: {
    url: getDialog,
    method: "get",
  },
  removeDialog: {
    url: removeDialog,
    method: "post"
  }
} as const;

const dialogService = registerServer<keyof typeof methods>(methods, request);

export default dialogService;
