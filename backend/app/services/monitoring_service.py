# backend/app/services/monitoring_service.py

from typing import Dict, Any, Optional, Callable
import google.generativeai as genai
from datetime import datetime
import json
import asyncio
import logging
from .emergency_service import EmergencyService

class MonitoringService:
    def __init__(self, gemini_key: str):
        self.logger = logging.getLogger(__name__)
        self.emergency_service = EmergencyService(gemini_key)
        genai.configure(api_key=gemini_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Active monitoring sessions
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    async def start_monitoring(
        self,
        user_id: str,
        route: Dict[str, Any],
        callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """Start monitoring a user's journey"""
        try:
            session = {
                'user_id': user_id,
                'route': route,
                'start_time': datetime.now(),
                'last_update': datetime.now(),
                'status': 'active',
                'checkpoints': self._generate_checkpoints(route),
                'current_checkpoint': 0,
                'alerts': [],
                'callback': callback
            }

            self.active_sessions[user_id] = session
            
            # Start monitoring task
            asyncio.create_task(self._monitor_session(user_id))

            return {
                'session_id': user_id,
                'status': 'monitoring_started',
                'checkpoints': session['checkpoints'],
                'start_time': session['start_time'].isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error starting monitoring: {str(e)}")
            return {'error': 'Failed to start monitoring'}

    async def update_location(
        self,
        user_id: str,
        location: Dict[str, float]
    ) -> Dict[str, Any]:
        """Update user's location and check for safety"""
        try:
            if user_id not in self.active_sessions:
                return {'error': 'No active monitoring session'}

            session = self.active_sessions[user_id]
            session['last_update'] = datetime.now()
            
            # Check if location matches expected checkpoint
            safety_status = await self._check_safety(session, location)
            
            if safety_status['alert_level'] == 'high':
                await self._handle_safety_alert(user_id, location, safety_status)

            return {
                'status': 'location_updated',
                'safety': safety_status,
                'next_checkpoint': session['checkpoints'][session['current_checkpoint']]
            }

        except Exception as e:
            self.logger.error(f"Error updating location: {str(e)}")
            return {'error': 'Failed to update location'}

    async def handle_sos(
        self,
        user_id: str,
        location: Dict[str, float],
        report: str = None
    ) -> Dict[str, Any]:
        """Handle SOS signal from user"""
        try:
            # Get emergency response
            emergency_response = await self.emergency_service.handle_emergency(
                location,
                report
            )

            # Update session if exists
            if user_id in self.active_sessions:
                session = self.active_sessions[user_id]
                session['status'] = 'emergency'
                session['alerts'].append({
                    'type': 'sos',
                    'time': datetime.now().isoformat(),
                    'location': location,
                    'response': emergency_response
                })

                # Notify callback if registered
                if session.get('callback'):
                    session['callback']('sos_triggered', {
                        'user_id': user_id,
                        'location': location,
                        'timestamp': datetime.now().isoformat()
                    })

            return emergency_response

        except Exception as e:
            self.logger.error(f"Error handling SOS: {str(e)}")
            return await self.emergency_service._get_fallback_emergency_response()

    async def _monitor_session(self, user_id: str):
        """Background task to monitor user session"""
        while True:
            try:
                session = self.active_sessions.get(user_id)
                if not session or session['status'] != 'active':
                    break

                # Check for session timeout
                if (datetime.now() - session['last_update']).seconds > 300:  # 5 minutes
                    await self._handle_timeout(user_id)
                    break

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                self.logger.error(f"Error in monitoring task: {str(e)}")
                await asyncio.sleep(30)

    def _generate_checkpoints(self, route: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate monitoring checkpoints from route"""
        checkpoints = []
        if 'legs' in route and route['legs']:
            steps = route['legs'][0]['steps']
            for i, step in enumerate(steps):
                checkpoints.append({
                    'index': i,
                    'location': step['end_location'],
                    'instruction': step['html_instructions'],
                    'distance': step.get('distance', {}).get('text', 'unknown')
                })
        return checkpoints

    async def _check_safety(
        self,
        session: Dict[str, Any],
        location: Dict[str, float]
    ) -> Dict[str, Any]:
        """Check current location safety"""
        try:
            # Get current checkpoint
            checkpoint = session['checkpoints'][session['current_checkpoint']]
            
            # Calculate deviation from expected route
            deviation = self._calculate_deviation(
                location,
                checkpoint['location']
            )

            # Generate safety analysis prompt
            prompt = f"""
            Analyze real-time safety status:
            - Current location: {location}
            - Expected location: {checkpoint['location']}
            - Deviation: {deviation:.2f} meters
            - Time: {datetime.now().strftime('%H:%M')}
            
            Generate safety assessment as JSON with:
            {{
                "alert_level": "low"|"medium"|"high",
                "concerns": [string],
                "recommendations": [string]
            }}
            """

            response = self.model.generate_content(prompt)
            return json.loads(response.text)

        except Exception as e:
            self.logger.error(f"Error checking safety: {str(e)}")
            return {
                'alert_level': 'medium',
                'concerns': ['Unable to perform detailed safety check'],
                'recommendations': ['Stay aware of surroundings']
            }

    async def _handle_safety_alert(
        self,
        user_id: str,
        location: Dict[str, float],
        safety_status: Dict[str, Any]
    ):
        """Handle high-level safety alert"""
        try:
            session = self.active_sessions[user_id]
            alert = {
                'type': 'safety_alert',
                'time': datetime.now().isoformat(),
                'location': location,
                'status': safety_status
            }
            
            session['alerts'].append(alert)
            
            if session.get('callback'):
                session['callback']('safety_alert', alert)

        except Exception as e:
            self.logger.error(f"Error handling safety alert: {str(e)}")

    async def _handle_timeout(self, user_id: str):
        """Handle session timeout"""
        try:
            session = self.active_sessions[user_id]
            session['status'] = 'timeout'
            
            if session.get('callback'):
                session['callback']('session_timeout', {
                    'user_id': user_id,
                    'last_update': session['last_update'].isoformat(),
                    'timestamp': datetime.now().isoformat()
                })

        except Exception as e:
            self.logger.error(f"Error handling timeout: {str(e)}")
        finally:
            self.active_sessions.pop(user_id, None)

    def _calculate_deviation(
        self,
        current: Dict[str, float],
        expected: Dict[str, float]
    ) -> float:
        """Calculate deviation from expected route in meters"""
        # Simple Haversine distance calculation
        R = 6371e3  # Earth's radius in meters
        φ1 = np.radians(current['lat'])
        φ2 = np.radians(expected['lat'])
        Δφ = np.radians(expected['lat'] - current['lat'])
        Δλ = np.radians(expected['lng'] - current['lng'])

        a = (np.sin(Δφ/2) * np.sin(Δφ/2) +
             np.cos(φ1) * np.cos(φ2) *
             np.sin(Δλ/2) * np.sin(Δλ/2))
        
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))

        return R * c
</antArtif