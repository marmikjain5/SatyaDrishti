import httpx
import asyncio
import re
from bs4 import BeautifulSoup
import urllib.parse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
}

SEARCH_QUERIES = [
    "britannia biscuits",
    "parle biscuits",
    "sunflower cooking oil",
    "mustard oil 1l",
    "tata tea gold",
    "instant coffee powder",
    "kelloggs muesli",
    "oats 1kg",
    "cashew nuts 500g",
    "almonds 500g",
    "tata salt 1kg",
    "turmeric powder 500g",
    "amul butter",
    "cow ghee 1l",
    "chakki fresh atta 5kg",
    "basmati rice 5kg",
    "maggi noodles",
    "namkeen bhujia",
    "bathing soap",
    "face wash neem",
]

async def scrape_asins(query):
    encoded = urllib.parse.quote(query)
    url = f"https://www.amazon.in/s?k={encoded}&i=grocery"
    try:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                print(f"[WARN] {query} status: {resp.status_code}")
                return []
            
            soup = BeautifulSoup(resp.text, "html.parser")
            items = []
            
            # Find product cards
            cards = soup.find_all("div", {"data-component-type": "s-search-result"})
            for card in cards:
                asin = card.get("data-asin")
                if not asin or len(asin) != 10:
                    continue
                
                h2 = card.find("h2")
                if not h2:
                    continue
                
                title = h2.text.strip()
                if not title or len(title) < 5 or "results for" in title.lower():
                    continue
                
                link = f"https://www.amazon.in/dp/{asin}"
                img_tag = card.find("img", {"class": "s-image"})
                img_url = img_tag.get("src") if img_tag else ""
                
                # Check price
                price_whole = card.find("span", {"class": "a-price-whole"})
                price_val = 0.0
                if price_whole:
                    try:
                        price_val = float(price_whole.text.replace(",", "").replace("₹", "").strip())
                    except:
                        pass
                
                items.append({
                    "asin": asin,
                    "title": title,
                    "url": link,
                    "image_url": img_url,
                    "price": price_val,
                    "query": query
                })
            
            print(f"[FOUND] {query}: {len(items)} products")
            return items
    except Exception as e:
        print(f"[ERR] {query}: {e}")
        return []

async def verify_pdp(url):
    try:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=10.0) as client:
            resp = await client.get(url)
            text = resp.text
            soup = BeautifulSoup(text, "html.parser")
            title_tag = soup.find("title")
            title = title_tag.text.strip() if title_tag else ""
            is_404 = "Page Not Found" in title or "dogs of amazon" in text.lower() or "not a functioning page" in text.lower()
            return resp.status_code == 200 and not is_404 and len(text) > 5000
    except:
        return False

async def main():
    tasks = [scrape_asins(q) for q in SEARCH_QUERIES]
    all_results = await asyncio.gather(*tasks)
    
    unique_products = {}
    for sub in all_results:
        for p in sub:
            if p["asin"] not in unique_products:
                unique_products[p["asin"]] = p
                
    print(f"\nTotal unique candidates: {len(unique_products)}")
    
    # Verify top 35 candidates
    verified = []
    for asin, p in list(unique_products.items())[:45]:
        ok = await verify_pdp(p["url"])
        if ok:
            print(f"[VERIFIED OK] {asin} | {p['title'][:60]} | {p['url']}")
            verified.append(p)
            if len(verified) >= 30:
                break
        else:
            print(f"[FAILED] {asin} | {p['url']}")
            
    print(f"\nSuccessfully verified {len(verified)} live direct Amazon PDPs!")
    import json
    with open("C:/Users/marmi/webdev/SatyaSetu-SIH/scratch/verified_30_asins.json", "w", encoding="utf-8") as f:
        json.dump(verified, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
