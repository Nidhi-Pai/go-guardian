# backend/app/services/voice_command.py

import google.generativeai as genai
from typing import Dict, Any
import logging
import json
from datetime import datetime

class VoiceCommandService:
    def __init__(self, api_key: str):
        self.logger = logging.getLogger(__name__)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Define command patterns
        self.command_patterns = {
            'emergency': ['help', 'sos', 'emergency', 'unsafe', 'danger'],
            'navigation': ['take', 'route', 'directions', 'way'],
            'safety_check': ['check', 'analyze', 'safe', 'look'],
            'contact': ['call', 'message', 'alert', 'notify']
        }

    async def process_command(
        self, 
        command: str,
        location: Dict[str, float]
    ) -> Dict[str, Any]:
        """Process voice command and determine action"""
        try:
            prompt = f"""
            Analyze this voice command: "{command}"
            User Location: Lat {location['lat']}, Lng {location['lng']}
            Time: {datetime.now().strftime('%H:%M')}

            Determine the user's intent and required actions.
            Return response as JSON with:
            {{
                "command_type": "emergency"|"navigation"|"safety_check"|"contact",
                "action_required": string,
                "parameters": object,
                "confirmation_required": boolean,
                "response_message": string
            }}
            """

            response = self.model.generate_content(prompt)
            return self._parse_response(response.text)

        except Exception as e:
            self.logger.error(f"Voice command processing error: {str(e)}")
            return self._get_fallback_response()

    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini's response into structured data"""
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                return json.loads(response[start_idx:end_idx])
            return self._get_fallback_response()
        except:
            return self._get_fallback_response()

    def _get_fallback_response(self) -> Dict[str, Any]:
        """Provide fallback response if processing fails"""
        return {
            "command_type": "unknown",
            "action_required": "confirm_intent",
            "parameters": {},
            "confirmation_required": True,
            "response_message": "I'm not sure what you need. Could you please repeat that?"
        }

    async def process_multilingual_command(
        self, 
        command: str,
        language: str,
        location: Dict[str, float]
    ) -> Dict[str, Any]:
        """Process voice commands in multiple languages"""
        try:
            prompt = f"""
            Analyze this voice command in {language}: "{command}"
            User Location: Lat {location['lat']}, Lng {location['lng']}
            Time: {datetime.now().strftime('%H:%M')}

            Translate the command to English if needed and determine:
            1. User's intent and emotional state
            2. Required safety actions
            3. Cultural context considerations
            4. Local emergency protocols

            Return response as JSON with:
            {{
                "original_language": string,
                "translated_command": string,
                "intent": string,
                "emotional_state": string,
                "cultural_context": string,
                "recommended_actions": [string],
                "local_emergency_info": object,
                "response_in_original_language": string
            }}
            """

            response = self.model.generate_content(prompt)
            return self._parse_response(response.text)
        except Exception as e:
            self.logger.error(f"Multilingual command processing error: {str(e)}")
            return self._get_fallback_response()