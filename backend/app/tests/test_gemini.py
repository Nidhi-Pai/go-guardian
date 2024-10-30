# test_gemini.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_gemini_key():
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in .env file")
        return False
    
    print(f"API Key found: {api_key[:4]}...{api_key[-4:]}")
    
    try:
        # Configure the library
        genai.configure(api_key=api_key)
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Test simple generation
        prompt = "Give me a one sentence response to test the connection."
        print("\nTesting API connection...")
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            print("✅ Gemini API test successful!")
            print(f"Test response: {response.text}")
            return True
        else:
            print("❌ Error: No response received")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Gemini API Key...")
    test_gemini_key()