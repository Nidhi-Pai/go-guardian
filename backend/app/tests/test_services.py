# tests/test_services.py

import asyncio
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from pprint import pprint

# Import our services
from app.services.safety_analyzer import SafetyAnalyzer
from app.services.emergency_service import EmergencyService
from app.services.route_service import RouteService
from app.services.monitoring_service import MonitoringService

# Load environment variables
load_dotenv()

class ServiceTester:
    def __init__(self):
        # Get API keys from environment
        self.gemini_key = os.getenv('GEMINI_API_KEY')
        self.gmaps_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        # Test locations in San Francisco
        self.test_locations = {
            'ferry_building': {'lat': 37.7955, 'lng': -122.3937},
            'mission_district': {'lat': 37.7599, 'lng': -122.4148},
            'financial_district': {'lat': 37.7946, 'lng': -122.3999},
            'castro': {'lat': 37.7609, 'lng': -122.4350}
        }
        
        # Initialize services
        self.safety_analyzer = SafetyAnalyzer(self.gemini_key)
        self.emergency_service = EmergencyService(self.gemini_key)
        self.route_service = RouteService(self.gmaps_key, self.gemini_key)
        self.monitoring_service = MonitoringService(self.gemini_key)

    async def run_all_tests(self):
        """Run all service tests"""
        print("\n=== Starting Service Tests ===\n")
        
        try:
            await self.test_safety_analyzer()
            await self.test_emergency_service()
            await self.test_route_service()
            await self.test_monitoring_service()
            
            print("\n=== All Tests Completed ===\n")
        except Exception as e:
            print(f"\n❌ Error running tests: {str(e)}")

    async def test_safety_analyzer(self):
        """Test SafetyAnalyzer service"""
        print("\n1. Testing Safety Analyzer...")
        
        try:
            # Test area safety analysis
            result = await self.safety_analyzer.analyze_route(
                self.test_locations['mission_district'],
                self.test_locations['financial_district']
            )
            
            print("\n✅ Safety Analysis Result:")
            pprint(result)
            
            # Verify result structure
            assert 'safety_score' in result, "Missing safety score"
            assert 'risk_level' in result, "Missing risk level"
            assert 'risks' in result, "Missing risks"
            
            print("\n✅ Safety Analyzer Test: PASSED")
            
        except Exception as e:
            print(f"\n❌ Safety Analyzer Test Failed: {str(e)}")

    async def test_emergency_service(self):
        """Test EmergencyService"""
        print("\n2. Testing Emergency Service...")
        
        try:
            # Test emergency response
            result = await self.emergency_service.handle_emergency(
                self.test_locations['mission_district'],
                "Feeling unsafe, need assistance"
            )
            
            print("\n✅ Emergency Response Result:")
            pprint(result)
            
            # Verify result structure
            assert 'guidance' in result, "Missing guidance"
            assert 'resources' in result, "Missing resources"
            assert 'immediate_actions' in result, "Missing actions"
            
            print("\n✅ Emergency Service Test: PASSED")
            
        except Exception as e:
            print(f"\n❌ Emergency Service Test Failed: {str(e)}")

    async def test_route_service(self):
        """Test RouteService"""
        print("\n3. Testing Route Service...")
        
        try:
            # Test safe route calculation
            result = await self.route_service.get_safe_route(
                self.test_locations['castro'],
                self.test_locations['financial_district']
            )
            
            print("\n✅ Safe Route Result:")
            pprint(result)
            
            # Verify result structure
            assert 'routes' in result, "Missing routes"
            assert 'safest_route' in result, "Missing safest route"
            
            print("\n✅ Route Service Test: PASSED")
            
        except Exception as e:
            print(f"\n❌ Route Service Test Failed: {str(e)}")

    async def test_monitoring_service(self):
        """Test MonitoringService"""
        print("\n4. Testing Monitoring Service...")
        
        try:
            # Test callback function
            def alert_callback(event_type, data):
                print(f"\nReceived {event_type} event:")
                pprint(data)

            # Start monitoring session
            user_id = "test_user_123"
            route = {
                'legs': [{
                    'steps': [
                        {
                            'end_location': self.test_locations['financial_district'],
                            'html_instructions': 'Walk to Financial District',
                            'distance': {'text': '1.2 km'}
                        }
                    ]
                }]
            }
            
            # Start monitoring
            start_result = await self.monitoring_service.start_monitoring(
                user_id,
                route,
                alert_callback
            )
            
            print("\n✅ Monitoring Start Result:")
            pprint(start_result)
            
            # Test location update
            update_result = await self.monitoring_service.update_location(
                user_id,
                self.test_locations['mission_district']
            )
            
            print("\n✅ Location Update Result:")
            pprint(update_result)
            
            # Test SOS trigger
            sos_result = await self.monitoring_service.handle_sos(
                user_id,
                self.test_locations['mission_district'],
                "Test emergency alert"
            )
            
            print("\n✅ SOS Trigger Result:")
            pprint(sos_result)
            
            print("\n✅ Monitoring Service Test: PASSED")
            
        except Exception as e:
            print(f"\n❌ Monitoring Service Test Failed: {str(e)}")

def main():
    # Create .env file if it doesn't exist
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write("""# Add your API keys here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
""")
        print("\n⚠️ Created .env file. Please add your API keys before running tests.")
        return

    # Run tests
    tester = ServiceTester()
    asyncio.run(tester.run_all_tests())

if __name__ == "__main__":
    main()