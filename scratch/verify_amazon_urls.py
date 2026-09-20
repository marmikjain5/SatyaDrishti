import httpx
import asyncio
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
}

candidates = [
    # Biscuits
    ("Britannia Good Day", "https://www.amazon.in/dp/B08PQ2S4BM"),
    ("Parle-G", "https://www.amazon.in/dp/B075753L1R"),
    ("Oreo", "https://www.amazon.in/dp/B07HG67Q3K"),
    ("Dark Fantasy", "https://www.amazon.in/dp/B00NBS6Z3Q"),
    ("Bourbon", "https://www.amazon.in/dp/B07H815N6F"),
    ("Marie Gold", "https://www.amazon.in/dp/B010GGDJVO"),
    # Oil
    ("Fortune Sunflower", "https://www.amazon.in/dp/B00TYD178E"),
    ("Fortune Sunlite 1L", "https://www.amazon.in/dp/B082VVRCLB"),
    ("Saffola Gold 1L", "https://www.amazon.in/dp/B07N5CGW2N"),
    ("Dhara Mustard 1L", "https://www.amazon.in/dp/B01H52D9FE"),
    ("Fortune Mustard 1L", "https://www.amazon.in/dp/B01N0P6Z0G"),
    # Tea & Coffee
    ("Tata Tea Gold", "https://www.amazon.in/dp/B00TYE9Y2E"),
    ("Tata Tea Premium", "https://www.amazon.in/dp/B01H55R30U"),
    ("Red Label", "https://www.amazon.in/dp/B07HG5N88W"),
    ("Nescafe Classic", "https://www.amazon.in/dp/B07575775M"),
    ("Bru Instant Coffee", "https://www.amazon.in/dp/B00T7T3HVE"),
    # Muesli & Oats
    ("Kellogg's Muesli", "https://www.amazon.in/dp/B07HG8SBDV"),
    ("Bagrry's Muesli", "https://www.amazon.in/dp/B01N8ZPG0C"),
    ("Quaker Oats", "https://www.amazon.in/dp/B00TYD16TK"),
    ("Kellogg's Corn Flakes", "https://www.amazon.in/dp/B019F0Y6X2"),
    ("Saffola Oats", "https://www.amazon.in/dp/B01H51S7Z4"),
    # Dry Fruits
    ("Cashews W240", "https://www.amazon.in/dp/B07817WTRL"),
    ("Happilo Cashews", "https://www.amazon.in/dp/B07MC58Q1S"),
    ("Happilo Almonds", "https://www.amazon.in/dp/B07GBK35W2"),
    ("Nutraj Walnuts", "https://www.amazon.in/dp/B01J467N3A"),
    ("Tulsi California Almonds", "https://www.amazon.in/dp/B010GGDSRE"),
    # Spices
    ("Tata Salt", "https://www.amazon.in/dp/B00TYD187Y"),
    ("Catch Turmeric", "https://www.amazon.in/dp/B07H815N6F"),
    ("Everest Garam Masala", "https://www.amazon.in/dp/B00T7T3HVE"),
    ("MDH Deggi Mirch", "https://www.amazon.in/dp/B00TYD16XQ"),
    # Dairy
    ("Amul Butter", "https://www.amazon.in/dp/B07V2Q8VDF"),
    ("Mother Dairy Ghee", "https://www.amazon.in/dp/B082VVRCLB"),
    ("Britannia Cheese", "https://www.amazon.in/dp/B010GGDSRE"),
    # Staples
    ("Aashirvaad Atta", "https://www.amazon.in/dp/B01H51S7Z4"),
    ("Daawat Basmati", "https://www.amazon.in/dp/B01N0P6Z0G"),
    ("Tata Besan", "https://www.amazon.in/dp/B07FY7R9W3"),
    # Instant Foods
    ("Maggi Noodles", "https://www.amazon.in/dp/B01H55R30U"),
    ("Yippee Noodles", "https://www.amazon.in/dp/B07MC58Q1S"),
    ("Haldiram Aloo Bhujia", "https://www.amazon.in/dp/B00TYD16XQ"),
    # Personal Care
    ("Dove Soap", "https://www.amazon.in/dp/B019F0Y6X2"),
    ("Nivea Soft", "https://www.amazon.in/dp/B00T7T3K2K"),
    ("Himalaya Neem", "https://www.amazon.in/dp/B01H52D9M2"),
]

async def check(name, url):
    try:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=10.0) as client:
            resp = await client.get(url)
            text = resp.text
            soup = BeautifulSoup(text, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.text.strip() if title_tag else ""
            is_404 = "Page Not Found" in title or "dogs of amazon" in text.lower() or "not a functioning page" in text.lower()
            h1 = soup.find("h1")
            h1_text = h1.text.strip() if h1 else ""
            status = "VALID" if (resp.status_code == 200 and not is_404 and len(text) > 5000) else "DEAD/404"
            print(f"[{status}] {name} ({resp.status_code}) -> Title: {title[:50]} | URL: {url}")
            return status == "VALID", name, url, title
    except Exception as e:
        print(f"[ERR] {name} -> {e}")
        return False, name, url, str(e)

async def main():
    tasks = [check(name, url) for name, url in candidates]
    results = await asyncio.gather(*tasks)
    valid_count = sum(1 for r in results if r[0])
    print(f"\nTotal Valid: {valid_count}/{len(candidates)}")

if __name__ == "__main__":
    asyncio.run(main())
