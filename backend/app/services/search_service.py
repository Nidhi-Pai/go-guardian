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
            # Get places from Google Places API
            places_data = await self._fetch_nearby_places(query, location, radius_meters)
            
            # Enhanced places with detailed SF data
            enhanced_places = []
            for place in places_data:
                place_location = {
                    'lat': place['geometry']['location']['lat'],
                    'lng': place['geometry']['location']['lng']
                }

                # Get comprehensive safety data using SF Data Service
                safety_data = await self.sf_data_service.get_area_safety_data(
                    place_location['lat'],
                    place_location['lng'],
                    200  # Smaller radius for specific place
                )

                # Extract relevant metrics from safety data
                incident_analysis = safety_data.get('incident_analysis', {})
                infrastructure = safety_data.get('infrastructure', {})
                response_metrics = safety_data.get('response_metrics', {})

                enhanced_place = {
                    'place_id': place['place_id'],
                    'name': place['name'],
                    'formatted_address': place.get('formatted_address', ''),
                    'location': place_location,
                    'safety_score': safety_data.get('safety_score', 0),
                    'risk_factors': incident_analysis.get('most_common_categories', []),
                    'safe_times': self._get_safe_times(safety_data),
                    'distance': await self._calculate_distance(location, place_location),
                    # New detailed SF data
                    'incident_categories': incident_analysis.get('category_distribution', {}).keys(),
                    'infrastructure': {
                        'light_coverage': infrastructure.get('coverage_score', 0),
                        'safe_spaces_count': len(infrastructure.get('safe_spaces', [])),
                        'working_lights': infrastructure.get('working_lights', 0),
                        'total_lights': infrastructure.get('total_lights', 0)
                    },
                    'emergency_metrics': {
                        'avg_response_time': response_metrics.get('mean_response_time', 0),
                        'resolution_rate': response_metrics.get('resolution_rate', 0),
                        'recent_incidents': incident_analysis.get('total_incidents', 0)
                    }
                }

                enhanced_places.append(enhanced_place)

            return sorted(enhanced_places, key=lambda x: (-x['safety_score'], x['distance']))

        except Exception as e:
            self.logger.error(f"Error in search_nearby_places: {str(e)}")
            raise

    def _get_safe_times(self, safety_data: Dict) -> List[str]:
        """Extract safe times from incident analysis"""
        if not safety_data.get('incident_analysis'):
            return []

        time_patterns = safety_data['incident_analysis'].get('time_patterns', {})
        safe_periods = []
        
        if time_patterns:
            periods = ['morning', 'afternoon', 'evening', 'night']
            avg_incidents = sum(time_patterns.values()) / len(time_patterns)
            
            for period in periods:
                if time_patterns.get(period, 0) < avg_incidents:
                    safe_periods.append(period)

        return safe_periods

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