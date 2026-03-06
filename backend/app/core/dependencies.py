from dataclasses import dataclass
from typing import Optional
from fastapi import Query

# =========================
# Pagination
# =========================
@dataclass
class PaginationParams:
    """
    Standard pagination dependency.
    Inject with: pagination: PaginationParams = Depends(pagination)
    """
    limit: int 
    offset: int

def pagination(
    limit: int = Query(default=50, ge=1, le=100, description="Items per page"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
) -> PaginationParams:
    return PaginationParams(limit=limit, offset=offset)

# ===================
# Common query filters shared across endpoints.
# ==================
@dataclass
class BoundsFilter:
    """
    Geographic bounding box filter.
    Used by alerts, shelters, and map endpoints. 
    """
    north: Optional[float]
    south: Optional[float]
    east: Optional[float]
    west: Optional[float]

    @property
    def is_set(self) -> bool:
        return all(v is not None for v in [self.north , self.south , self.east , self.west])

def get_bounds(
    north: Optional[float] = Query(default=None, description="North latitude bound"),
    south: Optional[float] = Query(default=None, description="South latitude bound"),
    east: Optional[float] = Query(default=None, description="East longitude bound"),
    west: Optional[float] = Query(default=None, description="West longitude bound"),
) -> BoundsFilter:
    return BoundsFilter(north=north, south=south, east=east, west=west)