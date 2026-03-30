import requests
import json

def test_fetch():
    cid = "fa4740c4-f331-4c4e-8798-b033e316540a"
    url = f"http://localhost:8002/catalog/items-with-images?company_id={cid}"
    try:
        res = requests.get(url)
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Items found: {len(data)}")
        if len(data) > 0:
            print("First item sample:")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fetch()
