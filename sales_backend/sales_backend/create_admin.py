#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')
django.setup()

from django.contrib.auth.models import User

def create_admin_user():
    # Demander les informations à l'utilisateur
    email = input("Entrez votre email: ")
    username = input("Entrez votre nom d'utilisateur (ou laissez vide pour utiliser l'email): ")
    if not username:
        username = email
    
    password = input("Entrez votre mot de passe: ")
    
    # Vérifier si l'utilisateur existe déjà
    if User.objects.filter(email=email).exists():
        print(f"Un utilisateur avec l'email {email} existe déjà.")
        user = User.objects.get(email=email)
        
        # Mettre à jour les permissions admin
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        print(f"Utilisateur {email} mis à jour avec les permissions admin.")
    else:
        # Créer un nouvel utilisateur admin
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )
        print(f"Nouvel utilisateur admin créé: {email}")
    
    print(f"Vous pouvez maintenant vous connecter avec:")
    print(f"Email/Username: {email}")
    print(f"Mot de passe: [votre mot de passe]")
    print(f"Admin Django: https://sales-tracker-pro-v2.onrender.com/admin/")

if __name__ == "__main__":
    create_admin_user()
