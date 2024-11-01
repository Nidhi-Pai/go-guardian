# backend/app/routes/monitoring_routes.py

from flask import Blueprint, request, jsonify, current_app
from ..models import db
from ..services.monitoring_service import MonitoringService
from ..services.motion_detector import MotionDetector
from datetime import datetime
import logging

monitoring_bp = Blueprint('monitoring', __name__)
logger = logging.getLogger(__name__)

@monitoring_bp.route('/start', methods=['POST'])
async def start_monitoring():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        monitoring_service = MonitoringService(current_app.config['GEMINI_API_KEY'])
        result = await monitoring_service.start_monitoring(
            data['user_id'],
            data['route'],
            data.get('callback')
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Start monitoring error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@monitoring_bp.route('/update', methods=['POST'])
async def update_location():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        monitoring_service = MonitoringService(current_app.config['GEMINI_API_KEY'])
        result = await monitoring_service.update_location(
            data['user_id'],
            data['location']
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Location update error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@monitoring_bp.route('/motion', methods=['POST'])
async def analyze_motion():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        motion_detector = MotionDetector()
        result = motion_detector.analyze_motion(
            data['acceleration_data'],
            data['timestamp']
        )
        
        # If emergency detected, trigger monitoring service alert
        if result['is_emergency']:
            monitoring_service = MonitoringService(current_app.config['GEMINI_API_KEY'])
            alert_result = await monitoring_service.handle_sos(
                data['user_id'],
                data['location'],
                "Emergency detected from motion"
            )
            result['emergency_response'] = alert_result
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Motion analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@monitoring_bp.route('/stop', methods=['POST'])
async def stop_monitoring():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        monitoring_service = MonitoringService(current_app.config['GEMINI_API_KEY'])
        result = await monitoring_service.stop_monitoring(
            data['user_id']
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Stop monitoring error: {str(e)}")
        return jsonify({'error': str(e)}), 500