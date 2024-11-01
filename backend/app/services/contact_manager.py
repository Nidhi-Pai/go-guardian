# backend/app/services/contact_manager.py

from typing import Dict, List, Any
import logging
from datetime import datetime
import json
import sqlite3

class ContactManager:
    def __init__(self, db_path: str = "app.db"):
        self.logger = logging.getLogger(__name__)
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS emergency_contacts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        phone TEXT NOT NULL,
                        email TEXT,
                        relationship TEXT,
                        priority INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS alert_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        contact_id INTEGER,
                        alert_type TEXT NOT NULL,
                        message TEXT,
                        status TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (contact_id) REFERENCES emergency_contacts (id)
                    )
                """)
        except Exception as e:
            self.logger.error(f"Database initialization error: {str(e)}")

    async def add_contact(self, user_id: str, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add new emergency contact"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    INSERT INTO emergency_contacts 
                    (user_id, name, phone, email, relationship, priority)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    contact_data['name'],
                    contact_data['phone'],
                    contact_data.get('email'),
                    contact_data.get('relationship'),
                    contact_data.get('priority', 0)
                ))
                
                return {
                    'contact_id': cursor.lastrowid,
                    'status': 'success',
                    'message': 'Contact added successfully'
                }

        except Exception as e:
            self.logger.error(f"Error adding contact: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    async def get_contacts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all emergency contacts for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT * FROM emergency_contacts 
                    WHERE user_id = ? 
                    ORDER BY priority DESC, created_at ASC
                """, (user_id,))
                
                return [dict(row) for row in cursor.fetchall()]

        except Exception as e:
            self.logger.error(f"Error getting contacts: {str(e)}")
            return []

    async def send_emergency_alert(
        self,
        user_id: str,
        location: Dict[str, float],
        message: str = None
    ) -> Dict[str, Any]:
        """Send emergency alert to all contacts"""
        try:
            contacts = await self.get_contacts(user_id)
            
            if not contacts:
                return {
                    'status': 'error',
                    'message': 'No emergency contacts found'
                }

            alerts_sent = []
            for contact in contacts:
                alert = {
                    'user_id': user_id,
                    'contact_id': contact['id'],
                    'alert_type': 'emergency',
                    'message': message or 'Emergency alert triggered',
                    'status': 'sent',
                    'location': location,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Log alert
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT INTO alert_history 
                        (user_id, contact_id, alert_type, message, status)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        user_id,
                        contact['id'],
                        'emergency',
                        alert['message'],
                        'sent'
                    ))
                
                alerts_sent.append(alert)

            return {
                'status': 'success',
                'alerts_sent': len(alerts_sent),
                'details': alerts_sent
            }

        except Exception as e:
            self.logger.error(f"Error sending emergency alert: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    async def get_alert_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get alert history for a user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT ah.*, ec.name as contact_name, ec.phone as contact_phone
                    FROM alert_history ah
                    LEFT JOIN emergency_contacts ec ON ah.contact_id = ec.id
                    WHERE ah.user_id = ?
                    ORDER BY ah.created_at DESC
                    LIMIT ?
                """, (user_id, limit))
                
                return [dict(row) for row in cursor.fetchall()]

        except Exception as e:
            self.logger.error(f"Error getting alert history: {str(e)}")
            return []