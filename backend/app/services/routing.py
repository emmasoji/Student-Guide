import math
from typing import List, Optional, Tuple
import networkx as nx
from functools import lru_cache
import httpx

from app.core.config import get_settings
from app.models.schemas import RouteResponse, RouteStep, Place
from app.services.places import get_all_places, get_place_by_id, _haversine_m


WALKING_SPEED_M_S = 1.35  # ~4.9 km/h


def _bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lng2 - lng1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _direction_name(bearing: float) -> str:
    dirs = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"]
    idx = int((bearing + 22.5) // 45) % 8
    return dirs[idx]


@lru_cache
def build_campus_graph() -> nx.Graph:
    """Build a simple undirected graph connecting campus places within ~180 m.
    This approximates the pedestrian network without fabricating road geometries.
    """
    places = get_all_places()
    G = nx.Graph()
    for p in places:
        G.add_node(p.id, lat=p.lat, lng=p.lng, name=p.name)

    # Connect places that are reasonably close (campus walkable distance)
    for i, a in enumerate(places):
        for b in places[i + 1 :]:
            d = _haversine_m(a.lat, a.lng, b.lat, b.lng)
            if d < 180:  # metres
                G.add_edge(a.id, b.id, weight=d)
    return G


def _nearest_node(lat: float, lng: float) -> Tuple[str, float]:
    places = get_all_places()
    best_id, best_d = None, float("inf")
    for p in places:
        d = _haversine_m(lat, lng, p.lat, p.lng)
        if d < best_d:
            best_d = d
            best_id = p.id
    return best_id, best_d


def _path_to_geometry_and_steps(path_ids: List[str]) -> Tuple[List[List[float]], List[RouteStep], float]:
    places_map = {p.id: p for p in get_all_places()}
    geometry: List[List[float]] = []
    steps: List[RouteStep] = []
    total_dist = 0.0

    for i, nid in enumerate(path_ids):
        p = places_map[nid]
        geometry.append([p.lng, p.lat])
        if i > 0:
            prev = places_map[path_ids[i - 1]]
            d = _haversine_m(prev.lat, prev.lng, p.lat, p.lng)
            total_dist += d
            bearing = _bearing(prev.lat, prev.lng, p.lat, p.lng)
            direction = _direction_name(bearing)
            instruction = f"Walk {direction} toward {p.name}"
            if i == len(path_ids) - 1:
                instruction = f"Arrive at {p.name}"
            steps.append(
                RouteStep(
                    instruction=instruction,
                    distance_m=round(d, 1),
                    duration_s=round(d / WALKING_SPEED_M_S, 0),
                    lat=p.lat,
                    lng=p.lng,
                )
            )
    return geometry, steps, total_dist


def compute_campus_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    dest_name: str = "Destination",
) -> Optional[RouteResponse]:
    G = build_campus_graph()
    if len(G.nodes) < 2:
        return None

    origin_node, origin_dist = _nearest_node(origin_lat, origin_lng)
    dest_node, dest_dist = _nearest_node(dest_lat, dest_lng)

    if origin_node is None or dest_node is None:
        return None

    try:
        path = nx.shortest_path(G, origin_node, dest_node, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None

    geometry, steps, total_dist = _path_to_geometry_and_steps(path)

    # Prepend origin and append final dest if far from graph nodes
    if origin_dist > 15:
        geometry.insert(0, [origin_lng, origin_lat])
        steps.insert(
            0,
            RouteStep(
                instruction="Walk to nearest campus path",
                distance_m=round(origin_dist, 1),
                duration_s=round(origin_dist / WALKING_SPEED_M_S, 0),
                lat=get_all_places()[0].lat,  # placeholder
                lng=get_all_places()[0].lng,
            ),
        )
        total_dist += origin_dist

    if dest_dist > 15:
        geometry.append([dest_lng, dest_lat])
        steps.append(
            RouteStep(
                instruction=f"Walk to {dest_name}",
                distance_m=round(dest_dist, 1),
                duration_s=round(dest_dist / WALKING_SPEED_M_S, 0),
                lat=dest_lat,
                lng=dest_lng,
            )
        )
        total_dist += dest_dist

    duration = total_dist / WALKING_SPEED_M_S
    return RouteResponse(
        geometry=geometry,
        distance_m=round(total_dist, 1),
        duration_s=round(duration, 0),
        steps=steps,
        source="campus_graph",
        message="Route follows approximate campus pedestrian connections. Verify on the ground.",
    )


def compute_straight_line(
    origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, dest_name: str
) -> RouteResponse:
    d = _haversine_m(origin_lat, origin_lng, dest_lat, dest_lng)
    bearing = _bearing(origin_lat, origin_lng, dest_lat, dest_lng)
    direction = _direction_name(bearing)
    duration = d / WALKING_SPEED_M_S
    return RouteResponse(
        geometry=[[origin_lng, origin_lat], [dest_lng, dest_lat]],
        distance_m=round(d, 1),
        duration_s=round(duration, 0),
        steps=[
            RouteStep(
                instruction=f"Walk {direction} toward {dest_name}",
                distance_m=round(d, 1),
                duration_s=round(duration, 0),
                lat=dest_lat,
                lng=dest_lng,
            )
        ],
        source="straight_line",
        message="No campus path found. Showing direct walking line (may cross restricted areas).",
    )


async def try_osrm(
    origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float
) -> Optional[RouteResponse]:
    settings = get_settings()
    url = (
        f"{settings.osrm_base_url}/route/v1/foot/"
        f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        f"?overview=full&geometries=geojson&steps=true"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                return None
            route = data["routes"][0]
            coords = route["geometry"]["coordinates"]
            steps = []
            for leg in route.get("legs", []):
                for s in leg.get("steps", []):
                    man = s.get("maneuver", {})
                    loc = man.get("location", [0, 0])
                    steps.append(
                        RouteStep(
                            instruction=s.get("name") or man.get("modifier") or "Continue",
                            distance_m=round(s.get("distance", 0), 1),
                            duration_s=round(s.get("duration", 0), 0),
                            lat=loc[1],
                            lng=loc[0],
                        )
                    )
            return RouteResponse(
                geometry=coords,
                distance_m=round(route["distance"], 1),
                duration_s=round(route["duration"], 0),
                steps=steps,
                source="osrm",
                message="Route provided by OSRM public server (general road network).",
            )
    except Exception:
        return None


async def compute_route(
    origin_lat: float,
    origin_lng: float,
    destination_id: Optional[str] = None,
    destination_lat: Optional[float] = None,
    destination_lng: Optional[float] = None,
) -> RouteResponse:
    dest_name = "Destination"
    if destination_id:
        place = get_place_by_id(destination_id)
        if place:
            dest_lat = place.entrance_lat or place.lat
            dest_lng = place.entrance_lng or place.lng
            dest_name = place.name
    if dest_lat is None or dest_lng is None:
        raise ValueError("Destination coordinates or place_id required")

    # 1. Prefer OSRM (follows roads / footways)
    osrm = await try_osrm(origin_lat, origin_lng, dest_lat, dest_lng)
    if osrm and osrm.distance_m > 0:
        return osrm

    # 2. Campus place graph
    campus = compute_campus_route(origin_lat, origin_lng, dest_lat, dest_lng, dest_name)
    if campus and campus.distance_m > 0:
        return campus

    # 3. Straight line last resort
    return compute_straight_line(origin_lat, origin_lng, dest_lat, dest_lng, dest_name)