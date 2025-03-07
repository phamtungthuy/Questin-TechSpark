export interface ILLM {
  create_time: bigint;
  create_date: Date;
  update_time: bigint;
  update_date: Date;
  tenant_id: string;
  llm_factory: string;
  model_type: string;
  llm_name: string;
  api_key: string;
  api_base: string;
  used_tokens: number;
}

export interface IThirdOAIModel {
  available: boolean;
  create_date: string;
  create_time: number;
  fid: string;
  id: number;
  llm_name: string;
  max_tokens: number;
  model_type: string;
  status: string;
  tags: string;
  update_date: string;
  update_time: number;
}

export type IThirdOAIModelCollection = Record<string, IThirdOAIModel[]>;

export interface IFactory {
  create_date: string;
  create_time: number;
  logo: string;
  name: string;
  status: string;
  tags: string;
  update_date: string;
  update_time: number;
}

export interface IMyLlmValue {
  llm: Llm[];
  tags: string;
}

export interface Llm {
  name: string;
  type: string;
  used_token: number;
}
