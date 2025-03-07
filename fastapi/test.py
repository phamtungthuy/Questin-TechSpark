query = "1123"
documents = [
    "321"
]
import requests

data = {
    "query": query,
    "documents": documents
}

res = requests.post("http://localhost:8000/rerank", headers = {
    "Content-Type": "application/json",
}, json=data)
print(res.json())
