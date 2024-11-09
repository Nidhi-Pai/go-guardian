# backend/app/services/safety_analyzer.py

import google.generativeai as genai
import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging
import json

class SafetyAnalyzer:
    def __init__(self, api_key: str):
        self.logger = logging.getLogger(__name__)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # SF Data API endpoints
        self.endpoints = {
            'crime': 'https://data.sfgov.org/resource/wg3w-h783.json',  # Police Incidents
            'lighting': 'https://data.sfgov.org/resource/vw6y-z8j6.json',  # Street Lights
            'businesses': 'https://data.sfgov.org/resource/g8m3-pdis.json',  # Business Locations
            'transit': 'https://data.sfgov.org/resource/rfx5-sfvq.json',  # Transit Stops
        }

    async def analyze_area(self, location: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze safety of a specific area"""
        try:
            # Collect data for the area
            area_data = await self._collect_area_data(location)
            
            # Generate safety analysis prompt
            prompt = self._create_area_safety_prompt(area_data)
            
            # Get Gemini's analysis
            response = self.model.generate_content(prompt)
            
            return self._process_gemini_response(response.text)
            
        except Exception as e:
            self.logger.error(f"Area analysis error: {str(e)}")
            return self._get_fallback_analysis()

    async def _collect_area_data(self, location: Dict[str, Any]) -> Dict[str, Any]:
        """Collect safety-related data for the area"""
        current_time = datetime.now()
        
        # Calculate bounding box for data collection
        min_lat = min(location['lat'], location['lat']) - 0.01
        max_lat = max(location['lat'], location['lat']) + 0.01
        min_lng = min(location['lng'], location['lng']) - 0.01
        max_lng = max(location['lng'], location['lng']) + 0.01
        
        # Fetch recent incidents
        incidents = requests.get(
            self.endpoints['crime'],
            params={
                '$where': f"""
                    latitude between {min_lat} and {max_lat}
                    AND longitude between {min_lng} and {max_lng}
                    AND date >= '{(current_time - timedelta(days=30)).strftime('%Y-%m-%d')}'
                """,
                '$limit': 1000
            }
        ).json()
        
        # Fetch street lights
        lights = requests.get(
            self.endpoints['lighting'],
            params={
                '$where': f"latitude between {min_lat} and {max_lat} AND longitude between {min_lng} and {max_lng}",
                '$limit': 1000
            }
        ).json()
        
        # Fetch safe spaces (businesses)
        businesses = requests.get(
            self.endpoints['businesses'],
            params={
                '$where': f"latitude between {min_lat} and {max_lat} AND longitude between {min_lng} and {max_lng}",
                '$limit': 1000
            }
        ).json()
        
        return {
            'incidents': self._process_incidents(incidents),
            'lighting': self._process_lighting(lights),
            'safe_spaces': self._process_businesses(businesses),
            'time_info': {
                'current_time': current_time.strftime('%H:%M'),
                'is_night': current_time.hour < 6 or current_time.hour > 18
            }
        }

    def _process_incidents(self, incidents: List[Dict]) -> Dict[str, Any]:
        """Process crime incidents data"""
        df = pd.DataFrame(incidents)
        if df.empty:
            return {'total': 0, 'categories': {}, 'time_distribution': {}}
        
        return {
            'total': len(df),
            'categories': df['incident_category'].value_counts().to_dict(),
            'time_distribution': {
                'day': len(df[df['incident_time'].between('06:00', '18:00')]),
                'night': len(df[~df['incident_time'].between('06:00', '18:00')])
            }
        }

    def _process_lighting(self, lights: List[Dict]) -> Dict[str, Any]:
        """Process street lighting data"""
        df = pd.DataFrame(lights)
        if df.empty:
            return {'total': 0, 'working': 0, 'coverage': 0}
        
        working_lights = len(df[df['status'] == 'WORKING'])
        
        return {
            'total': len(df),
            'working': working_lights,
            'coverage': (working_lights / len(df)) * 100 if len(df) > 0 else 0
        }

    def _process_businesses(self, businesses: List[Dict]) -> Dict[str, Any]:
        """Process business data to identify safe spaces"""
        safe_types = {'GROCERY', 'PHARMACY', 'HOTEL', 'RESTAURANT', 'BANK'}
        df = pd.DataFrame(businesses)
        if df.empty:
            return {'safe_spaces': [], 'density': 0}
        
        safe_spaces = df[df['business_type'].isin(safe_types)]
        
        return {
            'safe_spaces': safe_spaces[['business_name', 'address', 'business_type']].to_dict('records'),
            'density': len(safe_spaces) / ((df['latitude'].max() - df['latitude'].min()) * 111)
        }

    def _create_area_safety_prompt(self, data: Dict[str, Any]) -> str:
        """Create prompt for Gemini analysis"""
        return f"""
        Analyze the safety of this area in San Francisco.
        
        Current Conditions:
        - Time: {data['time_info']['current_time']}
        - Period: {'Night' if data['time_info']['is_night'] else 'Day'}
        
        Safety Data:
        - Recent Incidents: {data['incidents']['total']}
        - Street Lighting: {data['lighting']['working']} working lights ({data['lighting']['coverage']:.1f}% coverage)
        - Safe Spaces: {len(data['safe_spaces']['safe_spaces'])} locations
        
        Provide a safety analysis with:
        1. Overall safety score (0-100)
        2. Specific risks and their locations
        3. Recommended precautions
        4. Safe spaces in the area
        5. Emergency resources
        
        Format the response as JSON with these exact keys:
        {
            "safety_score": number,
            "risk_level": "low"|"medium"|"high",
            "risks": [string],
            "recommendations": [string],
            "safe_spaces": [string],
            "emergency_resources": [string]
        }
        """

    def _process_gemini_response(self, response: str) -> Dict[str, Any]:
        """Process Gemini's response into structured data"""
        try:
            # Extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                return json.loads(response[start_idx:end_idx])
            return self._get_fallback_analysis()
        except:
            return self._get_fallback_analysis()

    def _get_fallback_analysis(self) -> Dict[str, Any]:
        """Provide fallback analysis if AI processing fails"""
        return {
            "safety_score": 70,
            "risk_level": "medium",
            "risks": [
                "Limited visibility in some areas",
                "Variable pedestrian traffic",
                "Distance from public transit"
            ],
            "recommendations": [
                "Stay on well-lit main streets",
                "Share location with trusted contacts",
                "Keep emergency contacts readily available",
                "Use ride-sharing services if possible"
            ],
            "safe_spaces": [
                "Nearby 24/7 businesses",
                "Transit stations",
                "Police stations"
            ],
            "emergency_resources": [
                "Local police department",
                "Hospital emergency rooms",
                "24-hour pharmacies"
            ]
        }