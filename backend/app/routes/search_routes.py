# app/routes/search_routes.py

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, List
from ..services.search_service import LocationSearchService
from ..services.sf_data_service import SFDataService
from ..services.safety_analyzer import SafetyAnalyzer
from ..core.config import get_settings

router = APIRouter()

async def get_search_service():
    settings = get_settings()
    sf_data_service = SFDataService()
    safety_analyzer = SafetyAnalyzer()
    return LocationSearchService(
        settings.google_api_key,
        sf_data_service,
        safety_analyzer
    )

@router.get("/api/search/places")
async def search_places(
    query: str = Query(..., min_length=1),
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(default=5000, le=50000),
    search_service: LocationSearchService = Depends(get_search_service)
):
    """Search for places with safety information"""
    try:
        results = await search_service.search_nearby_places(
            query=query,
            location={'lat': lat, 'lng': lng},
            radius_meters=radius
        )
        
        return {
            'status': 'success',
            'results': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))