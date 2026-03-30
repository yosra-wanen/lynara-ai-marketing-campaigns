import requests
try:
    res = requests.get("http://localhost:8001/catalog/items-with-images")
    print(res.status_code)
    print(res.json())
except Exception as e:
    print(str(e))
