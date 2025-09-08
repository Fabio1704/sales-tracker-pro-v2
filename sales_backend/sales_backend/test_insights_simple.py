#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from django.contrib.auth.models import User
from sales.models import ModelProfile, DailySale
from ai_engine.ai_predictor_simple import SalesPredictor
from ai_engine.models import AIInsight
from django.utils import timezone
from datetime import timedelta

def test_insights():
    # Get test user
    user = User.objects.filter(email='test@example.com').first()
    print('User:', user.email)

    # Clear existing insights
    AIInsight.objects.filter(user=user).delete()
    print('Cleared existing insights')

    # Check sales data
    sales = DailySale.objects.filter(model_profile__owner=user)
    print('Total sales:', sales.count())

    # Test insights generation
    try:
        predictor = SalesPredictor(user)
        insights = predictor.analyze_sales_trends()
        print('Generated insights:', len(insights))
        
        for insight in insights:
            print('- ' + insight.title + ': ' + insight.description)
            
        return len(insights) > 0
    except Exception as e:
        print('Error:', str(e))
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_insights()
    print('Success:', success)
