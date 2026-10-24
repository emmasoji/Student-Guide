import json
import math
from pathlib import Path
from typing import List, Optional
from functools import lru_cache

from app.core.config import get_settings
from app.models.schemas import Place, PlaceCategory


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@lru_cache
def load_places() -> List[Place]:
    settings = get_settings()
    path = settings.data_dir / "places.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Place(**item) for item in raw]


def get_all_places() -> List[Place]:
    return load_places()


def get_place_by_id(place_id: str) -> Optional[Place]:
    for p in load_places():
        if p.id == place_id:
            return p
    return None


def search_places(query: str, limit: int = 20) -> List[Place]:
    q = query.strip().lower()
    if not q:
        return []
    results = []
    for p in load_places():
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
    for p in load_places():
        if category and p.category != category:
            continue
        d = _haversine_m(lat, lng, p.lat, p.lng)
        if d <= radius_m:
            candidates.append((d, p))
    candidates.sort(key=lambda x: x[0])
    return [p for _, p in candidates[:limit]]


def get_categories() -> List[dict]:
    counts: dict[str, int] = {}
    for p in load_places():
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
