import openai
from openai import OpenAI
from abc import ABC 
from services.service_utils import num_tokens_from_string

class Base(ABC):
    def __init__(self, key, model_name, base_url):
        self.client = OpenAI(api_key=key, base_url=base_url)
        self.model_name = model_name

    def chat(self, system, history, gen_conf):
        if system:
            history.insert(0, {"role": "system", "content": system})
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=history,
                **gen_conf)
            ans = response.choices[0].message.content.strip()
            if response.choices[0].finish_reason == "length":
                ans += "...\nFor the content length reason, it stopped, continue?"
            return ans, response.usage.total_tokens
        except openai.APIError as e:
            return "**ERROR**: " + str(e), 0

    def chat_streamly(self, system, history, gen_conf):
        if system:
            history.insert(0, {"role": "system", "content": system})
        ans = ""
        total_tokens = 0
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=history,
                stream=True,
                **gen_conf)
            for resp in response:
                if not resp.choices: continue
                if not resp.choices[0].delta.content:
                    resp.choices[0].delta.content = ""
                ans += resp.choices[0].delta.content
                total_tokens = (
                    (
                            total_tokens
                            + num_tokens_from_string(resp.choices[0].delta.content)
                    )
                    if not hasattr(resp, "usage") or not resp.usage
                    else resp.usage.get("total_tokens", total_tokens)
                )
                if resp.choices[0].finish_reason == "length":
                    ans += "...\nFor the content length reason, it stopped, continue?"
                yield ans

        except openai.APIError as e:
            yield ans + "\n**ERROR**: " + str(e)

        yield total_tokens
        
class GptTurbo(Base):
    def __init__(self, key, model_name="gpt-3.5-turbo", base_url="https://api.openai.com/v1"):
        if not base_url: base_url = "https://api.openai.com/v1"
        super().__init__(key, model_name, base_url)

class OpenAI_APIChat(Base):
    def __init__(self, key, model_name, base_url):
        if not base_url:
            raise ValueError("url cannot be None")
        model_name = model_name.split("__")[0]
        super().__init__(key, model_name, base_url)

class GeminiChat(Base):
    def __init__(self, key, model_name, base_url=""):
        from google.generativeai import client, GenerativeModel
        
        client.configure(api_key=key)
        _client = client.get_default_generative_client()
        self.model_name = 'models/' + model_name
        self.model = GenerativeModel(model_name=self.model_name)
        self.model._client = _client
    
    def chat(self, system, history, gen_conf):
        from google.generativeai.types import content_types

        if system:
            self.model._system_instruction = content_types.to_content(system)

        if 'max_tokens' in gen_conf:
            gen_conf['max_output_tokens'] = gen_conf['max_tokens']
        for k in list(gen_conf.keys()):
            if k not in ["temperature", "top_p", "max_output_tokens"]:
                del gen_conf[k]
        for item in history:
            if 'role' in item and item['role'] == 'assistant':
                item['role'] = 'model'
            if 'role' in item and item['role'] == 'system':
                item['role'] = 'user'
            if 'content' in item:
                item['parts'] = item.pop('content')

        try:
            response = self.model.generate_content(
                history,
                generation_config=gen_conf)
            ans = response.text
            return ans, response.usage_metadata.total_token_count
        except Exception as e:
            return "**ERROR**: " + str(e), 0
        
    def chat_streamly(self, system, history, gen_conf):
        from google.generativeai.types import content_types

        if system:
            self.model._system_instruction = content_types.to_content(system)
        if 'max_tokens' in gen_conf:
            gen_conf['max_output_tokens'] = gen_conf['max_tokens']
        for k in list(gen_conf.keys()):
            if k not in ["temperature", "top_p", "max_output_tokens"]:
                del gen_conf[k]
        for item in history:
            if 'role' in item and item['role'] == 'assistant':
                item['role'] = 'model'
            if 'content' in item:
                item['parts'] = item.pop('content')
        ans = ""
        try:
            response = self.model.generate_content(
                history,
                generation_config=gen_conf, stream=True)
            for resp in response:
                ans += resp.text
                yield ans

            yield response._chunks[-1].usage_metadata.total_token_count
        except Exception as e:
            yield ans + "\n**ERROR**: " + str(e)

        yield 0