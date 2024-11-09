# backend/app/services/route_service.py

from typing import Dict, List, Any
import googlemaps
import google.generativeai as genai
from datetime import datetime
import numpy as np
from .safety_analyzer import SafetyAnalyzer
import logging

class RouteService:
    def __init__(self, gmaps_key: str, gemini_key: str):
        self.gmaps = googlemaps.Client(
            key=gmaps_key,
            requests_kwargs={
                'headers': {
                    'Referer': 'http://localhost:3000'
                }
            }
        )
        self.safety_analyzer = SafetyAnalyzer(gemini_key)
        self.logger = logging.getLogger(__name__)

    async def get_safe_route(
        self, 
        start: Dict[str, float], 
        end: Dict[str, float]
    ) -> Dict[str, Any]:
        """Get the safest route with safety analysis"""
        try:
            # Get multiple route options from Google Maps
            routes = self.gmaps.directions(
                (start['lat'], start['lng']),
                (end['lat'], end['lng']),
                mode="walking",
                alternatives=True
            )

            # Analyze safety for each route
            route_analyses = []
            for route in routes:
                safety_analysis = await self._analyze_route_safety(route)
                route_analyses.append({
                    'route': route,
                    'safety': safety_analysis
                })

            # Sort routes by safety score
            sorted_routes = sorted(
                route_analyses,
                key=lambda x: x['safety']['safety_score'],
                reverse=True
            )

            return {
                'routes': sorted_routes,
                'safest_route': sorted_routes[0] if sorted_routes else None,
                'alternatives': sorted_routes[1:],
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error getting safe route: {str(e)}")
            return {
                'error': 'Failed to calculate safe route',
                'timestamp': datetime.now().isoformat()
            }

    async def _analyze_route_safety(self, route: Dict) -> Dict[str, Any]:
        """Analyze safety of a specific route"""
        try:
            # Extract route points for analysis
            points = self._extract_route_points(route)
            
            # Get safety data for each point
            point_analyses = []
            for point in points:
                analysis = await self.safety_analyzer.analyze_route(
                    {'lat': point[0], 'lng': point[1]},
                    {'lat': point[0], 'lng': point[1]}
                )
                point_analyses.append(analysis)

            # Combine analyses into overall route safety
            return self._combine_safety_analyses(point_analyses)

        except Exception as e:
            self.logger.error(f"Error analyzing route safety: {str(e)}")
            return self._get_fallback_route_analysis()

    def _extract_route_points(self, route: Dict) -> List[List[float]]:
        """Extract key points along the route for analysis"""
        points = []
        steps = route['legs'][0]['steps']
        
        for step in steps:
            start = [
                step['start_location']['lat'],
                step['start_location']['lng']
            ]
            end = [
                step['end_location']['lat'],
                step['end_location']['lng']
            ]
            
            # Add intermediate points for long segments
            if 'distance' in step and step['distance']['value'] > 500:  # > 500m
                num_points = int(step['distance']['value'] / 500)
                for i in range(num_points):
                    lat = start[0] + (end[0] - start[0]) * (i + 1) / (num_points + 1)
                    lng = start[1] + (end[1] - start[1]) * (i + 1) / (num_points + 1)
                    points.append([lat, lng])
            else:
                points.append(start)
                points.append(end)

        return points

    def _combine_safety_analyses(
        self, 
        analyses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Combine multiple point safety analyses into route analysis"""
        if not analyses:
            return self._get_fallback_route_analysis()

        # Calculate average safety score
        safety_scores = [a['safety_score'] for a in analyses]
        avg_score = np.mean(safety_scores)

        # Combine risks and recommendations
        all_risks = set()
        all_recommendations = set()
        all_safe_spaces = set()

        for analysis in analyses:
            all_risks.update(analysis['risks'])
            all_recommendations.update(analysis['recommendations'])
            all_safe_spaces.update(analysis['safe_spaces'])

        return {
            'safety_score': round(avg_score, 2),
            'risk_level': self._get_risk_level(avg_score),
            'risks': list(all_risks)[:5],  # Top 5 risks
            'recommendations': list(all_recommendations)[:5],  # Top 5 recommendations
            'safe_spaces': list(all_safe_spaces),
            'score_breakdown': {
                'min': min(safety_scores),
                'max': max(safety_scores),
                'std': np.std(safety_scores)
            }
        }

    def _get_risk_level(self, safety_score: float) -> str:
        """Determine risk level from safety score"""
        if safety_score >= 75:
            return "low"
        elif safety_score >= 50:
            return "medium"
        else:
            return "high"

    def _get_fallback_route_analysis(self) -> Dict[str, Any]:
        """Provide fallback route analysis"""
        return {
            'safety_score': 50,
            'risk_level': 'medium',
            'risks': [
                'Limited data available for route',
                'Variable conditions possible',
                'Unknown areas present'
            ],
            'recommendations': [
                'Stay on main streets',
                'Maintain awareness of surroundings',
                'Share location with contacts',
                'Have emergency contacts ready'
            ],
            'safe_spaces': [
                'Major intersections',
                'Public transit stops',
                'Well-lit areas'
            ],
            'score_breakdown': {
                'min': 50,
                'max': 50,
                'std': 0
            }
        }