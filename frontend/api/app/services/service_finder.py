"""
Service Finder - AI-powered tool to match citizen needs with city services.
Combines multiple datasets to provide personalized recommendations.
"""
from openai import OpenAI
from app.core.config import settings
from app.data.loader import load_all_datasets, CATEGORY_DISPLAY_NAMES
import json


# Predefined service categories for quick lookup
SERVICE_CATEGORIES = {
    "emergency": {
        "label": "Emergency Services",
        "icon": "🚨",
        "keywords": ["emergency", "911", "fire", "ambulance", "danger", "threat"],
        "instant_response": "For emergencies, CALL 911 immediately.",
    },
    "safety": {
        "label": "Safety & Security",
        "icon": "🛡️",
        "keywords": ["crime", "police", "theft", "vandalism", "noise", "suspicious"],
        "dataset": "public_safety",
    },
    "health": {
        "label": "Health & Medical",
        "icon": "❤️",
        "keywords": ["doctor", "hospital", "health", "clinic", "mental", "dental", "sick", "vaccine"],
        "dataset": "public_health",
    },
    "infrastructure": {
        "label": "Roads & Infrastructure",
        "icon": "🛣️",
        "keywords": ["pothole", "road", "streetlight", "sidewalk", "drainage", "traffic"],
        "dataset": "city_services",
    },
    "utilities": {
        "label": "Utilities & Bills",
        "icon": "💧",
        "keywords": ["water", "bill", "sewer", "outage", "utility", "payment"],
        "dataset": "city_services",
    },
    "waste": {
        "label": "Trash & Recycling",
        "icon": "♻️",
        "keywords": ["trash", "garbage", "recycling", "pickup", "bulk", "junk"],
        "dataset": "city_services",
    },
    "permits": {
        "label": "Permits & Licenses",
        "icon": "📋",
        "keywords": ["permit", "license", "business", "building", "zoning", "construction"],
        "dataset": "planning_development",
    },
    "recreation": {
        "label": "Parks & Recreation",
        "icon": "🌳",
        "keywords": ["park", "pool", "recreation", "sports", "community center", "playground"],
        "dataset": "recreation_culture",
    },
    "culture": {
        "label": "Arts & Culture",
        "icon": "🎭",
        "keywords": ["museum", "theater", "art", "history", "historical", "monument", "tour"],
        "dataset": "recreation_culture",
    },
    "transit": {
        "label": "Transportation",
        "icon": "🚌",
        "keywords": ["bus", "transit", "ride", "airport", "commute", "route"],
        "dataset": "transportation",
    },
    "housing": {
        "label": "Housing & Development",
        "icon": "🏠",
        "keywords": ["housing", "affordable", "apartment", "rent", "development", "home"],
        "dataset": "planning_development",
    },
    "animals": {
        "label": "Animal Services",
        "icon": "🐾",
        "keywords": ["animal", "dog", "cat", "stray", "pet", "adoption", "bite"],
        "dataset": "city_services",
    },
}


async def find_services(query: str) -> dict:
    """
    Match a citizen's query to relevant city services using keyword matching
    and optionally AI for complex queries.
    """
    query_lower = query.lower()

    # Check for emergency first
    for cat_key, cat_info in SERVICE_CATEGORIES.items():
        if cat_key == "emergency":
            if any(kw in query_lower for kw in cat_info["keywords"]):
                return {
                    "emergency": True,
                    "message": cat_info["instant_response"],
                    "category": "emergency",
                    "services": [],
                }

    # Find matching categories
    matched_categories = []
    for cat_key, cat_info in SERVICE_CATEGORIES.items():
        if cat_key == "emergency":
            continue
        score = sum(1 for kw in cat_info["keywords"] if kw in query_lower)
        if score > 0:
            matched_categories.append({"key": cat_key, "score": score, **cat_info})

    matched_categories.sort(key=lambda x: x["score"], reverse=True)

    # Load relevant datasets
    all_data = load_all_datasets()
    services = []

    if matched_categories:
        for match in matched_categories[:3]:
            dataset_key = match.get("dataset")
            if dataset_key and dataset_key in all_data:
                for item in all_data[dataset_key]:
                    services.append({
                        "name": item.get("name", ""),
                        "description": item.get("description", ""),
                        "location": item.get("location", ""),
                        "contact": item.get("contact", ""),
                        "hours": item.get("hours", ""),
                        "category": CATEGORY_DISPLAY_NAMES.get(dataset_key, dataset_key),
                        "lat": item.get("lat"),
                        "lon": item.get("lon"),
                    })

    # If OpenAI is available, enhance with AI recommendation
    ai_recommendation = ""
    if settings.OPENAI_API_KEY and query.strip():
        try:
            ai_recommendation = await _get_ai_recommendation(query, matched_categories, services)
        except Exception:
            pass

    return {
        "emergency": False,
        "query": query,
        "matched_categories": [
            {"key": m["key"], "label": m["label"], "icon": m["icon"]}
            for m in matched_categories[:3]
        ],
        "services": services[:10],
        "ai_recommendation": ai_recommendation,
        "total_results": len(services),
    }


async def _get_ai_recommendation(query: str, categories: list, services: list) -> str:
    """Generate AI-powered recommendation based on the query and matched services."""
    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.NVIDIA_BASE_URL
    )

    services_text = "\n".join(
        [f"- {s['name']}: {s['description'][:80]}... ({s.get('contact', 'N/A')})" for s in services[:5]]
    )

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful Montgomery city service advisor. Give concise, actionable advice (2-3 sentences). Include specific contact numbers or locations when available.",
            },
            {
                "role": "user",
                "content": f"A Montgomery resident needs help with: \"{query}\"\n\nRelevant services:\n{services_text}\n\nProvide a brief, helpful recommendation.",
            },
        ],
        temperature=0.3,
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()


def get_all_service_categories() -> list[dict]:
    """Return all service categories for the Service Finder UI."""
    return [
        {"key": k, "label": v["label"], "icon": v["icon"], "keywords": v["keywords"]}
        for k, v in SERVICE_CATEGORIES.items()
        if k != "emergency"
    ]
