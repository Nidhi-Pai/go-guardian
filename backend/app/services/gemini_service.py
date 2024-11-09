# backend/app/services/gemini_service.py

import google.generativeai as genai
import os
from typing import Dict, List, Any
import json
from datetime import datetime

class GeminiServiceError(Exception):
    """Custom exception for GeminiService errors"""
    pass

class GeminiService:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Gemini API key is required")
        genai.configure(api_key=api_key)
        self.text_model = genai.GenerativeModel('gemini-pro')
        self.vision_model = genai.GenerativeModel('gemini-pro-vision')
        
        # Configure generation parameters
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

    def analyze_route(self, route_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze route safety using Gemini Pro."""
        try:
            current_hour = datetime.now().hour
            time_context = "during daylight hours" if 6 <= current_hour <= 18 else "during night hours"
            
            prompt = f"""
            You are a safety analysis expert. Analyze this walking route {time_context}.
            
            Route Details:
            - Starting Point: {route_data['start_location']}
            - Destination: {route_data['end_location']}
            - Time: {route_data['time_of_day']}
            - Distance: {route_data['distance']}
            - Weather: {route_data.get('weather', 'Unknown')}
            
            Considering the current time ({time_context}), provide a comprehensive safety assessment.
            Focus on:
            1. Route characteristics (main vs side streets, visibility)
            2. Area safety statistics and known risk factors
            3. Public transportation and emergency service access
            4. Pedestrian activity and natural surveillance
            5. Environmental factors (lighting, weather impact)
            
            Return a detailed JSON with this exact structure:
            {{
                "safety_score": <number 0-100>,
                "risk_level": <"low"|"medium"|"high">,
                "primary_concerns": [<list of top 3 safety concerns>],
                "recommendations": [<list of 3-5 specific safety tips>],
                "safe_spots": [<list of safe locations along route>],
                "emergency_resources": [<list of nearby emergency services>],
                "safer_alternatives": [<optional safer route suggestions>],
                "confidence_score": <number 0.0-1.0>
            }}
            
            Focus on practical, actionable safety insights.
            """
            response = self.text_model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            if not response or not response.text:
                return self._get_fallback_analysis()
                
            return self._parse_response(response.text)
            
        except Exception as e:
            print(f"Error in analyze_route: {e}")
            return self._get_fallback_analysis()

    def analyze_area(self, location: Dict[str, float]) -> Dict[str, Any]:
        """Analyze area safety using Gemini Pro."""
        try:
            current_hour = datetime.now().hour
            time_context = "during daylight hours" if 6 <= current_hour <= 18 else "during night hours"
            
            prompt = f"""
            Analyze the immediate safety of this location {time_context}:
            Coordinates: Lat {location.get('lat')}, Lng {location.get('lng')}
            
            Provide a detailed safety assessment focusing on:
            1. Area characteristics and safety profile
            2. Current time and environmental conditions
            3. Nearby safe spaces and emergency services
            4. Public transportation access
            5. General safety recommendations
            
            Return analysis as JSON with this exact structure:
            {{
                "area_safety_score": <number 0-100>,
                "risk_level": <"low"|"medium"|"high">,
                "immediate_risks": [<list of current safety concerns>],
                "safe_spaces": [<list of nearby safe locations>],
                "recommended_actions": [<list of immediate safety steps>],
                "emergency_services": [<list of nearby emergency resources>],
                "confidence_score": <number 0.0-1.0>
            }}
            """

            response = self.text_model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            if not response or not response.text:
                return self._get_fallback_area_analysis()
                
            return self._parse_response(response.text)
            
        except Exception as e:
            print(f"Error in analyze_area: {e}")
            return self._get_fallback_area_analysis()

    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Parse Gemini response and extract JSON."""
        try:
            # Find JSON in response
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)
            return self._get_fallback_analysis()
        except json.JSONDecodeError:
            return self._get_fallback_analysis()

    def _get_fallback_analysis(self) -> Dict[str, Any]:
        """Provide fallback route analysis if AI fails."""
        return {
            "safety_score": 70,
            "risk_level": "medium",
            "primary_concerns": [
                "Limited visibility in some areas",
                "Variable pedestrian traffic",
                "Weather conditions may affect safety"
            ],
            "recommendations": [
                "Stay on well-lit main streets",
                "Share location with trusted contacts",
                "Keep emergency contacts readily available",
                "Use public transportation when possible"
            ],
            "safe_spots": [
                "24/7 convenience stores",
                "Police stations",
                "Hospital emergency rooms"
            ],
            "emergency_resources": [
                "Local police station",
                "Emergency room",
                "24/7 pharmacy"
            ],
            "safer_alternatives": [
                "Consider using main streets",
                "Use well-lit routes"
            ],
            "confidence_score": 0.8
        }

    def _get_fallback_area_analysis(self) -> Dict[str, Any]:
        """Provide fallback area analysis if AI fails."""
        return {
            "area_safety_score": 65,
            "risk_level": "medium",
            "immediate_risks": [
                "Limited lighting conditions",
                "Low pedestrian activity",
                "Distance from emergency services"
            ],
            "safe_spaces": [
                "Local businesses",
                "Public buildings",
                "Transportation hubs"
            ],
            "recommended_actions": [
                "Stay in well-lit areas",
                "Keep to main pathways",
                "Stay aware of surroundings",
                "Have emergency contacts ready"
            ],
            "emergency_services": [
                "Police station within 2km",
                "Hospital within 3km",
                "24/7 pharmacy nearby"
            ],
            "confidence_score": 0.7
        }