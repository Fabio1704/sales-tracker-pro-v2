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

def debug_insights():
    # Get test user
    user = User.objects.filter(email='test@example.com').first()
    if not user:
        print('No test user found')
        return

    print(f'User: {user.email}')

    # Check sales data
    sales = DailySale.objects.filter(model_profile__owner=user)
    print(f'Total sales: {sales.count()}')

    if not sales.exists():
        print('No sales data found')
        return

    # Check date ranges
    recent_sales = sales.filter(date__gte=timezone.now().date() - timedelta(days=7))
    previous_sales = sales.filter(
        date__gte=timezone.now().date() - timedelta(days=14),
        date__lt=timezone.now().date() - timedelta(days=7)
    )
    
    print(f'Recent sales (last 7 days): {recent_sales.count()}')
    print(f'Previous sales (7-14 days ago): {previous_sales.count()}')
    
    # Check existing insights
    existing_insights = AIInsight.objects.filter(user=user)
    print(f'Existing insights: {existing_insights.count()}')
    
    # Clear existing insights for fresh test
    existing_insights.delete()
    print('Cleared existing insights')
    
    # Test insights generation
    predictor = SalesPredictor(user)
    insights = predictor.analyze_sales_trends()
    print(f'Generated insights: {len(insights)}')
    
    for insight in insights:
        print(f'- {insight.title}: {insight.description}')

if __name__ == "__main__":
    debug_insights()
