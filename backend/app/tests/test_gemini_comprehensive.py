# test_gemini_comprehensive.py
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
from datetime import datetime

class GeminiTester:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in .env file")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def test_route_analysis(self):
        print("\nTesting Route Analysis...")
        
        test_route = {
            'start_location': "123 Main St, San Francisco, CA",
            'end_location': "456 Market St, San Francisco, CA",
            'current_time': datetime.now().isoformat(),
            'distance': "2.5 km",
            'time_of_day': datetime.now().strftime('%H:%M'),
            'weather': "Clear"
        }
        
        prompt = f"""
        Analyze this walking route for safety:
        Start: {test_route['start_location']}
        End: {test_route['end_location']}
        Time: {test_route['time_of_day']}
        Distance: {test_route['distance']}
        
        Return analysis as JSON with:
        {{
            "safety_score": <0-100>,
            "risk_level": "low|medium|high",
            "recommendations": [<safety tips>]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            print("Response received:", response.text)
            
            # Try to parse JSON from response
            try:
                start_idx = response.text.find('{')
                end_idx = response.text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response.text[start_idx:end_idx]
                    analysis = json.loads(json_str)
                    print("✅ Successfully parsed JSON response:")
                    print(json.dumps(analysis, indent=2))
                    return True
            except json.JSONDecodeError:
                print("❌ Could not parse JSON from response")
                return False
                
        except Exception as e:
            print(f"❌ Error during route analysis: {str(e)}")
            return False

    def test_area_analysis(self):
        print("\nTesting Area Analysis...")
        
        test_location = {
            'lat': 37.7749,
            'lng': -122.4194
        }
        
        prompt = f"""
        Analyze the safety of this location:
        Coordinates: {test_location}
        
        Return analysis as JSON with:
        {{
            "area_safety_score": <0-100>,
            "immediate_risks": [<list of risks>],
            "recommendations": [<list of recommendations>]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            print("Response received:", response.text)
            return True
        except Exception as e:
            print(f"❌ Error during area analysis: {str(e)}")
            return False

    def run_all_tests(self):
        print(f"Running Gemini API tests with key: {self.api_key[:4]}...{self.api_key[-4:]}")
        
        tests = {
            "Route Analysis": self.test_route_analysis,
            "Area Analysis": self.test_area_analysis
        }
        
        results = {}
        for test_name, test_func in tests.items():
            print(f"\nRunning {test_name}...")
            try:
                success = test_func()
                results[test_name] = "✅ Passed" if success else "❌ Failed"
            except Exception as e:
                results[test_name] = f"❌ Error: {str(e)}"
        
        print("\nTest Results Summary:")
        print("=" * 50)
        for test_name, result in results.items():
            print(f"{test_name}: {result}")

if __name__ == "__main__":
    try:
        tester = GeminiTester()
        tester.run_all_tests()
    except Exception as e:
        print(f"❌ Setup Error: {str(e)}")