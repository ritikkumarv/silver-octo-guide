"""
Weather service - fetches real-time weather data for Montgomery, AL
"""
import httpx
from app.core.config import settings


async def get_current_weather() -> dict:
    """Fetch current weather for Montgomery, AL from OpenWeatherMap API."""
    if not settings.OPENWEATHER_API_KEY:
        return _get_fallback_weather()

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": settings.MONTGOMERY_LAT,
        "lon": settings.MONTGOMERY_LON,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "imperial",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

        return {
            "temperature": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"].title(),
            "icon": data["weather"][0]["icon"],
            "wind_speed": round(data["wind"]["speed"], 1),
            "city": "Montgomery, AL",
            "source": "OpenWeatherMap (Live)",
        }
    except Exception:
        return _get_fallback_weather()


async def get_weather_forecast() -> dict:
    """Fetch 5-day forecast for Montgomery, AL."""
    if not settings.OPENWEATHER_API_KEY:
        return {"forecast": [], "source": "Fallback (No API Key)"}

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": settings.MONTGOMERY_LAT,
        "lon": settings.MONTGOMERY_LON,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "imperial",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

        forecasts = []
        for item in data["list"][:8]:  # Next 24 hours (3-hour intervals)
            forecasts.append({
                "datetime": item["dt_txt"],
                "temp": round(item["main"]["temp"], 1),
                "description": item["weather"][0]["description"].title(),
                "icon": item["weather"][0]["icon"],
            })

        return {"forecast": forecasts, "source": "OpenWeatherMap (Live)"}
    except Exception:
        return {"forecast": [], "source": "Fallback (Error)"}


def _get_fallback_weather() -> dict:
    """Fallback weather data when API key is missing."""
    return {
        "temperature": 72.5,
        "feels_like": 74.0,
        "humidity": 55,
        "description": "Partly Cloudy",
        "icon": "02d",
        "wind_speed": 8.5,
        "city": "Montgomery, AL",
        "source": "Fallback (Set OPENWEATHER_API_KEY for live data)",
    }
