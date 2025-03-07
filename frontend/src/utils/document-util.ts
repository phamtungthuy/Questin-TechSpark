import { RunningStatus } from "constants/knowledge";

export const getExtension = (name: string) =>
  name?.slice(name.lastIndexOf('.') + 1).toLowerCase() ?? '';

export const isParserRunning = (text: RunningStatus) => {
  const isRunning = text === RunningStatus.RUNNING;
  return isRunning;
};