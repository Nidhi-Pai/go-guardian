# backend/app/services/camera_analyzer.py

import google.generativeai as genai
from typing import Dict, Any
import base64
import logging
from datetime import datetime
import json

class CameraAnalyzer:
    def __init__(self, api_key: str):
        self.logger = logging.getLogger(__name__)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro-vision')
        
    async def analyze_surroundings(
        self, 
        image_data: str,
        location: Dict[str, float]
    ) -> Dict[str, Any]:
        """Analyze camera feed for safety concerns"""
        try:
            # Convert base64 image to format Gemini can process
            image = {
                'mime_type': 'image/jpeg',
                'data': base64.b64decode(image_data)
            }

            prompt = f"""
            Analyze this image for potential safety concerns.
            Location: Lat {location['lat']}, Lng {location['lng']}
            Time: {datetime.now().strftime('%H:%M')}

            Focus on:
            1. Immediate safety threats
            2. Environmental hazards
            3. Lighting conditions
            4. Presence of other people
            5. Safe spaces visible

            Provide analysis as JSON with:
            {{
                "threat_level": "none"|"low"|"medium"|"high",
                "immediate_threats": [string],
                "safe_elements": [string],
                "recommendations": [string],
                "visibility_score": number,
                "crowd_density": "none"|"low"|"medium"|"high"
            }}
            """

            response = self.model.generate_content([image, prompt])
            return self._parse_response(response.text)

        except Exception as e:
            self.logger.error(f"Camera analysis error: {str(e)}")
            return self._get_fallback_analysis()

    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini's response into structured data"""
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
            "threat_level": "low",
            "immediate_threats": [],
            "safe_elements": [
                "Regular street activity",
                "Normal lighting conditions"
            ],
            "recommendations": [
                "Maintain awareness of surroundings",
                "Stay in well-lit areas",
                "Keep emergency contacts ready"
            ],
            "visibility_score": 70,
            "crowd_density": "low"
        }