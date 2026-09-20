import httpx
import json

def test_runs():
    for i in range(2):
        resp = httpx.post("http://localhost:8000/api/v1/crawler/run-batch", json={"batch_size": 5}, timeout=30.0)
        data = resp.json()
        products = data.get("products", [])
        print(f"\n--- Batch {i+1} ({len(products)} products) ---")
        for p in products:
            prod = p.get("product", {})
            print(f"[{prod.get('sku')}] {prod.get('title')} -> {prod.get('url')}")

if __name__ == "__main__":
    test_runs()
