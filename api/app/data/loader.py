"""
Data loader - loads Montgomery datasets from LIVE Open Data Portal with local JSON fallback.
Integrates with https://opendata.montgomeryal.gov (ArcGIS Hub) for real-time city data.
"""
import json
import logging
import math
import os
from typing import Optional
from cachetools import TTLCache
from app.core.config import settings

logger = logging.getLogger(__name__)

# All dataset categories mapping to local fallback file names
DATASET_FILES = {
    "city_services": "city_services.json",
    "general_information": "general_information.json",
    "planning_development": "planning_development.json",
    "public_health": "public_health.json",
    "public_safety": "public_safety.json",
    "recreation_culture": "recreation_culture.json",
    "transportation": "transportation.json",
    "historical_markers": "historical_markers.json",
}

CATEGORY_DISPLAY_NAMES = {
    "city_services": "City Services",
    "general_information": "General Information",
    "planning_development": "Planning and Development",
    "public_health": "Public Health",
    "public_safety": "Public Safety",
    "recreation_culture": "Recreation and Culture",
    "transportation": "Transportation",
    "historical_markers": "Historical Markers",
}

CATEGORY_ICONS = {
    "city_services": "Building2",
    "general_information": "Info",
    "planning_development": "TrendingUp",
    "public_health": "Heart",
    "public_safety": "Shield",
    "recreation_culture": "TreePine",
    "transportation": "Car",
    "historical_markers": "MapPin",
}

CATEGORY_COLORS = {
    "city_services": "#f59e0b",
    "general_information": "#6366f1",
    "planning_development": "#10b981",
    "public_health": "#ef4444",
    "public_safety": "#3b82f6",
    "recreation_culture": "#8b5cf6",
    "transportation": "#f97316",
    "historical_markers": "#ec4899",
}


def _clean_nans(obj):
    """Recursively replace NaN/Infinity floats with None so the response is valid JSON."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _clean_nans(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_nans(v) for v in obj]
    return obj


# 5-minute TTL Cache for live data requests
live_data_cache = TTLCache(maxsize=100, ttl=300)

def load_dataset(category: str) -> list[dict]:
    """Load a single dataset by category key (local JSON fallback only)."""
    filename = DATASET_FILES.get(category)
    if not filename:
        return []

    filepath = os.path.join(settings.DATA_DIR, filename)
    if not os.path.exists(filepath):
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


async def load_dataset_live(category: str) -> list[dict]:
    """
    Load dataset from the LIVE Montgomery Open Data Portal, using a 5-minute TTL cache.
    Falls back to local JSON if the portal is unreachable.
    Returns a dict with 'data', 'source', and 'count'.
    """
    # Check cache first
    cached_data = live_data_cache.get(category)
    if cached_data is not None:
        return [dict(item) for item in cached_data]

    from app.services.portal import fetch_portal_category

    try:
        live_data = await fetch_portal_category(category)
        if live_data:
            logger.info(f"✓ Live data for '{category}': {len(live_data)} records from portal")
            clean_data = [_clean_nans(item) for item in live_data]
            live_data_cache[category] = clean_data  # Store sanitised copy in cache
            return list(clean_data)  # Return a fresh copy
    except Exception as e:
        logger.warning(f"Portal fetch failed for '{category}': {e}")

    # Fallback to local JSON
    logger.info(f"↳ Falling back to local JSON for '{category}'")
    return load_dataset(category)


async def load_dataset_with_source(category: str) -> dict:
    """
    Load dataset and return with source metadata.
    Returns: {"data": [...], "source": "live"|"local", "count": int}
    """
    try:
        live_data = await load_dataset_live(category)
        if live_data:
            return {
                "data": live_data,
                "source": "Montgomery Open Data Portal (Live)",
                "count": len(live_data),
            }
    except Exception as e:
        logger.warning(f"Portal fetch failed: {e}")

    local_data = load_dataset(category)
    return {
        "data": local_data,
        "source": "Local Dataset (Fallback)",
        "count": len(local_data),
    }


def load_all_datasets() -> dict[str, list[dict]]:
    """Load all datasets from local JSON files (sync, for RAG pipeline)."""
    all_data = {}
    for category in DATASET_FILES:
        all_data[category] = load_dataset(category)
    return all_data


async def load_all_datasets_live() -> dict[str, list[dict]]:
    """Load all datasets with live portal data + fallback."""
    import asyncio
    categories = list(DATASET_FILES.keys())
    tasks = [load_dataset_live(cat) for cat in categories]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_data = {}
    for cat, result in zip(categories, results):
        if isinstance(result, Exception):
            logger.warning(f"Failed loading '{cat}': {result}, using local fallback")
            all_data[cat] = load_dataset(cat)
        else:
            all_data[cat] = result
    return all_data


def get_all_items_flat() -> list[dict]:
    """Get all dataset items as a flat list with category info."""
    items = []
    all_data = load_all_datasets()
    for category, dataset in all_data.items():
        for item in dataset:
            item["_category_key"] = category
            item["_category_display"] = CATEGORY_DISPLAY_NAMES.get(category, category)
            item["_color"] = CATEGORY_COLORS.get(category, "#888")
            items.append(item)
    return items


def get_map_points() -> list[dict]:
    """Get all items that have lat/lon coordinates for the map."""
    items = get_all_items_flat()
    points = []
    for item in items:
        if "lat" in item and "lon" in item:
            points.append({
                "id": item.get("id", ""),
                "name": item.get("name", ""),
                "description": item.get("description", ""),
                "category": item.get("_category_key", ""),
                "categoryDisplay": item.get("_category_display", ""),
                "color": item.get("_color", "#888"),
                "lat": item["lat"],
                "lon": item["lon"],
                "location": item.get("location", ""),
                "contact": item.get("contact", ""),
                "hours": item.get("hours", ""),
                "status": item.get("status", ""),
            })
    return points


def get_categories_summary() -> list[dict]:
    """Get summary of all categories with item counts."""
    all_data = load_all_datasets()
    summaries = []
    for category, dataset in all_data.items():
        summaries.append({
            "key": category,
            "name": CATEGORY_DISPLAY_NAMES.get(category, category),
            "icon": CATEGORY_ICONS.get(category, "Info"),
            "color": CATEGORY_COLORS.get(category, "#888"),
            "count": len(dataset),
        })
    return summaries


def prepare_documents_for_rag() -> list[dict]:
    """Prepare all dataset items as documents for the RAG vector store."""
    items = get_all_items_flat()
    documents = []
    for item in items:
        # Build a rich text representation for embedding
        text_parts = [
            f"Category: {item.get('_category_display', '')}",
            f"Name: {item.get('name', '')}",
            f"Description: {item.get('description', '')}",
        ]
        if item.get("location"):
            text_parts.append(f"Location: {item['location']}")
        if item.get("contact"):
            text_parts.append(f"Contact: {item['contact']}")
        if item.get("hours"):
            text_parts.append(f"Hours: {item['hours']}")
        if item.get("status"):
            text_parts.append(f"Status: {item['status']}")

        # Add any extra numeric/list fields
        skip_keys = {"id", "name", "description", "location", "contact", "hours",
                      "status", "lat", "lon", "category", "_category_key",
                      "_category_display", "_color"}
        for key, value in item.items():
            if key not in skip_keys and not key.startswith("_"):
                text_parts.append(f"{key.replace('_', ' ').title()}: {value}")

        documents.append({
            "id": item.get("id", ""),
            "text": "\n".join(text_parts),
            "metadata": {
                "category": item.get("_category_key", ""),
                "name": item.get("name", ""),
                "lat": item.get("lat"),
                "lon": item.get("lon"),
            },
        })
    return documents
