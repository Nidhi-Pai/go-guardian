# backend/app/routes/safety_routes.py

from flask import Blueprint, request, jsonify
from ..services.gemini_service import GeminiService
from ..models import db, Alert
from datetime import datetime
import re
import traceback

safety_bp = Blueprint('safety', __name__)
gemini_service = GeminiService()

@safety_bp.route('/analyze-route', methods=['POST'])
def analyze_route():
    try:
        # Get and validate request data
        data = request.get_json()
        print("Raw request data:", data)
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['start_location', 'end_location', 'distance']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            # Parse distance value
            distance_str = str(data['distance'])
            distance_match = re.search(r'[\d.]+', distance_str)
            if not distance_match:
                return jsonify({'error': 'Invalid distance format'}), 400
            
            distance_value = float(distance_match.group())
            print(f"Parsed distance value: {distance_value}")
        except Exception as e:
            print(f"Distance parsing error: {str(e)}")
            distance_value = 0.0

        try:
            # Prepare route data
            route_data = {
                'start_location': str(data['start_location']),
                'end_location': str(data['end_location']),
                'current_time': datetime.now().isoformat(),
                'distance': str(distance_value),
                'time_of_day': datetime.now().strftime('%H:%M'),
                'weather': str(data.get('weather', 'Unknown'))
            }
            print("Prepared route data:", route_data)

        except Exception as e:
            print(f"Error preparing route data: {str(e)}")
            traceback.print_exc()
            return jsonify({'error': 'Error preparing route data'}), 500

        try:
            # Get AI analysis
            analysis = gemini_service.analyze_route(route_data)
            print("AI analysis result:", analysis)

            if not isinstance(analysis, dict):
                return jsonify({'error': 'Invalid analysis result format'}), 500

        except Exception as e:
            print(f"AI analysis error: {str(e)}")
            traceback.print_exc()
            return jsonify({'error': 'Error during AI analysis'}), 500

        try:
            # Save to database
            new_route = Route(
                user_id=1,
                start_location=str(data['start_location']),
                end_location=str(data['end_location']),
                start_time=datetime.now(),
                distance=distance_value,
                safety_score=analysis.get('safety_score', 0),
                status='active'
            )
            
            db.session.add(new_route)
            db.session.commit()
            print("Successfully saved to database")

        except Exception as e:
            print(f"Database error: {str(e)}")
            traceback.print_exc()
            db.session.rollback()
            return jsonify({'error': 'Database error'}), 500

        # Return successful response
        response_data = {
            'route_id': new_route.id,
            'analysis': analysis,
            'distance': distance_value
        }
        print("Final response data:", response_data)
        return jsonify(response_data)

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@safety_bp.route('/active-route/<int:route_id>', methods=['GET', 'PUT'])
def active_route(route_id):
    route = Route.query.get_or_404(route_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': route.id,
            'start_location': route.start_location,
            'end_location': route.end_location,
            'start_time': route.start_time.isoformat(),
            'safety_score': route.safety_score,
            'status': route.status
        })
    
    else:  # PUT - Update route status
        try:
            data = request.get_json()
            route.status = data.get('status', route.status)
            if data.get('status') == 'completed':
                route.end_time = datetime.now()
            
            db.session.commit()
            return jsonify({'message': 'Route updated successfully'})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@safety_bp.route('/analyze-area', methods=['POST'])
def analyze_area():
    try:
        data = request.get_json()
        location = data['location']
        
        # Get area safety analysis
        analysis = gemini_service.analyze_area(location)
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@safety_bp.route('/route-history', methods=['GET'])
def route_history():
    routes = Route.query.order_by(Route.created_at.desc()).limit(10).all()
    return jsonify({
        'routes': [{
            'id': route.id,
            'start_location': route.start_location,
            'end_location': route.end_location,
            'start_time': route.start_time.isoformat(),
            'end_time': route.end_time.isoformat() if route.end_time else None,
            'safety_score': route.safety_score,
            'status': route.status
        } for route in routes]
    })