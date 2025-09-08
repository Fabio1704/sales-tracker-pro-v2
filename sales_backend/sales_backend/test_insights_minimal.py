#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from django.contrib.auth.models import User
from sales.models import ModelProfile, DailySale
from ai_engine.models import AIInsight
from django.db.models import Sum
from django.utils import timezone

def test_minimal():
    user = User.objects.filter(email='test@example.com').first()
    print('User:', user.email)
    
    # Clear existing insights
    AIInsight.objects.filter(user=user).delete()
    
    # Get sales data
    sales_data = DailySale.objects.filter(model_profile__owner=user)
    total_revenue = sales_data.aggregate(total=Sum('amount_usd'))['total'] or 0
    sales_count = sales_data.count()
    
    print(f'Sales: {sales_count}, Revenue: ${total_revenue:.2f}')
    
    # Create insight manually
    try:
        insight = AIInsight.objects.create(
            user=user,
            insight_type='summary',
            title='Performance Summary',
            description=f'Generated ${total_revenue:.2f} from {sales_count} sales',
            priority='medium',
            confidence_score=0.9,
            data_payload={'revenue': float(total_revenue), 'count': sales_count}
        )
        print('Created insight:', insight.title)
        
        # Verify it was saved
        saved_insights = AIInsight.objects.filter(user=user)
        print('Saved insights count:', saved_insights.count())
        
        return True
    except Exception as e:
        print('Error:', str(e))
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_minimal()
    print('Success:', success)
