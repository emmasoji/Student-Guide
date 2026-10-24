from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class PlaceCategory(str, Enum):
    gate = "gate"
    lecture_hall = "lecture_hall"
    laboratory = "laboratory"
    library = "library"
    cafeteria = "cafeteria"
    hostel = "hostel"
    administrative = "administrative"
    facility = "facility"


class Place(BaseModel):
    id: str
    name: str
    aliases: List[str] = []
    category: PlaceCategory
    description: Optional[str] = None
    lat: float
    lng: float
    verified: bool = False
    entrance_lat: Optional[float] = None
    entrance_lng: Optional[float] = None


class PlaceListResponse(BaseModel):
    places: List[Place]
    total: int


class SearchResponse(BaseModel):
    results: List[Place]
    query: str
    total: int


class NearbyRequest(BaseModel):
    lat: float
    lng: float
    radius_m: float = 300
    category: Optional[PlaceCategory] = None
    limit: int = 10


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_id: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    profile: str = "foot"


class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float
    lat: float
    lng: float


class RouteResponse(BaseModel):
    geometry: List[List[float]]  # [[lng, lat], ...]
    distance_m: float
    duration_s: float
    steps: List[RouteStep]
    source: str  # "campus_graph" | "osrm" | "straight_line"
    message: Optional[str] = None


class CategoryItem(BaseModel):
    id: str
    label: str
    count: int


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
