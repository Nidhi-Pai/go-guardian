# backend/app/routes/emergency_routes.py

from flask import Blueprint, request, jsonify
from ..models import db, Alert, EmergencyContact
from datetime import datetime

emergency_bp = Blueprint('emergency', __name__)

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