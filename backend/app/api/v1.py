from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.models.schemas import (
    PlaceListResponse,
    Place,
    SearchResponse,
    NearbyRequest,
    RouteRequest,
    RouteResponse,
    CategoryItem,
    HealthResponse,
    PlaceCategory,
)
from app.services import places as places_service
from app.services.routing import compute_route

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")


@router.get("/campus/places", response_model=PlaceListResponse)
def list_places(
    category: Optional[PlaceCategory] = None,
    verified_only: bool = False,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    all_places = places_service.get_all_places()
    if category:
        all_places = [p for p in all_places if p.category == category]
    if verified_only:
        all_places = [p for p in all_places if p.verified]
    total = len(all_places)
    page = all_places[offset : offset + limit]
    return PlaceListResponse(places=page, total=total)


@router.get("/campus/places/{place_id}", response_model=Place)
def get_place(place_id: str):
    place = places_service.get_place_by_id(place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@router.get("/campus/search", response_model=SearchResponse)
def search(q: str = Query(..., min_length=1), limit: int = Query(15, ge=1, le=50)):
    results = places_service.search_places(q, limit=limit)
    return SearchResponse(results=results, query=q, total=len(results))


@router.get("/campus/nearby")
def nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: float = Query(300, ge=50, le=2000),
    category: Optional[PlaceCategory] = None,
    limit: int = Query(10, ge=1, le=50),
):
    results = places_service.nearby_places(lat, lng, radius_m, category, limit)
    return {"results": results, "total": len(results)}


@router.get("/campus/categories")
def categories():
    return places_service.get_categories()


@router.get("/campus/map-data")
def map_data():
    """Lightweight payload for map markers."""
    places = places_service.get_all_places()
    return {
        "places": [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "lat": p.lat,
                "lng": p.lng,
                "verified": p.verified,
            }
            for p in places
        ],
        "bounds": {
            "south": 6.5161567,
            "west": 3.3714662,
            "north": 6.5209790,
            "east": 3.3770046,
        },
        "center": {"lat": 6.51873, "lng": 3.37414},
    }


@router.post("/navigation/route", response_model=RouteResponse)
async def create_route(body: RouteRequest):
    try:
        route = await compute_route(
            origin_lat=body.origin_lat,
            origin_lng=body.origin_lng,
            destination_id=body.destination_id,
            destination_lat=body.destination_lat,
            destination_lng=body.destination_lng,
        )
        return route
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {str(e)}")
