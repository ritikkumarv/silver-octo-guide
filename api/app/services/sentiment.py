"""
Sentiment Analysis Service - Analyzes news and citizen feedback sentiment.
Uses OpenAI for AI-powered sentiment classification.
"""
from datetime import datetime
from typing import Optional
from openai import OpenAI
from app.core.config import settings

# Sentiment cache
_sentiment_cache: dict = {"data": None, "timestamp": None}


async def analyze_sentiment(texts: list[dict]) -> dict:
    """
    Analyze sentiment of news articles/feedback using OpenAI.
    Returns overall sentiment breakdown and per-item scores.
    """
    if not texts:
        return {"overall": "neutral", "breakdown": {"positive": 0, "neutral": 0, "negative": 0}, "items": []}

    if settings.OPENAI_API_KEY:
        try:
            return await _analyze_with_openai(texts)
        except Exception as e:
            print(f"OpenAI sentiment error: {e}")

    # Fallback: keyword-based sentiment
    return _analyze_with_keywords(texts)


async def _analyze_with_openai(texts: list[dict]) -> dict:
    """Use OpenAI to classify sentiment of each text."""
    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.NVIDIA_BASE_URL
    )

    items = []
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}

    # Batch analyze (up to 15 at a time)
    batch_text = "\n".join(
        [f'{i+1}. "{t.get("title", "")}: {t.get("description", "")[:100]}"' for i, t in enumerate(texts[:15])]
    )

    prompt = f"""Analyze the sentiment of each news headline/description about Montgomery, Alabama.
For each item, classify as: positive, neutral, or negative.
Also provide a confidence score (0.0-1.0) and a one-line reason.

Items:
{batch_text}

Respond in this exact JSON format:
{{
  "results": [
    {{"index": 1, "sentiment": "positive", "confidence": 0.85, "reason": "Reports positive development for the city"}},
    ...
  ]
}}"""

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a sentiment analysis expert focused on civic news. Respond only in valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    import json
    result = json.loads(response.choices[0].message.content)

    for r in result.get("results", []):
        idx = r.get("index", 1) - 1
        sentiment = r.get("sentiment", "neutral").lower()
        if sentiment not in sentiment_counts:
            sentiment = "neutral"
        sentiment_counts[sentiment] += 1

        if idx < len(texts):
            items.append({
                "title": texts[idx].get("title", ""),
                "sentiment": sentiment,
                "confidence": r.get("confidence", 0.5),
                "reason": r.get("reason", ""),
                "category": texts[idx].get("category", "general_information"),
            })

    total = sum(sentiment_counts.values()) or 1
    overall = max(sentiment_counts, key=sentiment_counts.get)

    return {
        "overall": overall,
        "breakdown": sentiment_counts,
        "percentages": {
            k: round((v / total) * 100, 1) for k, v in sentiment_counts.items()
        },
        "items": items,
        "analyzed_at": datetime.now().isoformat(),
        "method": "OpenAI GPT-4o-mini",
    }


def _analyze_with_keywords(texts: list[dict]) -> dict:
    """Fallback: Simple keyword-based sentiment analysis."""
    positive_words = {"improve", "growth", "new", "open", "expand", "success", "award", "celebrate",
                      "increase", "better", "safe", "announce", "welcome", "up", "drop in crime", "decline in crime"}
    negative_words = {"crime", "shooting", "crash", "death", "fire", "damage", "close", "delay",
                      "warning", "alert", "arrest", "decline", "cut", "protest", "emergency"}

    items = []
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}

    for text in texts:
        combined = (text.get("title", "") + " " + text.get("description", "")).lower()
        pos_score = sum(1 for w in positive_words if w in combined)
        neg_score = sum(1 for w in negative_words if w in combined)

        if pos_score > neg_score:
            sentiment = "positive"
            confidence = min(0.5 + pos_score * 0.1, 0.9)
        elif neg_score > pos_score:
            sentiment = "negative"
            confidence = min(0.5 + neg_score * 0.1, 0.9)
        else:
            sentiment = "neutral"
            confidence = 0.5

        sentiment_counts[sentiment] += 1
        items.append({
            "title": text.get("title", ""),
            "sentiment": sentiment,
            "confidence": round(confidence, 2),
            "reason": f"Keyword analysis ({pos_score} positive, {neg_score} negative signals)",
            "category": text.get("category", "general_information"),
        })

    total = sum(sentiment_counts.values()) or 1
    overall = max(sentiment_counts, key=sentiment_counts.get)

    return {
        "overall": overall,
        "breakdown": sentiment_counts,
        "percentages": {
            k: round((v / total) * 100, 1) for k, v in sentiment_counts.items()
        },
        "items": items,
        "analyzed_at": datetime.now().isoformat(),
        "method": "Keyword Analysis (Set OPENAI_API_KEY for AI analysis)",
    }


async def get_city_sentiment_report() -> dict:
    """Get a full sentiment report combining news and alerts analysis."""
    from app.services.scraper import scrape_montgomery_news

    news = await scrape_montgomery_news()
    sentiment = await analyze_sentiment(news)

    # Category-level sentiment
    category_sentiment: dict = {}
    for item in sentiment.get("items", []):
        cat = item.get("category", "general_information")
        if cat not in category_sentiment:
            category_sentiment[cat] = {"positive": 0, "neutral": 0, "negative": 0}
        s = item.get("sentiment", "neutral")
        category_sentiment[cat][s] += 1

    return {
        **sentiment,
        "category_sentiment": category_sentiment,
        "news_count": len(news),
        "report_type": "Montgomery City Sentiment Report",
    }
