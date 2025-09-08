#!/usr/bin/env python3
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from accounts.models import User
from sales.models import ModelProfile, DailySale

def assign_data_to_first_user():
    print("Assigning test data to first user...")
    
    # Récupérer le premier utilisateur (celui connecté dans l'interface)
    first_user = User.objects.filter(is_staff=True).first()
    if not first_user:
        print("No staff user found")
        return
    
    print(f"First staff user: {first_user.email}")
    
    # Récupérer l'utilisateur test avec les données
    test_user = User.objects.filter(email='test@example.com').first()
    if not test_user:
        print("No test user found")
        return
    
    # Transférer tous les modèles vers le premier utilisateur
    models = ModelProfile.objects.filter(owner=test_user)
    updated_count = models.update(owner=first_user)
    print(f"Transferred {updated_count} models to {first_user.email}")
    
    # Vérifier les statistiques
    user_models = ModelProfile.objects.filter(owner=first_user).count()
    user_sales = DailySale.objects.filter(model_profile__owner=first_user).count()
    
    print(f"User {first_user.email} now has:")
    print(f"- Models: {user_models}")
    print(f"- Sales: {user_sales}")

if __name__ == '__main__':
    assign_data_to_first_user()
