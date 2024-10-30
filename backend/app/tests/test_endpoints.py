# test_endpoints.py
import requests
import json
import time
import os
import sys

# Get port from environment or default to 8000
PORT = int(os.environ.get('PORT', 8000))
BASE_URL = f'http://localhost:{PORT}'

def test_server_health():
    """Test if the server is up and running"""
    print("\nTesting Server Health")
    print("=" * 50)
    
    endpoints = [
        {'url': '/health', 'method': 'GET', 'name': 'Health Check'},
        {'url': '/api/safety/route-history', 'method': 'GET', 'name': 'Route History'},
    ]

    server_up = False
    
    for endpoint in endpoints:
        try:
            url = f"{BASE_URL}{endpoint['url']}"
            print(f"\nTesting {endpoint['name']}:")
            print(f"URL: {url}")
            print(f"Method: {endpoint['method']}")
            
            response = requests.request(
                method=endpoint['method'],
                url=url,
                headers={'Accept': 'application/json'},
                timeout=5
            )
            
            print(f"Status Code: {response.status_code}")
            print("Headers:", json.dumps(dict(response.headers), indent=2))
            
            try:
                print("Response:", json.dumps(response.json(), indent=2))
                server_up = True
            except json.JSONDecodeError:
                print("Raw Response:", response.text)
                
        except requests.exceptions.ConnectionError:
            print(f"Could not connect to {url}")
            print(f"Make sure the Flask server is running on port {PORT}")
        except requests.exceptions.Timeout:
            print(f"Request to {url} timed out")
        except Exception as e:
            print(f"Error testing {endpoint['name']}: {str(e)}")
    
    return server_up

def test_analyze_route():
    print("\nTesting Route Analysis")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "Simple Distance",
            "data": {
                "start_location": "123 Main St, San Francisco, CA",
                "end_location": "456 Market St, San Francisco, CA",
                "distance": "2.5",
                "weather": "Clear"
            }
        },
        {
            "name": "Distance with Unit",
            "data": {
                "start_location": "789 Market St, San Francisco, CA",
                "end_location": "321 Main St, San Francisco, CA",
                "distance": "2.5 km",
                "weather": "Cloudy"
            }
        }
    ]

    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        print("-" * 30)
        
        try:
            url = f'{BASE_URL}/api/safety/analyze-route'
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            print("\nRequest:")
            print("URL:", url)
            print("Headers:", json.dumps(headers, indent=2))
            print("Data:", json.dumps(test_case['data'], indent=2))
            
            response = requests.post(
                url, 
                json=test_case['data'], 
                headers=headers,
                timeout=10
            )
            
            print("\nResponse:")
            print("Status Code:", response.status_code)
            print("Headers:", json.dumps(dict(response.headers), indent=2))
            
            try:
                response_json = response.json()
                print("Body:", json.dumps(response_json, indent=2))
            except json.JSONDecodeError:
                print("Raw Body:", response.text)
            
            time.sleep(1)  # Brief pause between tests
            
        except requests.exceptions.ConnectionError:
            print(f"Connection Error: Could not connect to {url}")
            print(f"Make sure the Flask server is running on port {PORT}")
        except Exception as e:
            print(f"Error during test: {str(e)}")

def main():
    print(f"Starting tests against server at {BASE_URL}")
    print("=" * 50)
    
    # First test if server is up
    server_up = test_server_health()
    
    if not server_up:
        print("\nServer appears to be down. Please check if:")
        print("1. The Flask server is running")
        print(f"2. It's listening on port {PORT}")
        print("3. There are no firewall issues")
        print("\nExiting tests...")
        sys.exit(1)
    
    # If server is up, continue with route analysis tests
    test_analyze_route()

if __name__ == "__main__":
    main()