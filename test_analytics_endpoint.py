#!/usr/bin/env python3
import requests
import json

def test_analytics():
    try:
        response = requests.get('http://localhost:8000/api/ai/analytics/summary/')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Full response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == '__main__':
    test_analytics()
