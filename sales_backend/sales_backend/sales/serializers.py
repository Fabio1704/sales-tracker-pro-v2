from rest_framework import serializers
from .models import ModelProfile, DailySale, UserSession
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.db.models import Sum, Max
from datetime import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class UserWithStatsSerializer(serializers.ModelSerializer):
    total_models = serializers.SerializerMethodField()
    total_sales = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    last_logout = serializers.SerializerMethodField()
    connection_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 
                 'date_joined', 'total_models', 'total_sales', 'total_revenue', 'last_activity', 
                 'is_online', 'last_login', 'last_logout', 'connection_status', 'password']
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_total_models(self, obj):
        return ModelProfile.objects.filter(owner=obj).count()

    def get_total_sales(self, obj):
        models = ModelProfile.objects.filter(owner=obj)
        total = 0
        for model in models:
            total += DailySale.objects.filter(model_profile=model).count()
        return total

    def get_total_revenue(self, obj):  # ← AJOUTEZ CETTE MÉTHODE
        models = ModelProfile.objects.filter(owner=obj)
        total_revenue = 0
        for model in models:
            sales_aggregate = DailySale.objects.filter(
                model_profile=model
            ).aggregate(total=Sum('amount_usd'))
            if sales_aggregate['total']:
                total_revenue += sales_aggregate['total']
        return total_revenue

    def get_last_activity(self, obj):  # ← COMPLÉTEZ CETTE MÉTHODE
        models = ModelProfile.objects.filter(owner=obj)
        last_activity = None
        
        for model in models:
            last_sale = DailySale.objects.filter(
                model_profile=model
            ).order_by('-date').first()
            
            if last_sale and (not last_activity or last_sale.date > last_activity):
                last_activity = last_sale.date
        
        return last_activity

    def create(self, validated_data):  # ← AJOUTEZ CETTE MÉTHODE POUR LA CRÉATION
        # Hash du mot de passe avant la création
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user

    def update(self, instance, validated_data):  # ← AJOUTEZ CETTE MÉTHODE POUR LA MÀJ
        # Gestion du mot de passe lors de la mise à jour
        password = validated_data.pop('password', None)
        
        user = super().update(instance, validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user

    def get_is_online(self, obj):
        """Obtenir le statut de connexion de l'utilisateur"""
        try:
            session = UserSession.objects.get(user=obj)
            return session.is_online
        except UserSession.DoesNotExist:
            return False

    def get_last_login(self, obj):
        """Obtenir la dernière connexion de l'utilisateur"""
        try:
            session = UserSession.objects.get(user=obj)
            return session.last_login
        except UserSession.DoesNotExist:
            return obj.last_login

    def get_last_logout(self, obj):
        """Obtenir la dernière déconnexion de l'utilisateur"""
        try:
            session = UserSession.objects.get(user=obj)
            return session.last_logout
        except UserSession.DoesNotExist:
            return None

    def get_connection_status(self, obj):
        """Obtenir le statut de connexion formaté"""
        try:
            session = UserSession.objects.get(user=obj)
            return session.last_seen_display
        except UserSession.DoesNotExist:
            return "Jamais connecté"

class DailySaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySale
        fields = ['id', 'model_profile', 'date', 'amount_usd', 'created_at']
        read_only_fields = ['id', 'created_at']

class ModelProfileSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    daily_sales = DailySaleSerializer(many=True, read_only=True)
    initials = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ModelProfile
        fields = [
            'id', 'owner', 'first_name', 'last_name', 'profile_photo', 
            'profile_photo_url', 'initials', 'created_at', 'daily_sales'
        ]
        read_only_fields = ['id', 'owner', 'created_at']

    def get_initials(self, obj):
        return f"{obj.first_name[0]}{obj.last_name[0]}".upper()

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            return obj.profile_photo.url
        return None

class ModelProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelProfile
        fields = ['first_name', 'last_name', 'profile_photo']

class StatsSerializer(serializers.Serializer):
    gross_usd = serializers.FloatField()
    fees_usd = serializers.FloatField()
    net_usd = serializers.FloatField()
    days_with_sales = serializers.IntegerField()