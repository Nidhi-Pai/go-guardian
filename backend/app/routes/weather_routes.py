from flask import Blueprint, request, jsonify
from ..services.weather_service import WeatherService
import os

weather_bp = Blueprint('weather', __name__)
weather_service = WeatherService(os.getenv('WEATHER_API_KEY'))

@weather_bp.route('/alerts', methods=['GET'])
async def get_weather_alerts():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        
        alerts = await weather_service.get_weather_alerts(lat, lng)
        return jsonify(alerts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 