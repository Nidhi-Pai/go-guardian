# backend/app/routes/safety_routes.py

from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from ..services.gemini_service import GeminiService
from ..models import db, Alert, Route  # Add Route import here
from datetime import datetime
import re
import traceback
import logging
from typing import Dict, Any
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

safety_bp = Blueprint('safety', __name__)
gemini_service = GeminiService()

def parse_distance(distance_str: str) -> float:
    """Parse distance string to float value."""
    logger.debug(f"Parsing distance string: {distance_str}")
    try:
        distance_match = re.search(r'[\d.]+', str(distance_str))
        if not distance_match:
            logger.warning(f"No numeric value found in distance string: {distance_str}")
            return 0.0
        value = float(distance_match.group())
        logger.debug(f"Successfully parsed distance: {value}")
        return value
    except (ValueError, TypeError) as e:
        logger.error(f"Error parsing distance: {str(e)}")
        return 0.0

def prepare_route_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare route data for analysis."""
    logger.info("Preparing route data for analysis")
    try:
        route_data = {
            'start_location': str(data['start_location']),
            'end_location': str(data['end_location']),
            'current_time': datetime.now().isoformat(),
            'distance': str(data.get('distance', '0')),
            'time_of_day': datetime.now().strftime('%H:%M'),
            'weather': str(data.get('weather', 'Unknown'))
        }
        logger.debug(f"Prepared route data: {route_data}")
        return route_data
    except Exception as e:
        logger.error(f"Error preparing route data: {str(e)}")
        raise

@safety_bp.route('/analyze-route', methods=['POST'])
@cross_origin()
def analyze_route():
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['start_location', 'end_location']):
            return jsonify({
                'status': 'error',
                'error': 'Missing required location data'
            }), 400

        analysis = gemini_service.analyze_route(data)
        
        return jsonify({
            'status': 'success',
            'data': {
                'route_id': str(uuid.uuid4()),  # Generate a unique ID
                'analysis': {
                    'safety_score': analysis.get('safety_score', 70),
                    'risk_level': analysis.get('risk_level', 'medium'),
                    'primary_concerns': analysis.get('primary_concerns', []),
                    'recommendations': analysis.get('recommendations', []),
                    'safe_spots': analysis.get('safe_spots', []),
                    'emergency_resources': analysis.get('emergency_resources', []),
                    'safer_alternatives': analysis.get('safer_alternatives', []),
                    'confidence_score': analysis.get('confidence_score', 0.8)
                }
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@safety_bp.route('/active-route/<int:route_id>', methods=['GET', 'PUT', 'OPTIONS'])
@cross_origin()
def active_route(route_id):
    """Get or update active route information."""
    request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
    logger.info(f"[RequestID: {request_id}] Active route request for route_id: {route_id}")

    if request.method == 'OPTIONS':
        logger.debug(f"[RequestID: {request_id}] Handling OPTIONS request")
        return {'success': True}, 200
        
    try:
        route = Route.query.get_or_404(route_id)
        logger.debug(f"[RequestID: {request_id}] Found route: {route_id}")
        
        if request.method == 'GET':
            logger.info(f"[RequestID: {request_id}] Retrieving route information")
            response = {
                'status': 'success',
                'data': {
                    'id': route.id,
                    'start_location': route.start_location,
                    'end_location': route.end_location,
                    'start_time': route.start_time.isoformat(),
                    'safety_score': route.safety_score,
                    'status': route.status
                }
            }
            logger.debug(f"[RequestID: {request_id}] Returning route data: {response}")
            return jsonify(response)
        
        else:  # PUT
            logger.info(f"[RequestID: {request_id}] Updating route status")
            data = request.get_json()
            logger.debug(f"[RequestID: {request_id}] Update data: {data}")
            
            route.status = data.get('status', route.status)
            if data.get('status') == 'completed':
                route.end_time = datetime.now()
                logger.info(f"[RequestID: {request_id}] Marking route as completed")
            
            db.session.commit()
            logger.info(f"[RequestID: {request_id}] Successfully updated route")
            return jsonify({
                'status': 'success',
                'message': 'Route updated successfully'
            })
            
    except Exception as e:
        logger.error(f"[RequestID: {request_id}] Error handling route request: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@safety_bp.route('/analyze-area', methods=['POST', 'OPTIONS'])
@cross_origin()
def analyze_area():
    """Analyze safety of a specific area."""
    request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
    logger.info(f"[RequestID: {request_id}] New area analysis request received")

    if request.method == 'OPTIONS':
        logger.debug(f"[RequestID: {request_id}] Handling OPTIONS request")
        return {'success': True}, 200
        
    try:
        data = request.get_json()
        logger.info(f"[RequestID: {request_id}] Analyzing area with data: {data}")
        
        if not data or 'location' not in data:
            logger.warning(f"[RequestID: {request_id}] Missing location data")
            return jsonify({
                'status': 'error',
                'error': 'Location data required'
            }), 400
            
        analysis = gemini_service.analyze_area(data['location'])
        logger.debug(f"[RequestID: {request_id}] Area analysis result: {analysis}")
        
        response = {
            'status': 'success',
            'data': analysis
        }
        logger.info(f"[RequestID: {request_id}] Successfully analyzed area")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"[RequestID: {request_id}] Error analyzing area: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@safety_bp.route('/route-history', methods=['GET', 'OPTIONS'])
@cross_origin()
def route_history():
    """Get route history."""
    request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
    logger.info(f"[RequestID: {request_id}] Route history request received")

    if request.method == 'OPTIONS':
        logger.debug(f"[RequestID: {request_id}] Handling OPTIONS request")
        return {'success': True}, 200
        
    try:
        logger.info(f"[RequestID: {request_id}] Fetching route history")
        routes = Route.query.order_by(Route.created_at.desc()).limit(10).all()
        logger.debug(f"[RequestID: {request_id}] Found {len(routes)} routes")
        
        response = {
            'status': 'success',
            'data': {
                'routes': [{
                    'id': route.id,
                    'start_location': route.start_location,
                    'end_location': route.end_location,
                    'start_time': route.start_time.isoformat(),
                    'end_time': route.end_time.isoformat() if route.end_time else None,
                    'safety_score': route.safety_score,
                    'status': route.status
                } for route in routes]
            }
        }
        logger.info(f"[RequestID: {request_id}] Successfully retrieved route history")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"[RequestID: {request_id}] Error fetching route history: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500