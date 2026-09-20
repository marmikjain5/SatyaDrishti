import httpx
import asyncio
import re
from bs4 import BeautifulSoup

async def test_search_scrape():
    url = "https://www.amazon.in/s?k=parle+g+gold+biscuits+1kg&rh=n%3A1350380031"
    jina_url = f"https://r.jina.ai/{url}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(jina_url, headers={"Accept": "text/plain"})
        print("Status:", resp.status_code)
        text = resp.text
        print("First 500 chars:\n", text[:500])
        
        # Look for product links in markdown
        # Typical markdown links: [Title](https://www.amazon.in/dp/...) or [Title](/dp/...)
        product_links = re.findall(r'\[([^\]]{10,120})\]\((https?://www\.amazon\.in/[^\s\)]*dp/[A-Z0-9]{10}[^\s\)]*)\)', text)
        print(f"Found {len(product_links)} direct product links:")
        for title, link in product_links[:5]:
            print(f"- Title: {title} | Link: {link}")

if __name__ == "__main__":
    asyncio.run(test_search_scrape())
