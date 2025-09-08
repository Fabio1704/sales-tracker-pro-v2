from django.contrib.auth.models import User
from rest_framework import serializers
from .validators_simple import validate_real_email

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[validate_real_email])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff']
        read_only_fields = ['id', 'is_staff']
    
    def validate_email(self, value):
        """Validation personnalisée pour l'email lors de la modification"""
        # Vérification d'unicité (exclut l'utilisateur actuel si modification)
        queryset = User.objects.filter(email__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        
        # Validation de l'existence réelle de l'email
        try:
            validate_real_email(value)
        except Exception as e:
            raise serializers.ValidationError(f"Email invalide: {str(e)}")
        
        return value.lower()

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(validators=[validate_real_email])

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'is_active']

    def validate_email(self, value):
        """Validation personnalisée pour l'email"""
        # Vérification d'unicité
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        
        # Validation de l'existence réelle de l'email
        try:
            validate_real_email(value)
        except Exception as e:
            raise serializers.ValidationError(f"Email invalide: {str(e)}")
        
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user