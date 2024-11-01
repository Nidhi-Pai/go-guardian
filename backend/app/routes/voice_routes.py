# backend/app/routes/voice_routes.py

from flask import Blueprint, request, jsonify, current_app
from ..models import db
from ..services.voice_command import VoiceCommandService
from datetime import datetime
import logging

voice_bp = Blueprint('voice', __name__)
logger = logging.getLogger(__name__)

@voice_bp.route('/process', methods=['POST'])
async def process_command():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        voice_service = VoiceCommandService(current_app.config['GEMINI_API_KEY'])
        result = await voice_service.process_command(
            data['command'],
            data['location']
        )
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Voice command error: {str(e)}")
        return jsonify({'error': str(e)}), 500