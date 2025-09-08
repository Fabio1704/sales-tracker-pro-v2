#!/usr/bin/env python3
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from accounts.models import User
from sales.models import ModelProfile, DailySale

def create_test_data():
    print("Creating test data...")
    
    # Créer ou récupérer un utilisateur test
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'is_staff': True,
            'is_active': True
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created user: {user.email}")
    else:
        print(f"Using existing user: {user.email}")
    
    # Créer des modèles de test
    models_data = [
        {'first_name': 'Emma', 'last_name': 'Johnson'},
        {'first_name': 'Sophie', 'last_name': 'Martin'},
        {'first_name': 'Clara', 'last_name': 'Wilson'},
    ]
    
    models = []
    for model_data in models_data:
        model, created = ModelProfile.objects.get_or_create(
            owner=user,
            first_name=model_data['first_name'],
            last_name=model_data['last_name']
        )
        models.append(model)
        if created:
            print(f"Created model: {model.first_name} {model.last_name}")
    
    # Créer des ventes pour les 30 derniers jours
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    current_date = start_date
    total_sales = 0
    
    while current_date <= end_date:
        for model in models:
            # 70% de chance d'avoir une vente par jour par modèle
            if random.random() < 0.7:
                amount = Decimal(str(random.uniform(50, 500)))
                
                sale, created = DailySale.objects.get_or_create(
                    model_profile=model,
                    date=current_date,
                    defaults={'amount_usd': amount}
                )
                
                if created:
                    total_sales += 1
        
        current_date += timedelta(days=1)
    
    print(f"Created {total_sales} sales records")
    
    # Afficher les statistiques
    print(f"\nStatistics:")
    print(f"Users: {User.objects.count()}")
    print(f"Models: {ModelProfile.objects.count()}")
    print(f"Sales: {DailySale.objects.count()}")
    print(f"Total revenue: ${DailySale.objects.aggregate(total=django.db.models.Sum('amount_usd'))['total'] or 0}")

if __name__ == '__main__':
    create_test_data()
