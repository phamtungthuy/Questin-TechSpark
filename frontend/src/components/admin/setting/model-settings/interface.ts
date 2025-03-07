export interface ApiKeyPostBody {
    api_key: string;
    base_url: string;
    group_id?: string;
  }

export interface AddModelPostBody {
  api_key: string;
  base_url: string;
  llm_factory: string;
  model_name: string;
  model_type: string;
}
  