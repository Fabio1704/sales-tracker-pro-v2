import re
import socket
import smtplib
import dns.resolver
import requests
from django.core.exceptions import ValidationError
from django.core.validators import validate_email as django_validate_email
import logging

logger = logging.getLogger(__name__)

def validate_real_email(email):
    """
    Validateur d'email TRÈS STRICT - N'accepte QUE les emails Gmail valides
    """
    if not email:
        raise ValidationError("Email requis")
    
    # 1. Validation du format de base
    try:
        django_validate_email(email)
    except ValidationError:
        raise ValidationError("Format d'email invalide")
    
    # 2. Extraction du domaine
    try:
        local_part, domain = email.split('@')
        domain = domain.lower()
    except ValueError:
        raise ValidationError("Format d'email invalide")
    
    # 3. SEULS LES EMAILS GMAIL SONT ACCEPTÉS
    if domain not in ['gmail.com', 'googlemail.com']:
        raise ValidationError(f"Seuls les emails Gmail (@gmail.com) sont autorisés. Le domaine '{domain}' n'est pas accepté.")
    
    # 4. Validation stricte pour Gmail
    if not validate_gmail_email_strict(email):
        raise ValidationError(f"L'adresse Gmail '{email}' est suspecte ou invalide")
    
    return email.lower()

def check_domain_exists(domain):
    """Vérifie si le domaine a des enregistrements MX"""
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        return len(mx_records) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, Exception):
        return False

def validate_gmail_email_strict(email):
    """Validation TRÈS STRICTE pour Gmail - détecte tous les emails suspects"""
    local_part = email.split('@')[0].lower()
    
    # Patterns d'emails Gmail INTERDITS (liste étendue)
    forbidden_patterns = [
        'test', 'fake', 'invalid', 'example', 'dummy', 'sample',
        'nonexistent', 'notreal', 'fictif', 'bidon', 'inexistant',
        'faux', 'temporaire', 'temp', 'throwaway', 'spam', 'trash',
        'delete', 'remove', 'admin', 'root', 'user', 'guest',
        'anonymous', 'nobody', 'null', 'void', 'empty', 'blank',
        'random', 'generic', 'default', 'placeholder', 'mock',
        'trial', 'demo', 'prototype', 'beta', 'alpha', 'dev',
        'debug', 'error', 'fail', 'broken', 'bad', 'wrong',
        'noreply', 'donotreply', 'no-reply', 'bounce', 'mailer'
    ]
    
    # Vérifie si l'email contient des patterns interdits
    for pattern in forbidden_patterns:
        if pattern in local_part:
            return False
    
    # Patterns avec nombres suspects
    if re.match(r'^(test|fake|invalid|example|dummy|user|admin|temp)\d*$', local_part):
        return False
    
    # Emails trop courts (moins de 4 caractères)
    if len(local_part) < 4:
        return False
    
    # Emails trop longs (plus de 30 caractères) - assoupli
    if len(local_part) > 30:
        return False
    
    # Caractères répétitifs suspects (3+ identiques consécutifs)
    if re.search(r'(.)\1{2,}', local_part):
        return False
    
    # Patterns de lettres/chiffres suspects - assoupli pour noms réels
    if re.match(r'^[a-z]{1}\d+$', local_part):  # a1, b123, etc. (mais pas ab123)
        return False
    
    # Patterns de chiffres uniquement
    if re.match(r'^\d+$', local_part):  # 123456, etc.
        return False
    
    # Patterns avec uniquement des caractères répétés
    if re.match(r'^(.)\1+$', local_part):  # aaaa, bbbb, etc.
        return False
    
    # Doit contenir au moins une lettre
    if not re.search(r'[a-zA-Z]', local_part):
        return False
    
    return True

def validate_popular_email(email):
    """Validation pour les domaines populaires (Outlook, Yahoo, etc.)"""
    local_part = email.split('@')[0].lower()
    
    # Même logique que Gmail mais moins stricte
    fake_patterns = ['test', 'fake', 'invalid', 'example', 'dummy', 'nonexistent']
    
    for pattern in fake_patterns:
        if pattern in local_part:
            return False
    
    if len(local_part) < 2:
        return False
    
    return True

def check_email_exists_smtp(email):
    """Vérifie l'existence de l'email via SMTP (pour domaines moins connus)"""
    domain = email.split('@')[1]
    
    try:
        # Récupère les enregistrements MX
        mx_records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(mx_records[0].exchange)
        
        # Connexion SMTP
        server = smtplib.SMTP(timeout=10)
        server.set_debuglevel(0)
        server.connect(mx_record)
        server.helo('test.com')
        server.mail('test@test.com')
        
        # Test de l'adresse email
        code, message = server.rcpt(email)
        server.quit()
        
        # Codes de succès SMTP (250, 251, 252)
        return code in [250, 251, 252]
        
    except Exception as e:
        logger.warning(f"Erreur SMTP pour {email}: {e}")
        return False

def validate_email_exists(email):
    """
    Validation rapide pour vérifier l'existence d'un email
    Retourne True/False sans lever d'exception
    """
    try:
        validate_real_email(email)
        return True
    except ValidationError:
        return False

def validate_email_simple(email):
    """
    Validation simple d'email - alias pour validate_real_email
    """
    return validate_real_email(email)
