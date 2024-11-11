# backend/app/services/emergency_service.py

import json
from typing import Dict, Any, List
import google.generativeai as genai
from datetime import datetime
import requests
import logging
import aiohttp
import asyncio
from flask import current_app

class EmergencyService:
    def __init__(self, api_key: str):
        self.logger = logging.getLogger(__name__)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # SF Data endpoints for emergency resources
        self.emergency_endpoints = {
            'police': 'https://data.sfgov.org/resource/p4e4-a5a7.json',  # Police Stations
            'hospitals': 'https://data.sfgov.org/resource/sc8f-6qby.json',  # Hospitals
            'safe_places': 'https://data.sfgov.org/resource/g8m3-pdis.json'  # Safe Places
        }

    async def handle_emergency(
        self, 
        location: Dict[str, float], 
        user_report: str = None
    ) -> Dict[str, Any]:
        """Handle emergency situation and provide immediate guidance"""
        try:
            # Get nearby emergency resources
            resources = await self._get_emergency_resources(location)
            
            # Generate emergency response using Gemini
            response = await self._generate_emergency_response(location, resources, user_report)
            
            return {
                'timestamp': datetime.now().isoformat(),
                'location': location,
                'guidance': response['guidance'],
                'resources': resources,
                'immediate_actions': response['actions'],
                'emergency_contacts': response['emergency_contacts']
            }
            
        except Exception as e:
            self.logger.error(f"Emergency handling error: {str(e)}")
            return self._get_fallback_emergency_response()

    async def _get_emergency_resources(
        self, 
        location: Dict[str, float]
    ) -> Dict[str, List[Dict]]:
        """Get nearby emergency resources"""
        radius = 0.01  # Approximately 1km
        
        try:
            async with aiohttp.ClientSession() as session:
                # Fetch all resources concurrently
                tasks = [
                    self._fetch_resource(session, 'police', location, radius),
                    self._fetch_resource(session, 'hospitals', location, radius),
                    self._fetch_resource(session, 'safe_places', location, radius)
                ]
                police, hospitals, safe_places = await asyncio.gather(*tasks)

            resources = {
                'police': self._process_police_stations(police),
                'hospitals': self._process_hospitals(hospitals),
                'safe_places': self._process_safe_places(safe_places)
            }
            
            current_app.logger.info(f"Successfully fetched emergency resources: {resources}")
            return resources

        except Exception as e:
            current_app.logger.error(f"Error fetching emergency resources: {str(e)}", exc_info=True)
            return {
                'police': [],
                'hospitals': [],
                'safe_places': [],
                '_error': str(e)
            }

    async def _fetch_resource(
        self, 
        session: aiohttp.ClientSession,
        resource_type: str,
        location: Dict[str, float],
        radius: float
    ) -> List[Dict]:
        """Fetch a specific resource type"""
        try:
            async with session.get(
                self.emergency_endpoints[resource_type],
                params={
                    '$where': f"within_circle(location, {location['lat']}, {location['lng']}, {radius})"
                }
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    current_app.logger.error(f"Error fetching {resource_type}: {response.status}")
                    return []
        except Exception as e:
            current_app.logger.error(f"Error fetching {resource_type}: {str(e)}")
            return []

    async def _generate_emergency_response(
        self,
        location: Dict[str, float],
        resources: Dict[str, List[Dict]],
        user_report: str = None
    ) -> Dict[str, Any]:
        """Generate emergency response using Gemini"""
        prompt = f"""
        Generate immediate emergency guidance for a person in distress.
        
        Location: {location}
        Time: {datetime.now().strftime('%H:%M')}
        
        Available Resources:
        - Police Stations: {len(resources['police'])}
        - Hospitals: {len(resources['hospitals'])}
        - Safe Places: {len(resources['safe_places'])}
        
        User Report: {user_report if user_report else 'No specific report provided'}
        
        Provide immediate guidance with:
        1. Step-by-step safety instructions
        2. Nearest safe locations
        3. Emergency contact information
        4. Specific actions to take
        
        Format response as JSON with:
        {{
            "guidance": [step-by-step instructions],
            "actions": [immediate actions],
            "emergency_contacts": [emergency numbers and contacts]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except:
            return self._get_fallback_emergency_guidance()

    def _process_police_stations(self, stations: List[Dict]) -> List[Dict]:
        """Process police station data"""
        return [{
            'name': station.get('name', 'Police Station'),
            'address': station.get('address', 'Unknown'),
            'phone': station.get('phone', '911'),
            'distance': station.get('distance', 'Unknown'),
            'safety_score': self._calculate_station_safety_score(station)
        } for station in stations]

    def _calculate_station_safety_score(self, station: Dict) -> float:
        """Calculate safety score for a station based on response times and incident data"""
        try:
            # You can use existing SFDataService methods here
            base_score = 80  # Base safety score
            response_factor = station.get('avg_response_time', 15)
            incident_factor = station.get('recent_incidents', 10)
            
            score = base_score - (response_factor / 2) - (incident_factor / 2)
            return max(0, min(100, score))
        except Exception as e:
            current_app.logger.error(f"Error calculating station safety score: {str(e)}")
            return 70  # Default fallback score

    def _process_hospitals(self, hospitals: List[Dict]) -> List[Dict]:
        """Process hospital data"""
        return [{
            'name': hospital.get('name', 'Hospital'),
            'address': hospital.get('address', 'Unknown'),
            'phone': hospital.get('phone', '911'),
            'emergency': hospital.get('emergency', True),
            'distance': hospital.get('distance', 'Unknown')
        } for hospital in hospitals]

    def _process_safe_places(self, places: List[Dict]) -> List[Dict]:
        """Process safe places data"""
        return [{
            'name': place.get('business_name', 'Safe Place'),
            'type': place.get('business_type', 'Unknown'),
            'address': place.get('address', 'Unknown'),
            'hours': place.get('hours', '24/7'),
            'distance': place.get('distance', 'Unknown')
        } for place in places]

    def _get_fallback_emergency_guidance(self) -> Dict[str, Any]:
        """Provide fallback emergency guidance"""
        return {
            "guidance": [
                "Stay in a well-lit, public area",
                "Call 911 for immediate assistance",
                "Share your location with trusted contacts",
                "Move towards the nearest safe location"
            ],
            "actions": [
                "Dial 911",
                "Use emergency SOS on your phone",
                "Share live location",
                "Move to nearest safe space"
            ],
            "emergency_contacts": [
                "911 - Emergency Services",
                "415-553-0123 - SF",
                "415-553-0123 - SF Police Non-Emergency",
                "415-206-8000 - SF General Hospital",
                "415-353-6255 - UCSF Emergency"
            ]
        }