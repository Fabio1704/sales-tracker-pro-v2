import psycopg2
from getpass import getpass

# Connexion à la base de données
DATABASE_URL = "postgresql://sales_user:2Y7qyr3ukVmkaQaK5UTjXSFW2UdzncNl@dpg-d3p62pu3jp1c739v4sr0-a.frankfurt-postgres.render.com/sales_db_5pmv"

print("=== Création d'un superutilisateur Django ===\n")

# Demander les informations
username = input("Username: ")
email = input("Email: ")
password = getpass("Password: ")
password_confirm = getpass("Password (confirmation): ")

if password != password_confirm:
    print("❌ Les mots de passe ne correspondent pas!")
    exit(1)

# Hasher le mot de passe (Django utilise PBKDF2)
from django.contrib.auth.hashers import make_password
hashed_password = make_password(password)

try:
    # Connexion à PostgreSQL
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Créer le superuser
    cursor.execute("""
        INSERT INTO auth_user (
            username, email, password, is_superuser, is_staff, is_active,
            first_name, last_name, date_joined
        ) VALUES (%s, %s, %s, TRUE, TRUE, TRUE, '', '', NOW())
        ON CONFLICT (username) DO NOTHING
        RETURNING id;
    """, (username, email, hashed_password))
    
    result = cursor.fetchone()
    conn.commit()
    
    if result:
        print(f"\n✅ Superutilisateur '{username}' créé avec succès!")
        print(f"   Email: {email}")
        print(f"\n   Vous pouvez maintenant vous connecter à:")
        print(f"   https://sales-tracker-backend-j0c0.onrender.com/admin/")
    else:
        print(f"\n⚠️ Un utilisateur avec le nom '{username}' existe déjà.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Erreur: {str(e)}")
    print("\nVeuillez installer psycopg2:")
    print("pip install psycopg2-binary")
