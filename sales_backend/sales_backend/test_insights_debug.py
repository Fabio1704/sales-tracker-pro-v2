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
from django.db.models import Sum, Avg

def debug_insights():
    # Get test user
    user = User.objects.filter(email='test@example.com').first()
    print('User:', user.email)

    # Clear existing insights
    AIInsight.objects.filter(user=user).delete()

    # Check sales data directly
    sales_data = DailySale.objects.filter(model_profile__owner=user)
    print('Sales data exists:', sales_data.exists())
    print('Sales count:', sales_data.count())

    if sales_data.exists():
        total_revenue = sales_data.aggregate(total=Sum('amount_usd'))['total']
        print('Total revenue:', total_revenue)
        
        # Try creating insight directly
        try:
            insight = AIInsight.objects.create(
                user=user,
                insight_type='summary',
                title="Test Insight",
                description="This is a test insight",
                priority='medium',
                confidence_score=0.9,
                data_payload={'test': 'data'}
            )
            print('Created insight:', insight.title)
            print('Insight ID:', insight.id)
        except Exception as e:
            print('Error creating insight:', str(e))
            import traceback
            traceback.print_exc()

        # Now test the predictor
        try:
            predictor = SalesPredictor(user)
            insights = predictor.analyze_sales_trends()
            print('Predictor generated insights:', len(insights))
        except Exception as e:
            print('Predictor error:', str(e))
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_insights()
