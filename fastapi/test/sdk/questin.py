import requests

class Questin:
    def __init__(self, api_key, base_url, version='v1'):
        self.user_key = api_key
        self.api_url = f"{base_url}/api/{version}"
        self.authorization_header = {"Authorization": "{} {}".format("Bearer", self.user_key)}
        
    def post(self, path, json=None, stream=False, files=None):
        res = requests.post(url=self.api_url + path, json=json, headers=self.authorization_header, stream=stream,files=files)
        return res

    def get(self, path, params=None, json=None):
        res = requests.get(url=self.api_url + path, params=params, headers=self.authorization_header,json=json)
        return res

    def delete(self, path, json):
        res = requests.delete(url=self.api_url + path, json=json, headers=self.authorization_header)
        return res

    def put(self, path, json):
        res = requests.put(url=self.api_url + path, json= json,headers=self.authorization_header)
        return res