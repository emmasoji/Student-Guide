"""Fetch live campus features from OpenStreetMap Overpass and merge with seed data."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import List, Optional

import httpx

from app.core.config import get_settings
from app.models.schemas import Place, PlaceCategory

# YABATECH campus bounding box (from OSM way 671850885)
BBOX = (6.5161567, 3.3714662, 6.5209790, 3.3770046)  # s, w, n, e

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

_cache: dict = {"ts": 0.0, "places": None}
CACHE_TTL_S = 60 * 30  # 30 minutes


def _category_from_tags(tags: dict) -> PlaceCategory:
    amenity = (tags.get("amenity") or "").lower()
    building = (tags.get("building") or "").lower()
    leisure = (tags.get("leisure") or "").lower()
    shop = (tags.get("shop") or "").lower()

    if amenity in ("university", "college", "school") or building in ("university", "college"):
        return PlaceCategory.administrative
    if amenity == "library" or building == "library":
        return PlaceCategory.library
    if amenity in ("restaurant", "cafe", "fast_food", "food_court", "canteen") or shop in ("bakery", "convenience"):
        return PlaceCategory.cafeteria
    if amenity in ("laboratory", "research_institute") or "lab" in (tags.get("name") or "").lower():
        return PlaceCategory.laboratory
    if amenity in ("dormitory",) or building in ("dormitory", "residential"):
        return PlaceCategory.hostel
    if amenity in ("gate",) or tags.get("barrier") == "gate" or tags.get("highway") == "gate":
        return PlaceCategory.gate
    if leisure in ("sports_centre", "stadium", "pitch", "fitness_centre"):
        return PlaceCategory.facility
    if amenity in ("toilets", "parking", "bank", "atm", "clinic", "hospital", "pharmacy"):
        return PlaceCategory.facility
    if building in ("yes", "academic", "office", "public"):
        return PlaceCategory.lecture_hall
    return PlaceCategory.facility


def _make_id(osm_type: str, osm_id: int, name: str) -> str:
    raw = f"{osm_type}:{osm_id}:{name}"
    return "osm-" + hashlib.sha1(raw.encode()).hexdigest()[:12]


def _parse_elements(elements: list) -> List[Place]:
    places: List[Place] = []
    seen_names: set[str] = set()

    for el in elements:
        tags = el.get("tags") or {}
        name = (tags.get("name") or tags.get("name:en") or "").strip()
        if not name:
            continue
        # Skip the whole-campus polygon label
        if name.lower() in ("yaba college of technology", "yabatech", "yct"):
            continue
        key = name.lower()
        if key in seen_names:
            continue
        seen_names.add(key)

        if el.get("type") == "node":
            lat, lng = el.get("lat"), el.get("lon")
        else:
            c = el.get("center") or {}
            lat, lng = c.get("lat"), c.get("lon")
        if lat is None or lng is None:
            continue

        cat = _category_from_tags(tags)
        aliases = []
        for k in ("short_name", "alt_name", "loc_name", "old_name"):
            if tags.get(k):
                aliases.append(tags[k])

        places.append(
            Place(
                id=_make_id(el.get("type", "n"), el.get("id", 0), name),
                name=name,
                aliases=aliases,
                category=cat,
                description=tags.get("description") or tags.get("note"),
                lat=float(lat),
                lng=float(lng),
                verified=True,  # came from OSM
                entrance_lat=float(lat),
                entrance_lng=float(lng),
            )
        )
    return places


def _overpass_query() -> str:
    s, w, n, e = BBOX
    return f"""
[out:json][timeout:50];
(
  node["name"]({s},{w},{n},{e});
  way["name"]["building"]({s},{w},{n},{e});
  way["name"]["amenity"]({s},{w},{n},{e});
  way["name"]["leisure"]({s},{w},{n},{e});
  node["amenity"]({s},{w},{n},{e});
  way["amenity"]({s},{w},{n},{e});
  node["barrier"="gate"]({s},{w},{n},{e});
);
out center tags;
""".strip()


async def fetch_live_places() -> List[Place]:
    global _cache
    now = time.time()
    if _cache["places"] is not None and now - _cache["ts"] < CACHE_TTL_S:
        return _cache["places"]

    query = _overpass_query()
    last_err: Optional[Exception] = None
    for url in OVERPASS_URLS:
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                resp = await client.post(url, data={"data": query})
                if resp.status_code != 200:
                    continue
                data = resp.json()
                places = _parse_elements(data.get("elements") or [])
                if places:
                    _cache = {"ts": now, "places": places}
                    return places
        except Exception as e:
            last_err = e
            continue

    # Fall back to seed file
    settings = get_settings()
    path = settings.data_dir / "places.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        places = [Place(**item) for item in raw]
        _cache = {"ts": now, "places": places}
        return places

    if last_err:
        raise last_err
    return []
