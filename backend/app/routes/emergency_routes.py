# backend/app/routes/emergency_routes.py

from flask import Blueprint, request, jsonify, current_app, make_response
from ..models import db, Alert, EmergencyContact
from datetime import datetime
from ..services.emergency_service import EmergencyService
from ..services.search_service import LocationSearchService
from ..services.sf_data_service import SFDataService
import os
from flask_cors import cross_origin

emergency_bp = Blueprint('emergency', __name__)
emergency_service = EmergencyService(api_key=os.getenv('GEMINI_API_KEY'))
sf_data_service = SFDataService()

@emergency_bp.route('/alert', methods=['POST'])
def create_alert():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Create new alert
        new_alert = Alert(
            user_id=1,  # Hardcoded for now
            type=data['type'],
            location=str(data['location']),
            description=data.get('description', ''),
            status='active'
        )
        
        db.session.add(new_alert)
        db.session.commit()
        
        # Get emergency contacts
        contacts = EmergencyContact.query.filter_by(user_id=1).all()  # Hardcoded user_id
        
        # In a real app, you would send actual notifications here
        # For now, we'll just return the alert details
        return jsonify({
            'status': 'success',
            'alert_id': new_alert.id,
            'message': 'Emergency alert created',
            'contacts_notified': len(contacts),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@emergency_bp.route('/alerts', methods=['GET'])
def get_alerts():
    try:
        alerts = Alert.query.order_by(Alert.created_at.desc()).all()
        return jsonify({
            'alerts': [{
                'id': alert.id,
                'type': alert.type,
                'location': alert.location,
                'description': alert.description,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
            } for alert in alerts]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@emergency_bp.route('/alert/<int:alert_id>', methods=['PUT'])
def update_alert(alert_id):
    try:
        alert = Alert.query.get_or_404(alert_id)
        data = request.get_json()
        
        alert.status = data.get('status', alert.status)
        if data.get('status') == 'resolved':
            alert.resolved_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Alert updated successfully',
            'alert_id': alert.id,
            'status': alert.status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@emergency_bp.route('/active-alerts', methods=['GET'])
def get_active_alerts():
    alerts = Alert.query.filter_by(status='active').order_by(Alert.created_at.desc()).all()
    return jsonify({
        'alerts': [{
            'id': alert.id,
            'type': alert.type,
            'location': alert.location,
            'description': alert.description,
            'created_at': alert.created_at.isoformat(),
            'status': alert.status
        } for alert in alerts]
    })

@emergency_bp.route('/contacts', methods=['GET', 'POST'])
def manage_contacts():
    if request.method == 'GET':
        contacts = EmergencyContact.query.all()
        return jsonify({
            'contacts': [{
                'id': contact.id,
                'name': contact.name,
                'phone': contact.phone,
                'email': contact.email,
                'relationship': contact.relationship,
                'is_primary': contact.is_primary
            } for contact in contacts]
        })
    
    else:  # POST
        try:
            data = request.get_json()
            new_contact = EmergencyContact(
                user_id=1,  # Hardcoded for now
                name=data['name'],
                phone=data['phone'],
                email=data.get('email'),
                relationship=data.get('relationship'),
                is_primary=data.get('is_primary', False)
            )
            
            db.session.add(new_contact)
            db.session.commit()
            
            return jsonify({
                'message': 'Emergency contact added successfully',
                'contact_id': new_contact.id
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@emergency_bp.route('/emergency-resources', methods=['POST'])
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
async def get_emergency_resources():
    try:
        data = request.get_json()
        location = data.get('location')
        
        if not location or 'lat' not in location or 'lng' not in location:
            current_app.logger.error(f"Invalid location data received: {location}")
            return jsonify({
                'error': 'Invalid location data',
                'police': [],
                'hospitals': [],
                'safe_places': [],
                'safety_metrics': {
                    'overall_score': 0,
                    'infrastructure': {
                        'coverage_score': 0,
                        'working_lights': 0,
                        'total_lights': 0
                    }
                }
            }), 400
            
        current_app.logger.info(f"Fetching emergency resources for location: {location}")
        
        # Get safety data from SFDataService
        safety_data = await sf_data_service.get_area_safety_data(
            lat=location['lat'],
            lng=location['lng'],
            radius_meters=1000,
            time_window_days=30
        )
        
        # Use LocationSearchService for place data
        search_service = LocationSearchService()
        resources = await search_service.search_nearby_places(
            "emergency services",
            location,
            radius_meters=1000
        )
        
        # Combine safety data with place results
        processed_resources = {
            'police': [],
            'hospitals': [],
            'safe_places': []
        }
        
        for place in resources:
            safety_score = safety_data.get('safety_score', 70)
            base_info = {
                'id': f"{place['name']}-{place['place_id']}",  # Add unique ID
                'name': place['name'],
                'address': place['formatted_address'],
                'distance': place['distance'],
                'safety_score': safety_score,
                'phone': place.get('phone', ''),
                'hours': place.get('hours', '')
            }
            
            if 'police' in place['name'].lower():
                processed_resources['police'].append({
                    **base_info,
                    'type': 'police',
                    'infrastructure': {
                        'total_lights': safety_data.get('infrastructure', {}).get('total_lights', 50),
                        'working_lights': safety_data.get('infrastructure', {}).get('working_lights', 42)
                    }
                })
            elif 'hospital' in place['name'].lower():
                processed_resources['hospitals'].append({
                    **base_info,
                    'type': 'hospital',
                    'emergency': True
                })
            else:
                processed_resources['safe_places'].append({
                    **base_info,
                    'type': 'safe_place'
                })
        
        # Add safety metrics to response
        response_data = {
            **processed_resources,
            'safety_metrics': {
                'overall_score': safety_data.get('safety_score', 85),
                'infrastructure': {
                    'coverage_score': safety_data.get('infrastructure', {}).get('coverage_score', 75),
                    'working_lights': safety_data.get('infrastructure', {}).get('working_lights', 42),
                    'total_lights': safety_data.get('infrastructure', {}).get('total_lights', 50)
                }
            }
        }
        
        current_app.logger.info(
            f"Found resources: Police: {len(processed_resources['police'])}, "
            f"Hospitals: {len(processed_resources['hospitals'])}, "
            f"Safe Places: {len(processed_resources['safe_places'])}"
        )
        
        return jsonify(response_data)
        
    except Exception as e:
        current_app.logger.error(f"Emergency resources error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'police': [],
            'hospitals': [],
            'safe_places': [],
            '_error': str(e)
        }), 500