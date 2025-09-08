# Sales Tracker Backend (Django + PostgreSQL)

Backend API pour le projet "Suivi annuel des ventes" — avec gestion des modèles (profils), saisie quotidienne, résumés hebdo/mensuels, statistiques et export PDF. Authentification via JWT, utilisateurs créés par l'admin.

## 1) Installation

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.sample .env
# Modifier .env (DB_NAME, DB_USER, DB_PASSWORD, ...)
```

Configurer PostgreSQL :
```sql
CREATE DATABASE sales_db;
CREATE USER postgres WITH PASSWORD 'postgres';  -- ou votre utilisateur
GRANT ALL PRIVILEGES ON DATABASE sales_db TO postgres;
```

## 2) Migrations & superuser

```bash
python manage.py migrate
python manage.py createsuperuser
```

## 3) Lancer le serveur

```bash
python manage.py runserver
```

## 4) Endpoints principaux

- Auth JWT :
  - `POST /api/accounts/token/`  (username, password)
  - `POST /api/accounts/token/refresh/`
  - `GET  /api/accounts/me/`

- Administration (admin uniquement) :
  - `GET/POST /api/accounts/users/`  (créer/superviser les utilisateurs)

- Modèles (profils) :
  - `GET/POST /api/models/`
  - `GET/PUT/PATCH/DELETE /api/models/{id}/`

- Ventes quotidiennes :
  - `GET/POST /api/daily-sales/`
  - `GET/PUT/PATCH/DELETE /api/daily-sales/{id}/`
  - `GET /api/daily-sales/summary/daily?model_id=ID`
  - `GET /api/daily-sales/summary/weekly?model_id=ID`
  - `GET /api/daily-sales/summary/monthly?model_id=ID`
  - `GET /api/daily-sales/stats?model_id=ID`
  - `GET /api/daily-sales/stats/pdf?model_id=ID` (téléchargement PDF)

## 5) Règles & Permissions

- Tous les endpoints nécessitent une authentification (`IsAuthenticated`).
- Un utilisateur **voit et modifie uniquement** ses modèles et leurs ventes.
- Un **admin** voit tout, peut créer/supprimer des utilisateurs via `/api/accounts/users/` ou via `/admin/`.

## 6) Fichiers upload

- Les photos de profil sont stockées dans `MEDIA_ROOT/profile_photos/...`.
- En dev (`DEBUG=True`), les fichiers sont servis par Django sur `/media/`.

## 7) Notes

- Les montants sont **toujours en USD** (`amount_usd`).
- Honoraires = 20% des ventes brutes ; Net = 80%.
- Le frontend peut afficher les modèles dans une navbar et appeler les endpoints ci-dessus.
- Pour la génération PDF, ce projet utilise **xhtml2pdf** (pur Python).