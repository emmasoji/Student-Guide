# services/google_places.py
import httpx
from app.core.config import get_settings

async def places_in_bbox(south, west, north, east, keyword: str | None = None):
    settings = get_settings()
    key = settings.google_maps_api_key
    if not key:
        return []

    # Center of bbox for Nearby Search
    lat = (south + north) / 2
    lng = (west + east) / 2
    radius = 800  # metres — tune per campus size

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "key": key,
        "type": "university",  # also query school, library, etc. in parallel
    }
    if keyword:
        params["keyword"] = keyword

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        data = r.json()
    # map results → your Place schema (id, name, lat, lng, ...)
    return data.get("results", [])
