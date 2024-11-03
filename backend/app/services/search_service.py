# app/services/search_service.py

from typing import Dict, List, Optional
import aiohttp
from datetime import datetime
import asyncio
from .sf_data_service import SFDataService
from .safety_analyzer import SafetyAnalyzer
from ..utils.logger import SafetyLogger

class LocationSearchService:
    def __init__(self, google_api_key: str, sf_data_service: SFDataService, safety_analyzer: SafetyAnalyzer):
        self.google_api_key = google_api_key
        self.sf_data_service = sf_data_service
        self.safety_analyzer = safety_analyzer
        self.logger = SafetyLogger("LocationSearchService")

    async def search_nearby_places(
        self, 
        query: str, 
        location: Dict[str, float], 
        radius_meters: int = 5000
    ) -> List[Dict]:
        """Search for places and enhance with safety data"""
        try:
            # Parallel fetch of places and safety data
            places_data, safety_data = await asyncio.gather(
                self._fetch_nearby_places(query, location, radius_meters),
                self.sf_data_service.get_area_safety_data(
                    location['lat'],
                    location['lng'],
                    radius_meters
                )
            )

            # Enhance places with safety data
            enhanced_places = []
            for place in places_data:
                try:
                    place_location = {
                        'lat': place['geometry']['location']['lat'],
                        'lng': place['geometry']['location']['lng']
                    }

                    # Calculate safety score
                    safety_info = await self.safety_analyzer.analyze_area(
                        place_location['lat'],
                        place_location['lng'],
                        safety_data
                    )

                    enhanced_place = {
                        'place_id': place['place_id'],
                        'name': place['name'],
                        'formatted_address': place.get('formatted_address', ''),
                        'location': place_location,
                        'types': place.get('types', []),
                        'rating': place.get('rating'),
                        'open_now': place.get('opening_hours', {}).get('open_now'),
                        'safety_score': safety_info['safety_score'],
                        'risk_factors': safety_info['risk_factors'],
                        'safe_times': safety_info['safe_times'],
                        'photos': place.get('photos', []),
                        'distance': await self._calculate_distance(location, place_location)
                    }

                    enhanced_places.append(enhanced_place)

                except Exception as e:
                    self.logger.error(f"Error enhancing place: {str(e)}")
                    continue

            return sorted(enhanced_places, key=lambda x: x['distance'])

        except Exception as e:
            self.logger.error(f"Search failed: {str(e)}")
            raise

    async def _fetch_nearby_places(
        self, 
        query: str, 
        location: Dict[str, float], 
        radius: int
    ) -> List[Dict]:
        """Fetch places from Google Places API"""
        async with aiohttp.ClientSession() as session:
            params = {
                'location': f"{location['lat']},{location['lng']}",
                'radius': radius,
                'keyword': query,
                'key': self.google_api_key
            }

            async with session.get(
                'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                params=params
            ) as response:
                data = await response.json()
                return data.get('results', [])

    async def _calculate_distance(
        self, 
        origin: Dict[str, float], 
        destination: Dict[str, float]
    ) -> float:
        """Calculate distance between two points"""
        async with aiohttp.ClientSession() as session:
            params = {
                'origins': f"{origin['lat']},{origin['lng']}",
                'destinations': f"{destination['lat']},{destination['lng']}",
                'mode': 'walking',
                'key': self.google_api_key
            }

            async with session.get(
                'https://maps.googleapis.com/maps/api/distancematrix/json',
                params=params
            ) as response:
                data = await response.json()
                if data['status'] == 'OK':
                    return data['rows'][0]['elements'][0]['distance']['value']
                return 0