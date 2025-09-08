#!/usr/bin/env python3
import os
import sys
import django
from datetime import datetime, timedelta

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from accounts.models import User
from ai_engine.ai_predictor_simple import SalesPredictor

def test_insights_generation():
    print("Testing insights generation...")
    
    # Récupérer l'utilisateur test
    user = User.objects.filter(email='test@example.com').first()
    if not user:
        print("No test user found")
        return
    
    print(f"Using user: {user.email}")
    
    # Créer le prédicteur et générer des insights
    predictor = SalesPredictor(user)
    try:
        insights = predictor.analyze_sales_trends()
        print(f"Generated {len(insights)} insights:")
        
        for insight in insights:
            print(f"- {insight.title}: {insight.description}")
            print(f"  Type: {insight.insight_type}, Priority: {insight.priority}")
            
    except Exception as e:
        print(f"Error generating insights: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_insights_generation()
