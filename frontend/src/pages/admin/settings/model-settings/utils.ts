import { LocalLlmFactories } from "./contansts";

export const isLocalLlmFactory = (llmFactory: string) =>
  LocalLlmFactories.some((x) => x === llmFactory);
