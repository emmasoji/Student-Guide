import json
import math
from typing import List, Optional

from app.core.config import get_settings
from app.models.schemas import Place, PlaceCategory

_runtime_cache: Optional[List[Place]] = None


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def load_seed_places() -> List[Place]:
    settings = get_settings()
    path = settings.data_dir / "places.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Place(**item) for item in raw]


def _merge(live: List[Place], seed: List[Place]) -> List[Place]:
    by_name = {p.name.lower(): p for p in live}
    for p in seed:
        if p.name.lower() not in by_name:
            by_name[p.name.lower()] = p
    return sorted(by_name.values(), key=lambda x: x.name.lower())


def get_all_places() -> List[Place]:
    global _runtime_cache
    if _runtime_cache is not None:
        return _runtime_cache
    # Seed until async refresh runs
    _runtime_cache = load_seed_places()
    return _runtime_cache


async def refresh_places() -> List[Place]:
    """Pull live OSM features and merge with seed."""
    global _runtime_cache
    from app.services.live_places import fetch_live_places

    try:
        live = await fetch_live_places()
    except Exception:
        live = []
    seed = load_seed_places()
    _runtime_cache = _merge(live, seed) if live else seed
    return _runtime_cache


def set_places_cache(places: List[Place]) -> None:
    global _runtime_cache
    _runtime_cache = places


def get_place_by_id(place_id: str) -> Optional[Place]:
    for p in get_all_places():
        if p.id == place_id:
            return p
    return None


def search_places(query: str, limit: int = 20) -> List[Place]:
    q = query.strip().lower()
    if not q:
        return []
    results = []
    for p in get_all_places():
        score = 0
        name_l = p.name.lower()
        if q in name_l:
            score += 10
        if name_l.startswith(q):
            score += 5
        for alias in p.aliases:
            if q in alias.lower():
                score += 6
                break
        if p.category.value.replace("_", " ") in q or q in p.category.value:
            score += 3
        if p.description and q in p.description.lower():
            score += 1
        if score > 0:
            results.append((score, p))
    results.sort(key=lambda x: (-x[0], x[1].name))
    return [p for _, p in results[:limit]]


def nearby_places(
    lat: float,
    lng: float,
    radius_m: float = 300,
    category: Optional[PlaceCategory] = None,
    limit: int = 10,
) -> List[Place]:
    candidates = []
    for p in get_all_places():
        if category and p.category != category:
            continue
        d = _haversine_m(lat, lng, p.lat, p.lng)
        if d <= radius_m:
            candidates.append((d, p))
    candidates.sort(key=lambda x: x[0])
    return [p for _, p in candidates[:limit]]


def get_categories() -> List[dict]:
    counts: dict[str, int] = {}
    for p in get_all_places():
        counts[p.category.value] = counts.get(p.category.value, 0) + 1
    labels = {
        "gate": "Gates",
        "lecture_hall": "Lecture Halls",
        "laboratory": "Laboratories",
        "library": "Libraries",
        "cafeteria": "Cafeterias",
        "hostel": "Hostels",
        "administrative": "Administrative",
        "facility": "Facilities",
    }
    return [
        {"id": k, "label": labels.get(k, k), "count": v}
        for k, v in sorted(counts.items(), key=lambda x: -x[1])
    ]
