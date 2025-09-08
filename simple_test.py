import requests

print("Testing AI Assistant...")
try:
    response = requests.post("http://localhost:8000/api/ai/test/assistant/", 
                           json={"message": "Test message"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\nTesting AI Insights...")
try:
    response = requests.post("http://localhost:8000/api/ai/test/insights/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
