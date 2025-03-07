import requests
import json

def search_brave(query : str, api_key:str) -> json:
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": api_key  
    }
    params = {
        "q": query,
        "count": 1 
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None

if __name__ == "__main__":
    api_key = ""
    query = "điểm chuẩn uet"
    results = search_brave(query, api_key)

    if results:
        print(json.dumps(results, indent=4))
