"""
Bright Data Web Scraper - Scrapes live Montgomery news, city updates, and alerts.

PRIMARY METHOD: Bright Data Scraping Browser API via Playwright.
  Connects to a remote browser over WSS — no local browser needed.
  Docs: https://docs.brightdata.com/scraping-automation/scraping-browser

FALLBACKS: Bright Data Dataset API → NewsAPI → realistic mock data.
"""
import httpx
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from bs4 import BeautifulSoup
from app.core.config import settings

# Cache for scraped data (avoid excessive API calls)
_news_cache: dict = {"data": [], "timestamp": None, "ttl_minutes": 15}
_alerts_cache: dict = {"data": [], "timestamp": None, "ttl_minutes": 10}


# ─────────────────────── Playwright Browser Helpers ───────────────────────

async def _get_page_html(url: str, wait_selector: str = "body", timeout_ms: int = 30000) -> str:
    """
    Open a URL using Bright Data's remote Scraping Browser via Playwright.
    Connects over WSS — no local Chrome/Chromium needed.
    """
    from playwright.async_api import async_playwright

    browser = None
    try:
        pw = await async_playwright().start()
        browser = await pw.chromium.connect_over_cdp(settings.BRIGHT_DATA_BROWSER_WSS)
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        try:
            await page.wait_for_selector(wait_selector, timeout=10000)
        except Exception:
            pass  # proceed with whatever loaded
        html = await page.content()
        await browser.close()
        await pw.stop()
        return html
    except Exception as e:
        if browser:
            try:
                await browser.close()
            except Exception:
                pass
        raise e


# ─────────────────────── News Scraping ───────────────────────


async def scrape_montgomery_news() -> list[dict]:
    """
    Scrape latest Montgomery, AL news.
    Priority: Bright Data Scraping Browser → Bright Data Dataset API → NewsAPI → mock data.
    """
    global _news_cache

    # Check cache
    if _news_cache["timestamp"] and _news_cache["data"]:
        elapsed = (datetime.now() - _news_cache["timestamp"]).total_seconds() / 60
        if elapsed < _news_cache["ttl_minutes"]:
            return _news_cache["data"]

    # 1. Try Bright Data Scraping Browser (primary - playwright over WSS)
    if settings.BRIGHT_DATA_BROWSER_WSS:
        try:
            news = await _scrape_news_with_browser()
            if news:
                _news_cache["data"] = news
                _news_cache["timestamp"] = datetime.now()
                return news
        except Exception as e:
            print(f"Bright Data Browser scrape error: {e}")

    # 2. Try Bright Data Dataset API
    if settings.BRIGHT_DATA_API_KEY:
        try:
            news = await _scrape_with_bright_data()
            _news_cache["data"] = news
            _news_cache["timestamp"] = datetime.now()
            return news
        except Exception as e:
            print(f"Bright Data API error: {e}")

    # 3. Try NewsAPI fallback
    if settings.NEWS_API_KEY:
        try:
            news = await _scrape_with_newsapi()
            _news_cache["data"] = news
            _news_cache["timestamp"] = datetime.now()
            return news
        except Exception as e:
            print(f"NewsAPI error: {e}")

    # 4. Final fallback: realistic mock data
    return _get_fallback_news()


async def _scrape_news_with_browser() -> list[dict]:
    """
    Scrape Google News results for Montgomery AL using Bright Data Scraping Browser.
    Connects to remote browser via WSS, renders JS, then parses the result.
    """
    search_url = "https://www.google.com/search?q=Montgomery+Alabama+news&tbm=nws&num=15"
    html = await _get_page_html(search_url, wait_selector="div#search")

    soup = BeautifulSoup(html, "html.parser")
    news_items = []

    # Parse Google News search results
    for article in soup.select("div.SoaBEf, div.dbsr, div[data-hveid]"):
        title_el = article.select_one("div.n0jPhd, div.mCBkyc, .nDgy9d, div.BNeawe")
        desc_el = article.select_one("div.GI74Re, div.s3v9rd, .GI74Re, div.BNeawe.s3v9rd")
        source_el = article.select_one("div.CEMjEf span, .WF4CUc, div.BNeawe.UPmit")
        link_el = article.select_one("a[href]")

        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            continue

        desc = desc_el.get_text(strip=True) if desc_el else ""
        source = source_el.get_text(strip=True) if source_el else "Web"
        url = link_el["href"] if link_el else ""
        if url.startswith("/url?q="):
            url = url.split("/url?q=")[1].split("&")[0]

        news_items.append({
            "title": title,
            "description": desc[:300],
            "url": url,
            "source": source,
            "published_at": datetime.now().isoformat(),
            "scraped_via": "Bright Data Scraping Browser",
            "category": _categorize_news(title + " " + desc),
        })

    return news_items[:15]


async def _scrape_with_bright_data() -> list[dict]:
    """
    Use Bright Data's Web Scraper API to collect Montgomery news.
    Bright Data provides structured web data at scale.
    Docs: https://docs.brightdata.com/scraping-automation/web-scraper
    """
    url = "https://api.brightdata.com/datasets/v3/trigger"
    headers = {
        "Authorization": f"Bearer {settings.BRIGHT_DATA_API_KEY}",
        "Content-Type": "application/json",
    }

    # Bright Data Web Scraper - search for Montgomery AL news
    payload = {
        "dataset_id": settings.BRIGHT_DATA_DATASET_ID,
        "endpoint": "https://www.google.com/search",
        "params": {
            "q": "Montgomery Alabama city news updates",
            "tbm": "nws",
            "num": 15,
        },
        "format": "json",
        "include_errors": False,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        results = response.json()

    news_items = []
    for item in results.get("results", results) if isinstance(results, dict) else results:
        news_items.append({
            "title": item.get("title", ""),
            "description": item.get("description", item.get("snippet", "")),
            "url": item.get("url", item.get("link", "")),
            "source": item.get("source", item.get("publisher", "Web")),
            "published_at": item.get("date", item.get("published_at", datetime.now().isoformat())),
            "scraped_via": "Bright Data Web Scraper",
            "category": _categorize_news(item.get("title", "") + " " + item.get("description", "")),
        })

    return news_items[:15]


async def _scrape_with_newsapi() -> list[dict]:
    """Fallback: Use NewsAPI to get Montgomery news."""
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": '"Montgomery Alabama" OR "Montgomery AL"',
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 15,
        "apiKey": settings.NEWS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    news_items = []
    for article in data.get("articles", []):
        title = article.get("title", "")
        desc = article.get("description", "")
        news_items.append({
            "title": title,
            "description": desc,
            "url": article.get("url", ""),
            "source": article.get("source", {}).get("name", "News"),
            "published_at": article.get("publishedAt", datetime.now().isoformat()),
            "scraped_via": "NewsAPI",
            "category": _categorize_news(title + " " + desc),
        })

    return news_items


async def scrape_montgomery_alerts() -> list[dict]:
    """
    Scrape city service alerts and updates from Montgomery city website.
    Priority: Bright Data Scraping Browser → Dataset API → mock data.
    """
    global _alerts_cache

    # Check cache
    if _alerts_cache["timestamp"] and _alerts_cache["data"]:
        elapsed = (datetime.now() - _alerts_cache["timestamp"]).total_seconds() / 60
        if elapsed < _alerts_cache["ttl_minutes"]:
            return _alerts_cache["data"]

    # 1. Try Bright Data Scraping Browser
    if settings.BRIGHT_DATA_BROWSER_WSS:
        try:
            alerts = await _scrape_alerts_with_browser()
            if alerts:
                _alerts_cache["data"] = alerts
                _alerts_cache["timestamp"] = datetime.now()
                return alerts
        except Exception as e:
            print(f"Bright Data Browser alerts error: {e}")

    # 2. Try Bright Data Dataset API
    if settings.BRIGHT_DATA_API_KEY:
        try:
            alerts = await _scrape_city_alerts_bright_data()
            _alerts_cache["data"] = alerts
            _alerts_cache["timestamp"] = datetime.now()
            return alerts
        except Exception as e:
            print(f"Bright Data API alerts error: {e}")

    return _get_fallback_alerts()


async def _scrape_alerts_with_browser() -> list[dict]:
    """
    Scrape Montgomery city website for live alerts using Bright Data Scraping Browser.
    Connects to remote browser over WSS and renders the page fully.
    """
    html = await _get_page_html(
        "https://www.montgomeryal.gov/news",
        wait_selector="article, .news-item, .entry-title, h2",
    )

    soup = BeautifulSoup(html, "html.parser")
    alerts = []

    # Try multiple selectors that might match the city site
    for article in soup.select("article, .news-item, .views-row, .entry, li.list-item")[:10]:
        title_el = article.select_one("h2, h3, .entry-title, .field-title, a")
        desc_el = article.select_one("p, .entry-summary, .field-body, .teaser")
        link_el = article.select_one("a[href]")

        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            continue

        desc = desc_el.get_text(strip=True)[:300] if desc_el else ""
        url = ""
        if link_el and link_el.get("href"):
            href = link_el["href"]
            url = href if href.startswith("http") else f"https://www.montgomeryal.gov{href}"

        severity = "info"
        text_lower = (title + " " + desc).lower()
        if any(w in text_lower for w in ["emergency", "warning", "danger", "severe"]):
            severity = "alert"
        elif any(w in text_lower for w in ["maintenance", "delay", "interrupt", "closure"]):
            severity = "warning"

        alerts.append({
            "title": title,
            "description": desc,
            "severity": severity,
            "source": "montgomeryal.gov",
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "scraped_via": "Bright Data Scraping Browser",
        })

    return alerts

    return _get_fallback_alerts()


async def _scrape_city_alerts_bright_data() -> list[dict]:
    """Scrape Montgomery city website for live alerts using Bright Data."""
    url = "https://api.brightdata.com/datasets/v3/trigger"
    headers = {
        "Authorization": f"Bearer {settings.BRIGHT_DATA_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "dataset_id": settings.BRIGHT_DATA_DATASET_ID,
        "url": ["https://www.montgomeryal.gov/news"],
        "format": "json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        results = response.json()

    alerts = []
    for item in results if isinstance(results, list) else [results]:
        alerts.append({
            "title": item.get("title", "City Update"),
            "description": item.get("content", item.get("description", "")),
            "severity": "info",
            "source": "montgomeryal.gov",
            "timestamp": item.get("date", datetime.now().isoformat()),
            "scraped_via": "Bright Data Web Scraper",
        })

    return alerts


def _categorize_news(text: str) -> str:
    """Auto-categorize news based on keywords."""
    text_lower = text.lower()
    categories = {
        "public_safety": ["crime", "police", "arrest", "shooting", "fire", "accident", "crash", "emergency"],
        "public_health": ["health", "hospital", "covid", "vaccine", "clinic", "medical", "disease"],
        "transportation": ["traffic", "road", "highway", "transit", "bus", "airport", "construction"],
        "recreation_culture": ["festival", "event", "museum", "park", "concert", "arts", "culture", "sports"],
        "planning_development": ["development", "business", "economy", "jobs", "housing", "construction", "zoning"],
        "city_services": ["water", "utility", "trash", "permit", "311", "outage"],
        "general_information": ["election", "council", "mayor", "budget", "school", "education"],
    }

    for category, keywords in categories.items():
        if any(kw in text_lower for kw in keywords):
            return category

    return "general_information"


def _get_fallback_news() -> list[dict]:
    """Realistic mock news data for Montgomery when APIs are unavailable."""
    now = datetime.now()
    return [
        {
            "title": "Montgomery Announces $50M Downtown Revitalization Phase 2",
            "description": "Mayor Steven Reed unveiled plans for the next phase of the downtown revival project, including new mixed-use developments along Commerce Street and expanded Riverwalk amenities.",
            "url": "https://www.montgomeryadvertiser.com",
            "source": "Montgomery Advertiser",
            "published_at": (now - timedelta(hours=2)).isoformat(),
            "scraped_via": "Fallback (Set BRIGHT_DATA_API_KEY for live scraping)",
            "category": "planning_development",
        },
        {
            "title": "MPD Reports 15% Drop in Property Crime for Q1 2026",
            "description": "Montgomery Police Department's community policing initiatives show results as property crime rates decline for the third consecutive quarter.",
            "url": "https://www.wsfa.com",
            "source": "WSFA 12 News",
            "published_at": (now - timedelta(hours=5)).isoformat(),
            "scraped_via": "Fallback",
            "category": "public_safety",
        },
        {
            "title": "Alabama Shakespeare Festival Announces 2026 Summer Season",
            "description": "The renowned theater company reveals a lineup of 8 productions including new works by Southern playwrights, running June through August at Blount Cultural Park.",
            "url": "https://www.al.com",
            "source": "AL.com",
            "published_at": (now - timedelta(hours=8)).isoformat(),
            "scraped_via": "Fallback",
            "category": "recreation_culture",
        },
        {
            "title": "Montgomery Area Transit Expands Weekend Service",
            "description": "MATS adds three new weekend routes connecting east Montgomery neighborhoods to downtown and medical facilities, effective next month.",
            "url": "https://www.montgomeryadvertiser.com",
            "source": "Montgomery Advertiser",
            "published_at": (now - timedelta(hours=12)).isoformat(),
            "scraped_via": "Fallback",
            "category": "transportation",
        },
        {
            "title": "New Community Health Center Opens in West Montgomery",
            "description": "The federally qualified health center will serve an estimated 8,000 patients annually with primary care, dental, and behavioral health services.",
            "url": "https://www.wsfa.com",
            "source": "WSFA 12 News",
            "published_at": (now - timedelta(hours=18)).isoformat(),
            "scraped_via": "Fallback",
            "category": "public_health",
        },
        {
            "title": "City Council Approves FY2027 Budget with Education Focus",
            "description": "The $285M budget includes $12M increase for after-school programs, public library expansion, and new technology in Montgomery Public Schools.",
            "url": "https://www.al.com",
            "source": "AL.com",
            "published_at": (now - timedelta(hours=24)).isoformat(),
            "scraped_via": "Fallback",
            "category": "general_information",
        },
        {
            "title": "Severe Weather Awareness Week Kicks Off in Montgomery",
            "description": "Emergency Management Agency urges residents to sign up for CodeRED alerts and review shelter plans as tornado season approaches the River Region.",
            "url": "https://www.wsfa.com",
            "source": "WSFA 12 News",
            "published_at": (now - timedelta(hours=30)).isoformat(),
            "scraped_via": "Fallback",
            "category": "public_safety",
        },
        {
            "title": "Legacy Museum Welcomes 500,000th Visitor This Year",
            "description": "Bryan Stevenson's Equal Justice Initiative museum continues to draw national attention as a premier Civil Rights destination in Montgomery.",
            "url": "https://www.montgomeryadvertiser.com",
            "source": "Montgomery Advertiser",
            "published_at": (now - timedelta(hours=36)).isoformat(),
            "scraped_via": "Fallback",
            "category": "recreation_culture",
        },
    ]


def _get_fallback_alerts() -> list[dict]:
    """Fallback city alerts."""
    now = datetime.now()
    return [
        {
            "title": "Water Main Repair - Dexter Avenue",
            "description": "Water service may be interrupted on Dexter Ave between Hull St and Decatur St from 9 AM to 3 PM for emergency main repair.",
            "severity": "warning",
            "source": "Montgomery Water Works",
            "timestamp": (now - timedelta(hours=1)).isoformat(),
            "scraped_via": "Fallback",
        },
        {
            "title": "Recycling Collection Delayed - District 4",
            "description": "Due to equipment maintenance, recycling pickup in District 4 will be delayed by one day this week.",
            "severity": "info",
            "source": "Solid Waste Division",
            "timestamp": (now - timedelta(hours=4)).isoformat(),
            "scraped_via": "Fallback",
        },
        {
            "title": "Heat Advisory - Stay Hydrated",
            "description": "NWS has issued a heat advisory for the Montgomery area. Cooling centers open at community centers citywide.",
            "severity": "alert",
            "source": "Emergency Management",
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "scraped_via": "Fallback",
        },
    ]
