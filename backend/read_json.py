import json
import os

def read_json():
    file_path = r'c:\Users\adili\OneDrive\Desktop\catalog-5-backlog\catalog-5-backlog-catalogue\backend\items_output.json'
    if not os.path.exists(file_path):
        print("File not found.")
        return
    
    # Try different encodings
    for encoding in ['utf-16', 'utf-16le', 'utf-8']:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                data = json.load(f)
                print(f"Loaded with {encoding}. First item sample:")
                if isinstance(data, list) and len(data) > 0:
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
                    print(f"Total items: {len(data)}")
                else:
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                return
        except Exception as e:
            print(f"Failed with {encoding}: {e}")

if __name__ == "__main__":
    read_json()
