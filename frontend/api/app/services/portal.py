"""
Montgomery Open Data Portal - Live data fetcher.
Pulls live data from the City of Montgomery's ArcGIS Open Data Portal
(https://opendata.montgomeryal.gov) via ArcGIS REST API Feature Services.

All endpoints use the ArcGIS REST query interface:
  <service_url>/query?where=1=1&outFields=*&f=json&resultRecordCount=<limit>

Falls back gracefully to empty lists on network/timeout errors.
"""
import asyncio
import logging
from typing import Optional
import httpx
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# ── ArcGIS Feature Service URLs (City of Montgomery, orgId: xNUwUjOJqYE54USz) ──

PORTAL_ENDPOINTS = {
    # ── City Services ──
    "311_service_requests": (
        "https://gis.montgomeryal.gov/server/rest/services/"
        "HostedDatasets/Received_311_Service_Request/MapServer/0"
    ),
    "community_centers": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Community_Center/FeatureServer/1"
    ),

    # ── General Information / Demographics ──
    "daily_population_trends": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Daily_Population_Trends/FeatureServer/0"
    ),
    "most_visited_locations": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Most_Visited_Locations/FeatureServer/0"
    ),
    "council_districts": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Council_Districts_2024Oct01/FeatureServer/0"
    ),
    "visitors_origin": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Visitors_Origin/FeatureServer/0"
    ),

    # ── Planning & Development / Business ──
    "business_licenses": (
        "https://gis.montgomeryal.gov/server/rest/services/"
        "HostedDatasets/Business_License/FeatureServer/0"
    ),
    "construction_permits": (
        "https://gis.montgomeryal.gov/server/rest/services/"
        "HostedDatasets/Construction_Permits/FeatureServer/0"
    ),
    "business_view": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Business_view/FeatureServer/0"
    ),

    # ── Public Health ──
    "food_scores": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Food_Scoring/FeatureServer/0"
    ),
    "environmental_nuisance": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Environmental_Nuisance/FeatureServer/0"
    ),

    # ── Public Safety ──
    "911_calls": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "911_Calls_Data/FeatureServer/0"
    ),
    "emergency_911_calls": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Emergency_911_Calls/FeatureServer/0"
    ),
    "fire_police_stations": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Story_Map___Live__1__WFL1/FeatureServer/3"
    ),
    "emergency_shelters": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Emergency_Shelters/FeatureServer/0"
    ),

    # ── Recreation & Culture ──
    "parks_and_trails": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Park_and_Trail/FeatureServer/0"
    ),
    "points_of_interest": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Point_of_Interest/FeatureServer/0"
    ),
    "city_recreation": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Story_Map___Live__1__WFL1/FeatureServer/2"
    ),
    "community_library": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Story_Map___Live__1__WFL1/FeatureServer/5"
    ),

    # ── Transportation ──
    "tip_plan": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "TIP_PLAN/FeatureServer/1"
    ),
    "parking_kiosks": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Parking_Meters/FeatureServer/0"
    ),
    "parking_meters": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Parking_Meters_(2)/FeatureServer/0"
    ),
    "parking_zones": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Parking_Meters/FeatureServer/3"
    ),

    # ── Infrastructure (Sewer, Surplus Properties) ──
    "sewer_lateral_lines": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Sewer_Lateral_Lines/FeatureServer/0"
    ),
    "surplus_properties": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "SURPLUS_CITY_PROPERTIES_polygon/FeatureServer/0"
    ),

    # ── Schools & DayCare ──
    "schools": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Story_Map___Live__1__WFL1/FeatureServer/6"
    ),
    "daycare": (
        "https://services7.arcgis.com/xNUwUjOJqYE54USz/arcgis/rest/services/"
        "Story_Map___Live__1__WFL1/FeatureServer/4"
    ),
}

# Map dashboard categories → portal dataset keys
CATEGORY_PORTAL_MAP = {
    "city_services": ["311_service_requests", "community_centers"],
    "general_information": [
        "daily_population_trends", "most_visited_locations",
        "council_districts", "visitors_origin",
    ],
    "planning_development": [
        "business_licenses", "construction_permits", "business_view",
    ],
    "public_health": ["food_scores", "environmental_nuisance"],
    "public_safety": [
        "911_calls", "emergency_911_calls",
        "fire_police_stations", "emergency_shelters",
    ],
    "recreation_culture": [
        "parks_and_trails", "points_of_interest",
        "city_recreation", "community_library",
    ],
    "transportation": [
        "tip_plan", "parking_kiosks", "parking_meters", "parking_zones",
    ],
    "historical_markers": ["points_of_interest"],  # filter for historical types
}

# Default timeout for portal queries (seconds)
PORTAL_TIMEOUT = 15
PORTAL_MAX_RECORDS = 500


async def query_feature_service(
    service_url: str,
    where: str = "1=1",
    out_fields: str = "*",
    result_record_count: int = PORTAL_MAX_RECORDS,
    order_by: Optional[str] = None,
    return_geometry: bool = True,
) -> list[dict]:
    """
    Query an ArcGIS Feature Service / MapServer layer and return features
    as a list of dicts (attributes + optional geometry).
    """
    params = {
        "where": where,
        "outFields": out_fields,
        "f": "json",
        "resultRecordCount": result_record_count,
        "returnGeometry": str(return_geometry).lower(),
    }
    if order_by:
        params["orderByFields"] = order_by

    url = f"{service_url}/query"

    try:
        async with httpx.AsyncClient(timeout=PORTAL_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        features = data.get("features", [])
        results = []
        for feat in features:
            record = dict(feat.get("attributes", {}))
            # Extract lat/lon from geometry if present
            geom = feat.get("geometry")
            if geom:
                if "x" in geom and "y" in geom:
                    record["_lon"] = geom["x"]
                    record["_lat"] = geom["y"]
                elif "rings" in geom:
                    # Polygon — use centroid of first ring
                    ring = geom["rings"][0]
                    if ring:
                        xs = [p[0] for p in ring]
                        ys = [p[1] for p in ring]
                        record["_lon"] = sum(xs) / len(xs)
                        record["_lat"] = sum(ys) / len(ys)
                elif "paths" in geom:
                    # Polyline — use midpoint
                    path = geom["paths"][0]
                    if path:
                        mid = path[len(path) // 2]
                        record["_lon"] = mid[0]
                        record["_lat"] = mid[1]
            results.append(record)

        logger.info(f"Portal query OK: {service_url} → {len(results)} records")
        return results

    except httpx.TimeoutException:
        logger.warning(f"Portal query timeout: {service_url}")
        return []
    except httpx.HTTPStatusError as e:
        logger.warning(f"Portal query HTTP error: {service_url} → {e.response.status_code}")
        return []
    except (asyncio.CancelledError, KeyboardInterrupt):
        logger.warning(f"Portal query cancelled: {service_url}")
        return []
    except Exception as e:
        logger.warning(f"Portal query error: {service_url} → {e}")
        return []


async def get_service_record_count(service_url: str) -> int:
    """Get the total record count from a Feature Service layer."""
    url = f"{service_url}/query"
    params = {"where": "1=1", "returnCountOnly": "true", "f": "json"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json().get("count", 0)
    except Exception:
        return 0


def _normalize_record(record: dict, dataset_key: str, category: str) -> dict:
    """
    Normalize a raw ArcGIS feature record into the format the dashboard expects
    (matching the local JSON schema: id, name, description, lat, lon, etc.).
    """
    # Try to extract a name from common field patterns
    name = (
        record.get("Name") or record.get("name") or record.get("NAME")
        or record.get("FacilityName") or record.get("Facility_Name")
        or record.get("BUSINESS_NAME") or record.get("Business_Name")
        or record.get("LOCATION_NAME") or record.get("Location_Name")
        or record.get("Location") or record.get("LOCATION")
        or record.get("Description") or record.get("description")
        or record.get("Type") or record.get("TYPE")
        or f"{dataset_key.replace('_', ' ').title()} Record"
    )

    description = (
        record.get("Description") or record.get("description")
        or record.get("DESCRIPTION") or record.get("Comments")
        or record.get("Status") or record.get("STATUS")
        or record.get("Category") or record.get("CATEGORY")
        or ""
    )

    lat = record.get("_lat") or record.get("Latitude") or record.get("latitude") or record.get("LAT")
    lon = record.get("_lon") or record.get("Longitude") or record.get("longitude") or record.get("LON")

    address = (
        record.get("Address") or record.get("ADDRESS")
        or record.get("FULL_ADDRESS") or record.get("Street_Address")
        or record.get("Location") or record.get("LOCATION")
        or ""
    )

    status = (
        record.get("Status") or record.get("STATUS")
        or record.get("status") or record.get("CASE_STATUS")
        or "Active"
    )

    obj_id = record.get("OBJECTID") or record.get("ObjectId") or record.get("FID") or ""

    normalized = {
        "id": f"portal-{dataset_key}-{obj_id}",
        "category": category,
        "name": str(name)[:200] if name else f"{dataset_key} Record",
        "description": str(description)[:500] if description else "",
        "location": str(address)[:300] if address else "",
        "status": str(status)[:100] if status else "Active",
        "source": "Montgomery Open Data Portal (Live)",
        "_dataset": dataset_key,
    }

    if lat and lon:
        try:
            normalized["lat"] = float(lat)
            normalized["lon"] = float(lon)
        except (ValueError, TypeError):
            pass

    # Preserve all original fields as extra data
    skip = {"_lat", "_lon", "OBJECTID", "ObjectId", "FID", "Shape", "SHAPE",
            "Shape__Area", "Shape__Length", "GlobalID"}
    for k, v in record.items():
        if k not in skip and k not in normalized and v is not None:
            normalized[k] = v

    return normalized


async def fetch_portal_category(category: str, max_per_source: int = 200) -> list[dict]:
    """
    Fetch live data for a dashboard category from the Montgomery Open Data Portal.
    Queries all relevant portal endpoints and returns normalized records.
    """
    dataset_keys = CATEGORY_PORTAL_MAP.get(category, [])
    if not dataset_keys:
        return []

    from app.data.loader import CATEGORY_DISPLAY_NAMES
    cat_display = CATEGORY_DISPLAY_NAMES.get(category, category)

    all_records = []
    for key in dataset_keys:
        url = PORTAL_ENDPOINTS.get(key)
        if not url:
            continue

        raw_records = await query_feature_service(
            service_url=url,
            result_record_count=max_per_source,
        )

        for raw in raw_records:
            normalized = _normalize_record(raw, key, cat_display)
            all_records.append(normalized)

    logger.info(f"Portal fetch for '{category}': {len(all_records)} total records")
    return all_records


async def fetch_all_portal_data() -> dict[str, list[dict]]:
    """Fetch live data for all categories."""
    import asyncio
    categories = list(CATEGORY_PORTAL_MAP.keys())
    tasks = [fetch_portal_category(cat) for cat in categories]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    data = {}
    for cat, result in zip(categories, results):
        if isinstance(result, Exception):
            logger.warning(f"Portal fetch failed for '{cat}': {result}")
            data[cat] = []
        else:
            data[cat] = result
    return data


# 5-minute TTL Cache for portal statistics
portal_stats_cache = TTLCache(maxsize=10, ttl=300)

async def get_portal_stats() -> dict:
    """Get quick statistics from the portal (record counts only, fast). Uses TTL cache."""
    
    cached_stats = portal_stats_cache.get("stats")
    if cached_stats is not None:
        return cached_stats
    
    import asyncio

    key_services = {
        "311_requests": PORTAL_ENDPOINTS["311_service_requests"],
        "business_licenses": PORTAL_ENDPOINTS["business_licenses"],
        "construction_permits": PORTAL_ENDPOINTS["construction_permits"],
        "911_calls": PORTAL_ENDPOINTS["emergency_911_calls"],
        "food_inspections": PORTAL_ENDPOINTS["food_scores"],
        "parks": PORTAL_ENDPOINTS["parks_and_trails"],
    }

    tasks = {name: get_service_record_count(url) for name, url in key_services.items()}

    results = {}
    counts = await asyncio.gather(*tasks.values(), return_exceptions=True)
    for name, count in zip(tasks.keys(), counts):
        results[name] = count if isinstance(count, int) else 0

    if results:
        portal_stats_cache["stats"] = results

    return results


async def search_portal(query: str, max_results: int = 50) -> list[dict]:
    """
    Search across multiple portal datasets for records matching a query.
    Uses SQL LIKE on common text fields.
    """
    import asyncio

    search_endpoints = {
        "311_service_requests": "DESCRIPTION LIKE '%{q}%'",
        "business_licenses": "BUSINESS_NAME LIKE '%{q}%'",
        "food_scores": "Name LIKE '%{q}%'",
        "parks_and_trails": "Name LIKE '%{q}%'",
        "points_of_interest": "Name LIKE '%{q}%'",
        "fire_police_stations": "Name LIKE '%{q}%'",
    }

    q = query.replace("'", "''").upper()
    tasks = []
    keys = []

    for key, where_template in search_endpoints.items():
        url = PORTAL_ENDPOINTS.get(key)
        if url:
            where = where_template.format(q=q)
            tasks.append(
                query_feature_service(url, where=where, result_record_count=max_results)
            )
            keys.append(key)

    results_list = await asyncio.gather(*tasks, return_exceptions=True)

    all_results = []
    for key, results in zip(keys, results_list):
        if isinstance(results, list):
            for r in results:
                all_results.append(_normalize_record(r, key, key.replace("_", " ").title()))

    return all_results[:max_results]
